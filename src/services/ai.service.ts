import { MetricSnapshot } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addNotificationJob } from '../queues/notification.queue';
import { TrendScannerService } from './trend-scanner.service';

interface AIAnalysisResult {
  dailyInsight: string;
  actionPlan: string[];
  scorePrediction?: number;
}

export class AIService {
  /**
   * Gera uma estratégia de carreira real usando Gemini AI.
   */
  static async generateCareerStrategy(influencer: any, metrics: MetricSnapshot): Promise<{ mentorGreeting: string; trends: any[]; suggestedTasks: any[]; videoInspirations: any[]; trendingNow: any; videoReferences: any[] }> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      throw new Error('✦ IA InfluNext: GEMINI_API_KEY não configurada no ambiente.');
    }

    try {
      const [trends, recentTasks] = await Promise.all([
        TrendScannerService.scanRealTimeTrends(),
        prisma.task.findMany({
           where: { influencerId: influencer.id, isDone: true },
           take: 10,
           orderBy: { scheduledDate: 'desc' },
           select: { title: true, performanceMultiplier: true }
        })
      ]);

      const genAI = new GoogleGenerativeAI(apiKey);
      // Alterado para 'gemini-1.5-flash-latest' para maior compatibilidade ou fallback para 'gemini-pro'
      let model;
      try {
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      } catch (err) {
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
      }

      const prompt = `Você é um gestor de carreira "Workaholic" e altamente lógico do INFLUNEXT. 
      Seu objetivo é lucro e crescimento. Seja direto, seco e focado em metas. 
      Evite elogios vazios. Se o score está baixo, cobre resultados. Se está alto, cobre escala.

      DADOS EM TEMPO REAL (SCANNER):
      Audios: ${trends.trendingAudios.join(', ')}
      Tópicos: ${trends.trendingTopics.join(', ')}

      MEMÓRIA ANTI-REPETIÇÃO E PERFORMANCE:
      O influenciador já executou estas tarefas recentemente: ${recentTasks.map(t => `${t.title} (Perf: ${t.performanceMultiplier ? t.performanceMultiplier.toFixed(1) + 'x' : 'N/A'})`).join(', ')}.
      É ESTRITAMENTE PROIBIDO sugerir ideias semelhantes às que falharam (Perf < 1.0).
      Se uma ideia falhou, seja brutalmente honesto: "Esse não rendeu o esperado. O algoritmo está frio para esse tema, vamos mudar a estratégia para [TEMA NOVO]."
      Inove baseado no que funcionou (Perf > 1.2).

      DADOS DO CRIADOR:
      Handle: @${influencer.handle}
      Nicho: ${influencer.niche || 'Geral'}
      InfluScore: ${influencer.influScore}

      TAREFA:
      1. Saudação: Direta e focada em negócios. (Ex: "Foco no caixa, @${influencer.handle}. Temos trabalho.")
      2. 3 Trends: Baseados nos audios do SCANNER.
      3. 3 Sugestões de Vídeos: Inovadores, sem repetir a memória.
      4. 3 Tarefas Práticas: Para execução imediata.

      Responda em JSON puro:
      {
        "mentorGreeting": "...",
        "trends": [{"music": "...", "videoType": "...", "duration": "..."}],
        "suggestedTasks": [{"title": "...", "description": "...", "daysFromNow": 0}],
        "videoInspirations": [{"title": "...", "hook": "...", "whyItWorks": "...", "platform": "REELS"}],
        "trendingNow": { "audios": [...], "topics": [...] },
        "videoReferences": [{"title": "...", "videoUrl": "...", "thumbnail": "..."}] 
      }

      DÊ 3 ORDENS DIRETAS. RETORNE ESTRITAMENTE EM JSON.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
    
      try {
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          mentorGreeting: parsed.mentorGreeting,
          trends: parsed.trends || [],
          suggestedTasks: parsed.suggestedTasks || [],
          videoInspirations: parsed.videoInspirations || [],
          trendingNow: parsed.trendingNow || { audios: [], topics: [] },
          videoReferences: parsed.videoReferences || []
        };
      } catch (err) {
        console.error('[AI SERVICE] Erro ao parsear JSON do Gemini:', err, text);
        return {
          mentorGreeting: `Bora pra cima, @${influencer.handle}! Seu InfluScore é ${influencer.influScore}. Foque em consistência e qualidade visual.`,
          trends: [],
          suggestedTasks: [],
          videoInspirations: [],
          trendingNow: { audios: [], topics: [] },
          videoReferences: []
        };
      }
    } catch (error: any) {
      console.error('[AI SERVICE] Erro ao chamar Gemini:', error);
      // Se for 404, tentar novamente com gemini-pro se ainda não tentou
      throw new Error(`Falha na inteligência artificial: ${error.message || 'Erro desconhecido'}`);
    }
  }

  /**
   * Simula a análise de inteligência baseada nas métricas do influenciador.
   */
  static analyzeMetrics(metrics: MetricSnapshot, influencerHandle: string): AIAnalysisResult {
    const { followers, engagementRate, avgViews } = metrics;
    
    let insight = "";
    const actionPlan: string[] = [];

    if (engagementRate > 4) {
      insight = `🚀 @${influencerHandle}, seu engajamento de ${engagementRate}% está explodindo! O algoritmo está favorecendo seu conteúdo.`;
      actionPlan.push("Postar um carrossel educativo hoje para reter a nova audiência.");
    } else {
      insight = `💡 @${influencerHandle}, observamos uma leve queda no alcance. Sugerimos focar em Reels curtos com áudios em alta.`;
      actionPlan.push("Publicar 3 Reels com menos de 15 segundos nos próximos 2 dias.");
    }

    // Lógica dinâmica baseada no InfluScore (Simulando IA Real)
    // TODO: Integrar com OpenAI/Gemini API Key futuramente
    const score = metrics.avgViews; // Usando avgViews como proxy simplificado se influScore não estiver no snapshot
    
    return {
      dailyInsight: insight,
      actionPlan: actionPlan.slice(0, 3)
    };
  }

  /**
   * Gera uma recomendação semanal baseada na evolução do InfluScore
   */
  static getWeeklyStrategy(currentScore: number): string {
    if (currentScore > 700) {
      return "Sua autoridade é de elite. Foco total em monetização agressiva e parcerias com marcas de luxo. Aumente seu 'Rate Card' em 20%.";
    }
    if (currentScore < 300) {
      return "Foque 100% em consistência. Poste Stories diariamente e 3 Reels por semana para aquecer o algoritmo e subir seu score.";
    }
    return "Seu perfil está em crescimento estável. Melhore a retenção dos seus vídeos para alcançar o próximo nível de autoridade.";
  }

  /**
   * Gera e salva uma nova análise semanal no banco de dados.
   */
  static async generateWeeklyAnalysis(influencerId: string) {
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
      include: { metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' } } }
    });

    if (!influencer) throw new Error("Influenciador não encontrado.");

    // Otimização de Custo: Cache de 1 minuto
    const recentAnalysis = await prisma.aIAnalysis.findFirst({
      where: { 
        influencerId,
        generatedAt: { gte: new Date(Date.now() - 60 * 1000) }
      },
      orderBy: { generatedAt: 'desc' }
    });

    if (recentAnalysis) {
      return this.getLatestAnalysis(influencerId);
    }

    const latestMetrics = influencer.metricsHistory[0];
    
    if (!latestMetrics) throw new Error("Métricas insuficientes para análise.");

    const strategyResult = await this.generateCareerStrategy(influencer, latestMetrics);

    const analysis = await prisma.aIAnalysis.create({
      data: {
        influencerId,
        analysisText: strategyResult.mentorGreeting,
        recommendations: JSON.stringify({
          trends: strategyResult.trends,
          suggestedTasks: strategyResult.suggestedTasks,
          videoInspirations: strategyResult.videoInspirations,
          trendingNow: strategyResult.trendingNow
        })
      }
    });

    // Salvar Referências Visuais no Trend Vault (Ciclo de 20 dias)
    if (strategyResult.videoReferences && strategyResult.videoReferences.length > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 20);

      await prisma.trendReference.createMany({
        data: strategyResult.videoReferences.map((ref: any) => ({
          influencerId,
          title: ref.title,
          videoUrl: ref.videoUrl,
          thumbnail: ref.thumbnail,
          niche: influencer.niche || 'Geral',
          expiresAt
        }))
      });
    }

    // Salvar Tarefas Sugeridas para execução imediata no Dashboard
    if (strategyResult.suggestedTasks && strategyResult.suggestedTasks.length > 0) {
      await prisma.task.createMany({
        data: strategyResult.suggestedTasks.map((task: any) => {
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + (task.daysFromNow || 0));
          return {
            influencerId,
            title: task.title,
            description: task.description,
            fromAI: true,
            isDone: false,
            scheduledDate
          };
        })
      });
    }

    // Disparar Notificação Proativa via BullMQ
    await addNotificationJob(
      influencer.userId, 
      "✦ Sua nova estratégia de crescimento e biblioteca de referências estão prontas!", 
      "AI_STRATEGY"
    );

    return analysis;
  }

  /**
   * Busca a análise mais recente do banco de dados.
   */
  static async getLatestAnalysis(influencerId: string) {
    const analysis = await prisma.aIAnalysis.findFirst({
      where: { influencerId },
      orderBy: { generatedAt: 'desc' }
    });

    if (analysis && analysis.recommendations) {
      try {
        const parsed = JSON.parse(analysis.recommendations);
        // Retrocompatibilidade: se for um array, assume que são apenas trends
        if (Array.isArray(parsed)) {
          return {
            ...analysis,
            recommendations: { trends: parsed, suggestedTasks: [], videoInspirations: [] }
          };
        }
        return {
          ...analysis,
          recommendations: {
            trends: parsed.trends || [],
            suggestedTasks: parsed.suggestedTasks || [],
            videoInspirations: parsed.videoInspirations || []
          },
          trendVault: await prisma.trendReference.findMany({
            where: { 
              influencerId,
              expiresAt: { gte: new Date() }
            },
            orderBy: { createdAt: 'desc' }
          })
        };
      } catch {
        return {
          ...analysis,
          recommendations: { trends: [], suggestedTasks: [], videoInspirations: [] }
        };
      }
    }

    return analysis;
  }

  /**
   * Conversa em tempo real com o Mentor IA do InfluNext.
   */
  static async chatWithMentor(influencerId: string, message: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      return `Como Mentor InfluNext (Modo Offline), recebi sua mensagem: "${message}". Configure a GEMINI_API_KEY no backend para ativar a inteligência avançada.`;
    }

    try {
      const influencer = await prisma.influencerProfile.findUnique({
        where: { id: influencerId },
        select: { handle: true, niche: true, influScore: true }
      });

      if (!influencer) throw new Error('Influenciador não encontrado.');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      const prompt = `Você é o Mentor InfluNext, um consultor de carreira brutalmente honesto, focado em performance, conversão e dados para influenciadores digitais.
O usuário @${influencer.handle} atua no nicho de ${influencer.niche} e possui um InfluScore de ${influencer.influScore}/100.
O influenciador perguntou: "${message}".
Responda de forma direta, tática e acionável. Não use jargões motivacionais vazios. Fale como um expert de mercado dark premium.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('[AI CHAT] Erro ao conectar ao Gemini:', error);
      throw new Error(`O Mentor está indisponível: ${error.message || 'Erro de conexão'}`);
    }
  }

  /**
   * Gera um briefing profissional para uma campanha.
   */
  static async generateCampaignBriefing(influencerHandle: string, campaignTitle: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      return `[MOCK BRIEFING] Campanha: ${campaignTitle}. Objetivo: Aumentar conversão e autoridade. Deliverables: Conforme acordado. Foco em autenticidade.`;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      const prompt = `Você é um Especialista em Marketing de Influência do INFLUNEXT.
Sua tarefa é gerar um BRIEFING TÉCNICO E CRIATIVO para uma marca que deseja contratar o influenciador @${influencerHandle}.
Título da Campanha: "${campaignTitle}".

REGRAS DO BRIEFING:
1. Seja direto, profissional e focado em ROI.
2. Defina o tom de voz ideal para o criador.
3. Sugira 3 pontos-chave que NÃO podem faltar na menção à marca.
4. Defina diretrizes visuais rápidas (iluminação, cenário, hook inicial).
5. O texto deve ser pronto para ser enviado ao criador.

Responda apenas com o texto do briefing, formatado em Markdown simples.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('[AI BRIEFING] Erro:', error);
      return `Falha ao gerar briefing automático. Por favor, preencha manualmente as diretrizes para a campanha ${campaignTitle}.`;
    }
  }

  /**
   * Interpreta comandos em linguagem natural e retorna uma intenção estruturada.
   */
  static async parseNaturalCommand(message: string): Promise<{ action: string; data?: any }> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
       // Mock básico para desenvolvimento local
       if (message.toLowerCase().includes('marcar') || message.toLowerCase().includes('agendar')) {
          return { action: 'CREATE_TASK', data: { title: message, scheduledDate: new Date().toISOString() } };
       }
       return { action: 'UNKNOWN' };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      const prompt = `Você é o interpretador de comandos do InfluNext. 
Sua tarefa é extrair a intenção do usuário de uma mensagem de texto e retornar um JSON puro.

Hoje é: ${new Date().toISOString()}

REGRAS:
1. Se o usuário quiser agendar, marcar ou criar uma tarefa/evento, use action: "CREATE_TASK".
2. Tente extrair a data correta. Se ele disser "amanhã", calcule a data correta.
3. Se não entender, use action: "UNKNOWN".

EXEMPLO:
Input: "marcar live para amanhã às 15h"
Output: { "action": "CREATE_TASK", "data": { "title": "Live", "scheduledDate": "2024-05-06T15:00:00.000Z" } }

Input: "${message}"
Output:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      
      try {
        return JSON.parse(text);
      } catch {
        return { action: 'UNKNOWN' };
      }
    } catch (error) {
      console.error('[AI PARSER] Erro:', error);
      return { action: 'UNKNOWN' };
    }
  }
}
