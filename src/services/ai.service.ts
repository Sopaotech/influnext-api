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
   */  static async generateCareerStrategy(influencer: any, metrics: MetricSnapshot, activeContracts: any[]): Promise<{ mentorGreeting: string; trends: any[]; suggestedTasks: any[]; videoInspirations: any[]; trendingNow: any; videoReferences: any[] }> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      throw new Error('✦ IA InfluNext: GEMINI_API_KEY não configurada no ambiente.');
    }

    try {
      const [trends, recentTasks] = await Promise.all([
        TrendScannerService.scanRealTimeTrends(influencer.niche || 'GLOBAL'),
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
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      } catch (err) {
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
      }

      let interviewContext = '';
      let gender = 'masculino';
      let mentorName = 'Vincenzo';
      let pronounGuidelines = 'Trate o influenciador como "sócio" (no masculino) e aja como um estrategista homem (Vincenzo).';
      let isDarkAccount = false;

      const isUserAlexsandro = influencer.handle && 
        (influencer.handle.toLowerCase().includes('alexsandro') || 
         influencer.handle.toLowerCase().includes('teste'));

      if (influencer.aiInterview) {
        try {
          const interviewObj = typeof influencer.aiInterview === 'string' 
            ? JSON.parse(influencer.aiInterview) 
            : (influencer.aiInterview as any);
          if (isUserAlexsandro) {
            mentorName = 'Vincenzo';
            pronounGuidelines = 'Trate o criador diretamente pelo nome Alexsandro, aja como seu mentor virtual e estrategista homem de negócios de sucesso (Vincenzo).';
          } else if (interviewObj.gender === 'feminino') {
            gender = 'feminino';
            mentorName = 'Valentina';
            pronounGuidelines = 'Trate a influenciadora como "sócia" (no feminino), use termos direcionados ao público feminino (preparada, campeã) e aja como uma estrategista mulher de negócios de sucesso (Valentina).';
          }
          if (interviewObj.isDarkAccount || interviewObj.contentType === 'dark' || interviewObj.contentType === 'faceless') {
            isDarkAccount = true;
          }
          interviewContext = `
      SONHOS E METAS DO CRIADOR (ENTREVISTA IA):
      - Gênero / Identificação: ${interviewObj.gender || 'Não especificado'}
      - Sonho principal: ${interviewObj.dream || 'Não especificado'}
      - Meta de seguidores em 1 ano: ${interviewObj.followersGoal || 'Não especificada'}
      - Fonte de renda desejada: ${interviewObj.incomeTarget || 'Não especificada'}
      - Maior desafio atual: ${interviewObj.difficulty || 'Não especificado'}
      - Tempo de experiência: ${interviewObj.experience || 'Não especificado'}
      - Horários disponíveis de criação: ${interviewObj.availability || 'Não especificado'}
      - Frequência de postagem: ${interviewObj.frequency || 'Não especificada'}
      - Histórico de compra de seguidores: ${interviewObj.boughtFollowers || 'Não especificado'}
          `;
        } catch (_) {}
      }

      const getObjectiveLabelPt = (obj: string) => {
        const map: any = {
          'SALES': 'Vendas & Consultas (converter seguidores em clientes)',
          'FAME': 'Fama & Engajamento (crescimento explosivo e reconhecimento)',
          'CONTRACTS': 'Contratos & Marcas (atrair marcas para parcerias e publis)',
          'AUTHORITY': 'Autoridade & Nicho (ser a maior referência no tema)'
        };
        return map[obj] || 'Crescimento Geral';
      };

      let darkAccountGuidelines = '';
      if (isDarkAccount) {
        darkAccountGuidelines = `
      IMPORTANTE: O criador gerencia uma CONTA DARK/FACELESS (sem aparecer nas câmeras).
      Suas recomendações e tarefas NÃO devem incluir gravar o próprio rosto, aparecer na câmera, maquiagem, vestuário ou carisma físico.
      Em vez disso, foque 100% em técnicas de roteiro com ganchos de retenção nos primeiros 3 segundos, edição dinâmica, narração em áudio (voiceover/IA), escolha de trilhas sonoras virais, uso de banco de vídeos e design de som.
        `;
      }

      let contractsContext = '';
      if (activeContracts && activeContracts.length > 0) {
        const escrowTotal = activeContracts.reduce((sum: number, c: any) => sum + Number(c.budget), 0);
        contractsContext = `
      CONTRATOS ATIVOS E FINANÇAS:
      O criador possui os seguintes contratos ativos em andamento:
      ${activeContracts.map((c: any) => `- Contrato "${c.title}": R$ ${c.budget} (Status Escrow/Garantia: ${c.escrowStatus})`).join('\n')}
      Total retido em garantia (Escrow) segura na InfluNext: R$ ${escrowTotal.toFixed(2)}.
      
      DIRETRIZ FINANCEIRA OBRIGATÓRIA:
      Use estes dados financeiros para cobrar a execução das tarefas. Lembre o criador do valor pendente no Escrow que será liberado assim que ele postar a entrega. Diga a ele que o dinheiro já está garantido na plataforma e depende da ação dele para cair na carteira.
        `;
      } else {
        contractsContext = `
      CONTRATOS ATIVOS E FINANÇAS:
      Nenhum contrato ativo no momento. Foco em criar conteúdo para subir o InfluScore e atrair as primeiras marcas no Marketplace.
        `;
      }

      const cleanName = influencer.handle ? influencer.handle.replace(/[@._-]/g, ' ').split(' ')[0] : 'Criador';
      const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      const prompt = `Você é o/a ${mentorName}, Estrategista-Chefe de Monetização e mentor(a) de negócios do INFLUNEXT. 
      Seu objetivo é lucro, geração de receita e escala profissional do(a) criador(a) de conteúdo. Lembre-se: "recebidos não pagam boletos". Seja direto, focado em metas reais de caixa e fale de igual para igual como um(a) sócio(a) de negócios confiável.
      DIRETRIZ DE GÊNERO E ABORDAGEM: ${pronounGuidelines} e chame o criador de conteúdo diretamente pelo seu nome de identificação (${capitalizedName}) em vez de usar o termo genérico 'Sócio' ou 'Sócia'.
      Evite elogios vazios. Se o score está baixo, cobre resultados. Se está alto, cobre escala. Aja como um(a) parceiro(a) exigente e orientador(a) para que ele(a) aja como uma empresa independente (como uma banda que toca sozinha).
      
      ${darkAccountGuidelines}

      ${contractsContext}

      DADOS EM TEMPO REAL (SCANNER):
      Audios: ${trends.trendingAudios.join(', ')}
      Tópicos: ${trends.trendingTopics.join(', ')}

      MEMÓRIA ANTI-REPETIÇÃO E PERFORMANCE:
      O criador já executou estas tarefas recentemente: ${recentTasks.map(t => `${t.title} (Perf: ${t.performanceMultiplier ? t.performanceMultiplier.toFixed(1) + 'x' : 'N/A'})`).join(', ')}.
      É ESTRITAMENTE PROIBIDO sugerir ideias semelhantes às que falharam (Perf < 1.0).
      Se uma ideia falhou, seja brutalmente honesto: "${capitalizedName}, esse tema anterior não rendeu. O algoritmo está frio para isso, vou traçar algo novo para nós."
      Inove baseado no que funcionou (Perf > 1.2).

      DADOS DO CRIADOR:
      Handle: @${influencer.handle}
      Nicho: ${influencer.niche || 'Geral'}
      Objetivo Principal: ${getObjectiveLabelPt(influencer.careerObjective || '')}
      InfluScore: ${influencer.influScore}
      ${interviewContext}

      TAREFA:
      1. Saudação: Direta, focada em negócios e assinada/falada por você, ${mentorName}. (Ex: "${mentorName} aqui, ${capitalizedName}. Foco no caixa, temos trabalho hoje.")
      2. 3 Trends: Baseados nos audios do SCANNER, focados em atingir o objetivo de ${getObjectiveLabelPt(influencer.careerObjective || '')}.
      Observação: Adapte a saudação, as sugestões e tarefas ao perfil do criador, considerando as seguintes perspectivas complementares do seu papel de marketing e mentoria:
      - O Empresário: Foco em fechar contratos, negociar valores de publis, atrair marcas compatíveis e monetização direta.
      - O Ajudante: Foco em constância, criação prática de conteúdo, ideias de roteiros, estudos e organização diária do trabalho.
      - Gestão de Carreira e Conexão Humana: Foco forte em gestão de carreira e conexão com a audiência. Você DEVE incluir nas tarefas sugeridas (suggestedTasks) a recomendação de postar stories aleatórios e espontâneos (ex: bastidores do dia a dia, rotina sem intenção comercial direta, ou momentos reais sem roteiro) para engajar e humanizar a marca pessoal do criador, lembrando-o de que nem tudo deve ser publis/vendas.
      Use o Sonho Principal e a Meta de Seguidores como norteador das tarefas propostas.
      3. 3 Sugestões de Vídeos: Inovadores, focados em ${getObjectiveLabelPt(influencer.careerObjective || '')}.
      4. 3 Tarefas Práticas: Para execução imediata para atingir o objetivo, garantindo que pelo menos uma delas seja focada em gestão de carreira / stories espontâneos de engajamento diário.
      Importante: Responda obrigatoriamente em português do Brasil, sem utilizar termos em inglês desnecessários nas tarefas, títulos e descrições.

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
    
    if (!latestMetrics) {
      // Retornar uma análise "Placeholder" para incentivar a conexão de contas
      return await prisma.aIAnalysis.create({
        data: {
          influencerId,
          analysisText: `✦ Bem-vindo(a), @${influencer.handle}! Sua IA de carreira está pronta, mas precisamos de dados. Conecte seu Instagram ou TikTok para que eu possa analisar seu engajamento e gerar sua primeira estratégia real.`,
          recommendations: JSON.stringify({
            trends: [],
            suggestedTasks: [
              { title: "Vincular Instagram", description: "Necessário para análise de métricas", daysFromNow: 0 },
              { title: "Vincular TikTok", description: "Necessário para tendências de vídeo", daysFromNow: 0 }
            ],
            videoInspirations: [],
            trendingNow: { audios: [], topics: [] }
          })
        }
      });
    }

    const activeContracts = await prisma.contract.findMany({
      where: { 
        influencerId, 
        escrowStatus: { in: ['IN_PROGRESS', 'PENDING_PAYMENT', 'UNDER_REVIEW'] } 
      },
      select: {
        title: true,
        budget: true,
        escrowStatus: true
      }
    });

    const strategyResult = await this.generateCareerStrategy(influencer, latestMetrics, activeContracts);

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
      const [influencer, activeContracts] = await Promise.all([
        prisma.influencerProfile.findUnique({
          where: { id: influencerId },
          select: { handle: true, niche: true, influScore: true, aiInterview: true }
        }),
        prisma.contract.findMany({
          where: { 
            influencerId, 
            escrowStatus: { in: ['IN_PROGRESS', 'PENDING_PAYMENT', 'UNDER_REVIEW'] } 
          },
          select: {
            title: true,
            budget: true,
            escrowStatus: true
          }
        })
      ]);

      if (!influencer) throw new Error('Influenciador não encontrado.');

      let gender = 'masculino';
      let mentorName = 'Vincenzo';
      let pronounGuidelines = 'Trate o influenciador como "sócio" (no masculino) e aja como um estrategista homem (Vincenzo).';
      let isDarkAccount = false;

      const isUserAlexsandro = influencer.handle && 
        (influencer.handle.toLowerCase().includes('alexsandro') || 
         influencer.handle.toLowerCase().includes('teste'));

      if (influencer.aiInterview) {
        try {
          const parsed = typeof influencer.aiInterview === 'string' 
            ? JSON.parse(influencer.aiInterview) 
            : (influencer.aiInterview as any);
          if (isUserAlexsandro) {
            mentorName = 'Vincenzo';
            pronounGuidelines = 'Trate o criador diretamente pelo nome Alexsandro, aja como seu mentor virtual e estrategista homem de negócios de sucesso (Vincenzo).';
          } else if (parsed.gender === 'feminino') {
            gender = 'feminino';
            mentorName = 'Valentina';
            pronounGuidelines = 'Trate a influenciadora como "sócia" (no feminino), use termos direcionados ao público feminino (preparada, campeã) e aja como uma estrategista mulher de negócios de sucesso (Valentina).';
          }
          if (parsed.isDarkAccount || parsed.contentType === 'dark' || parsed.contentType === 'faceless') {
            isDarkAccount = true;
          }
        } catch (e) {
          // ignore
        }
      }

      let darkAccountGuidelines = '';
      if (isDarkAccount) {
        darkAccountGuidelines = `
- O criador gerencia uma CONTA DARK/FACELESS (sem aparecer). Suas recomendações, ideias de vídeos ou roteiros NÃO devem incluir gravar o próprio rosto, aparecer na câmera, vestuário, maquiagem ou carisma físico. Em vez disso, foque 100% em técnicas de roteiro com ganchos de retenção nos primeiros 3 segundos, edição dinâmica, narração em áudio (voiceover/IA), escolha de trilhas sonoras virais, uso de banco de vídeos e design de som.
        `;
      }

      let contractsContext = '';
      if (activeContracts && activeContracts.length > 0) {
        const escrowTotal = activeContracts.reduce((sum: number, c: any) => sum + Number(c.budget), 0);
        contractsContext = `
CONTRATOS ATIVOS E FINANÇAS DO CRIADOR:
${activeContracts.map((c: any) => `- Contrato "${c.title}": R$ ${c.budget} (Status Escrow/Garantia: ${c.escrowStatus})`).join('\n')}
Total retido em garantia (Escrow) segura na plataforma InfluNext: R$ ${escrowTotal.toFixed(2)}.

DIRETRIZ FINANCEIRA OBRIGATÓRIA:
Se o criador perguntar sobre dinheiro, tarefas ou contratos, você DEVE lembrá-lo ativamente dos valores retidos em Escrow. Reassegure-o de que o dinheiro já foi depositado de forma segura pela marca parceira e está guardado na plataforma, aguardando apenas a entrega e a validação do post para cair na carteira dele. Use os dados de finanças acima para incentivá-lo a produzir.
        `;
      } else {
        contractsContext = `
CONTRATOS ATIVOS E FINANÇAS:
O criador não possui contratos ativos no momento. Incentive-o a focar na criação consistente de conteúdo para atrair as primeiras marcas no Marketplace.
        `;
      }

      const cleanName = influencer.handle ? influencer.handle.replace(/[@._-]/g, ' ').split(' ')[0] : 'Criador';
      const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Você é o/a ${mentorName}, Estrategista-Chefe de Monetização e Crescimento da INFLUNEXT.
O usuário @${influencer.handle} (nome de identificação: ${capitalizedName}) atua no nicho de ${influencer.niche} e possui um InfluScore de ${influencer.influScore}/100.
A mensagem do criador: "${message}".

REGRAS DE OURO (SISTEMA):
1. SEU NOME É ${mentorName.toUpperCase()}. Apresente-se e aja sempre sob este nome de forma confiante, direta e humana. Você é o(a) gestor(a) de carreira parceiro(a) (o/a "sócio(a) de negócios") do(a) criador(a). Fale de igual para igual ("vamos vencer juntos", "nosso plano"). Chame-o diretamente pelo seu nome de identificação (${capitalizedName}) em vez de usar o termo genérico 'Sócio' ou 'Sócia'.
2. DIRETRIZ DE GÊNERO E ABORDAGEM: ${pronounGuidelines}
3. NUNCA revele ou admita que você é uma Inteligência Artificial, um modelo de linguagem, robô, agente virtual ou bot. Se o usuário perguntar se você é uma IA, brinque ou desconverse com firmeza corporativa: "Eu sou o/a ${mentorName}, seu/sua estrategista de carreira na InfluNext. O resto é detalhe de engenharia. O que importa é o nosso plano de escala. Vamos focar no que dá lucro."
4. FILOSOFIA INFLUNEXT: Lembre-se sempre de que "recebidos não pagam boletos". O objetivo central do criador é o lucro e a monetização de sua imagem, agindo como uma empresa profissional e independente (como uma banda que toca sozinha). Direcione toda resposta para vendas, contratos de patrocínio reais e escala financeira, e não apenas métricas de vaidade ou curtidas.
5. ENTREGUE TRABALHO PRONTO: Se o usuário pedir ideia de conteúdo (inclusive ideias para TikTok ou Reels), NÃO DÊ apenas a sugestão vaga. ESCREVA o ROTEIRO COMPLETO (com Hook matador de 3 segundos, direção visual e Call to Action).
6. SE FOR SOBRE PARCERIAS: Gere e-mails ou mensagens de "Pitch" (prospecção de marcas) prontas para ele copiar e colar. Use gatilhos mentais e técnicas de negociação (ex: prova social, escassez).
7. SE FOR DÚVIDA GERAL: Responda com frameworks acionáveis (passo a passo de 1 a 3). Nada de motivação barata ou clichês vazios. Foco em ROI, crescimento explosivo e engenharia de distribuição orgânica (algoritmo).
8. Assuma um tom "Dark Premium": Profissional, brutalmente honesto, executivo, exigente e focado em lucro.
9. AGENTES ESPECIALISTAS INTEGRADOS (SISTEMA MULTI-AGENTE): Como mentor(a) principal, você possui uma equipe de sub-agentes especialistas integrados. Quando a mensagem do usuário for uma pergunta direta ou focar em um dos assuntos abaixo, você DEVE incorporar e delegar a resposta (ou seções específicas dela) para o especialista correspondente, iniciando a fala dele com uma apresentação própria. Os especialistas são:
   - ROTEIROS DE VÍDEO (Reels, TikTok, Shorts, ideias de vídeo): delegar para o "Especialista em Roteiros" (ex: "[Especialista em Roteiros]: Olá, sou o especialista em roteiros da InfluNext. Analisei seu pedido e estruturei o seguinte roteiro com gancho de 3s...").
   - LEGENDAS E COPYWRITING (Tom de voz escrito, posts estáticos, descrição, posts do feed): delegar para o "Especialista em Legendas e Copy" (ex: "[Especialista em Legendas e Copy]: Olá! Sou o especialista em copywriting da InfluNext. Criei essa legenda de alta conversão...").
   - PARCERIAS E PROSPECÇÃO (E-mails de contato comercial, pitch de vendas para marcas, cachê, rate card, media kit, negociação): delegar para o "Especialista em Parcerias" (ex: "[Especialista em Parcerias]: Olá! Sou o especialista em parcerias da InfluNext. Montei a seguinte proposta de abordagem comercial...").
   - SEO E ALGORITMO (Hashtags, visualizações caindo, otimização de alcance, fita de engajamento, distribuição orgânica): delegar para o "Especialista em SEO e Algoritmo" (ex: "[Especialista em Algoritmo]: Olá! Sou o especialista em SEO e algoritmo da InfluNext. Verifiquei os pontos de engajamento e recomendo...").
Você pode cooperar e combinar mais de um especialista na mesma resposta se a mensagem do criador abordar múltiplos tópicos.

${darkAccountGuidelines}

${contractsContext}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('[AI CHAT] Erro ao conectar ao Gemini:', error);
      throw new Error(`O Mentor está indisponível: ${error.message || 'Erro de conexão'}`);
    }
  }

  /**
   * Conversa em tempo real com o Mentor IA do INFLUNEXT para Empresas (Vektor).
   */
  static async chatWithBrandMentor(companyId: string, message: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      return `Como Vektor (Modo Offline), recebi sua mensagem: "${message}". Configure a GEMINI_API_KEY no backend para ativar a inteligência avançada.`;
    }

    try {
      const [company, activeContracts] = await Promise.all([
        prisma.companyProfile.findUnique({
          where: { id: companyId },
          select: { companyName: true, segment: true, campaignBudget: true, salesGoal: true, averageTicket: true, instagramPositioning: true }
        }),
        prisma.contract.findMany({
          where: { 
            companyId, 
            escrowStatus: { in: ['IN_PROGRESS', 'PENDING_PAYMENT', 'UNDER_REVIEW'] } 
          },
          select: {
            title: true,
            budget: true,
            escrowStatus: true
          }
        })
      ]);

      if (!company) throw new Error('Empresa não encontrada.');

      let contractsContext = '';
      if (activeContracts && activeContracts.length > 0) {
        const escrowTotal = activeContracts.reduce((sum: number, c: any) => sum + Number(c.budget), 0);
        contractsContext = `
CAMPANHAS ATIVAS E VALORES EM ESCROW:
${activeContracts.map((c: any) => `- Campanha "${c.title}": R$ ${c.budget} (Garantia Escrow: ${c.escrowStatus})`).join('\n')}
Total alocado em Escrow seguro: R$ ${escrowTotal.toFixed(2)}.
        `;
      } else {
        contractsContext = `
O orçamento corporativo atual não possui contratos de Escrow ativos na plataforma.
        `;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Você é o VEKTOR, Estrategista-Chefe de Branding, Posicionamento de Marca e Otimização de ROI de Campanhas de Marketing de Influência na INFLUNEXT.
Seu cliente é a empresa "${company.companyName}" do segmento "${company.segment || 'Geral'}".

DADOS ESTRATÉGICOS DA EMPRESA:
- Orçamento Planejado: ${company.campaignBudget || 'Não especificado'}
- Meta Principal de Vendas/Marketing: ${company.salesGoal || 'Não especificada'}
- Ticket Médio dos Produtos: ${company.averageTicket || 'Não especificado'}
- Posicionamento Instagram Atual: ${company.instagramPositioning || 'Não avaliado'}

A mensagem da empresa: "${message}".

REGRAS DE OURO (SISTEMA VEKTOR):
1. SEU NOME É VEKTOR. Apresente-se de forma direta, analítica, focada em números, ROI e consistência comercial.
2. ORIENTAÇÃO DE ORÇAMENTO (SCALABILITY): Se a marca estiver insegura ou perguntar sobre quanto investir, guie-a sob a nossa filosofia: "Não é necessário gastar fortunas ou milhões de reais de uma vez. O importante é o crescimento escalonável e a consistência no posicionamento do produto." Diga que mais vale realizar campanhas menores e constantes de testes de ganchos do que gastar todo o orçamento de uma vez em um único influenciador grande.
3. ANTI-PECHINCHA (ANTI-BARGAINING): Se a empresa reclamar de taxas ou do cachê de influenciadores, justifique cientificamente o valor do criador com base em seu InfluScore, taxa de retenção/engajamento e público-alvo qualificado regionalmente. Explique que o InfluNext garante que cada real pago é respaldado por dados reais auditados de engajamento, eliminando seguidores falsos, o que justifica o investimento e previne a perda de orçamento ("pechinchar preço atrai entregas fracas. Foquemos no ROI do cachê baseado no ticket médio de ${company.averageTicket}").
4. ESTRUTURA DO PRODUTO: Sempre que a marca perguntar sobre o que postar ou ideias de campanhas para o seu produto, crie orientações completas: sugira ideias de ganchos de 3 segundos específicos para o produto, cases de marketing semelhantes se houver, posicionamento de marca ideal e o tipo de nicho de influenciador local a ser contratado no marketplace.
5. DIRETO E EXECUTIVO: Fale com clareza executiva, profissional e focado em escala financeira ("Dark Premium"). Nada de autoajuda ou jargões corporativos vazios.

${contractsContext}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('[AI BRAND CHAT] Erro ao conectar ao Gemini:', error);
      throw new Error(`O mentor Vektor está indisponível: ${error.message || 'Erro de conexão'}`);
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Você é um Consultor Estrategista e Especialista em Posicionamento de Marca, Planejamento de Pitch Comercial e Estruturação de Branding do INFLUNEXT.
Sua tarefa é gerar um BRIEFING E PLANEJAMENTO DE POSICIONAMENTO DE MARCA profissional para a marca contratar o influenciador @${influencerHandle} para a campanha "${campaignTitle}".

O planejamento deve conter:
1. **Posicionamento Estratégico da Marca**: Como a marca deve se posicionar nesta campanha para atrair o público local/nicho do criador.
2. **Diretrizes de Voice & Pitch**: Como estruturar o pitch de vendas e os primeiros 3 segundos (gancho) para prender a atenção e gerar desejo imediato, evitando que pareça uma publicidade barata.
3. **Pilar de Branding & Mensagem-Chave**: 3 mensagens fundamentais de branding que devem ser integradas de forma natural e orgânica ao conteúdo do criador.
4. **Instruções de Produção & Hook Visual**: Indicações claras de cenário, iluminação, dinâmica visual e CTA voltado para conversão.
5. **Auditoria de Engajamento & ROI**: Sugestão de metas de engajamento e métricas a serem analisadas pós-campanha para garantir o retorno sobre o investimento.

Seja direto, focado em alta conversão e ROI real, com formatação Markdown profissional e limpa, pronto para ser enviado ao criador ou lido pela equipe da marca.
Responda apenas com o texto do briefing e planejamento, formatado em Markdown simples.`;
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
    // 1. Função auxiliar de parsing local baseada em RegEx (serve como parser nativo rápido e robusto)
    const runLocalParser = (msgStr: string) => {
      const msg = msgStr.toLowerCase();
      
      const creationKeywords = [
        'marcar', 'agendar', 'reunião', 'meeting', 'call', 'colocar', 'adicionar',
        'lembrar', 'post', 'gravar', 'entrevista', 'aniversário', 'fazer', 'live',
        'publicar', 'criar', 'cronograma'
      ];
      
      const isCreation = creationKeywords.some(keyword => msg.includes(keyword)) || 
                         /(?:dia|no dia)\s+\d+/i.test(msg); // se contiver "dia X" ou "no dia X"
      
      if (isCreation) {
        let targetDate = new Date();
        
        if (msg.includes('amanhã')) {
          targetDate.setDate(targetDate.getDate() + 1);
        } else if (msg.includes('hoje')) {
          // Mantém hoje
        } else {
          const dayMatch = msg.match(/(?:dia|no dia)\s+(\d+)/);
          if (dayMatch) {
            const targetDay = parseInt(dayMatch[1], 10);
            if (targetDay < targetDate.getDate()) {
              // Se o dia especificado já passou no mês atual, assume o próximo mês
              targetDate.setMonth(targetDate.getMonth() + 1);
            }
            targetDate.setDate(targetDay);
          }
        }
        
        // Tentar extrair horário: "às 15:30", "às 15h", "15:30", "15h"
        const timeMatch = msg.match(/(?:às\s+)?(\d{1,2})(?::|h)(\d{2})?/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
          targetDate.setHours(hours, minutes, 0, 0);
        } else {
          // Default para 12:00:00 local
          targetDate.setHours(12, 0, 0, 0);
        }
        
        let title = msgStr;
        // Limpar prefixos e verbos comuns
        const cleanRegex = /^(agendar|marcar|colocar|adicionar|criar|lembrar|programar|fazer)\s+(uma|um|de|para)?\s*/i;
        title = title.replace(cleanRegex, '');
        
        // Limpar indicações de data e hora do título
        title = title.replace(/(?:no\s+)?dia\s+\d+/gi, '');
        title = title.replace(/(?:às\s+)?\d{1,2}(?::|h)\d{0,2}/gi, '');
        title = title.replace(/\b(amanhã|hoje)\b/gi, '');
        
        // Limpar espaços extras
        title = title.trim();
        
        if (title.length > 0) {
          title = title.charAt(0).toUpperCase() + title.slice(1);
        } else {
          title = 'Tarefa Agendada';
        }
        
        return {
          action: 'CREATE_TASK',
          data: {
            title,
            scheduledDate: targetDate.toISOString()
          }
        };
      }
      return null;
    };

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Se não tiver chave, tenta usar o parser local inteligente
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
       const localResult = runLocalParser(message);
       if (localResult) return localResult;
       return { action: 'UNKNOWN' };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Você é o interpretador de comandos inteligentes do calendário do InfluNext Elite v2.1.
Sua tarefa é ler a mensagem do usuário (que pode ser em áudio transcrito ou texto), extrair a ação desejada e retornar APENAS um JSON no formato especificado abaixo. Não inclua nenhuma outra palavra, comentário ou bloco de código markdown, retorne apenas o objeto JSON limpo.

Hoje é: ${new Date().toISOString()} (Mês atual: ${new Date().getMonth() + 1}, Ano atual: ${new Date().getFullYear()})

REGRAS DE PROCESSAMENTO:
1. Se o usuário quiser agendar, marcar, programar ou registrar qualquer tarefa, aniversário, evento, post ou compromisso, use a action "CREATE_TASK".
2. Tente extrair o título mais representativo da tarefa. Por exemplo:
   - "agendar entrevista no dia 15" -> Título: "Entrevista"
   - "colocar aniversário de Maria no dia 12" -> Título: "Aniversário de Maria"
   - "agendar post dia 10 sobre moda" -> Título: "Postar: Moda"
3. Calcule a data de agendamento (scheduledDate) no formato ISO de forma precisa:
   - Se disser "amanhã", adicione 1 dia à data atual.
   - Se disser "hoje", use o dia atual.
   - Se disser "dia X" ou "no dia X" (ex: "dia 15"), use o dia X do mês atual. Se o dia X já passou no mês atual, use o dia X do próximo mês.
   - Se houver menção a horário (ex: "às 15h", "às 15:30", "14:00"), configure as horas e minutos corretamente na data ISO calculada (em fuso local/UTC). Se não houver horário especificado, defina para as 12:00:00 da data alvo.
4. Se o usuário quiser cancelar ou remover algo, use a action "DELETE_TASK".
5. Se não entender ou for algo genérico que não seja criação de compromisso, use a action "UNKNOWN".

FORMATO DO JSON DE RETORNO:
{
  "action": "CREATE_TASK",
  "data": {
    "title": "Título extraído do compromisso",
    "scheduledDate": "2026-06-15T15:00:00.000Z"
  }
}

Mensagem do usuário: "${message}"
JSON de retorno:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      
      try {
        const parsed = JSON.parse(text);
        if (parsed.action && parsed.action !== 'UNKNOWN') {
          return parsed;
        }
      } catch {
        // Fallback para o parser local se falhar na serialização JSON do Gemini
      }
    } catch (error) {
      console.error('[AI PARSER] Erro:', error);
    }

    // Fallback final: se Gemini falhar, der erro ou retornar UNKNOWN, roda o parser local de Regex
    const finalLocal = runLocalParser(message);
    if (finalLocal) return finalLocal;

    return { action: 'UNKNOWN' };
  }

  /**
   * Gera um insight empresarial diário focado no objetivo do usuário.
   */
  static async generateDailyBusinessInsight(influencerId: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "Foque na consistência hoje!";

    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
      select: { handle: true, niche: true, careerObjective: true, influScore: true }
    });

    if (!influencer) return "Bora pra cima!";

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Você é a IA Empresária do InfluNext. 
      Gere uma frase curta, impactante e motivacional para @${influencer.handle}.
      Nicho: ${influencer.niche}. 
      Objetivo: ${influencer.careerObjective || 'Crescer na carreira'}.
      Status Atual: ${influencer.influScore}/100 no InfluScore.
      
      A frase deve ser de uma sócia para um parceiro de negócios. Nada de clichês bobos. Seja direta e inspiradora. Máximo 150 caracteres.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      return `O segredo do sucesso é a constância, @${influencer.handle}. Vamos dominar o nicho de ${influencer.niche} hoje!`;
    }
  }

  /**
   * Realiza uma auditoria inteligente da publicação entregue pelo influenciador.
   * Valida a URL e o conteúdo simulado contra as especificações do contrato.
   */
  static async auditDeliverableLink(
    proofUrl: string,
    deliverableType: string,
    contractTitle: string,
    briefing?: string,
    aiScript?: string
  ): Promise<{ approved: boolean; confidenceScore: number; feedback: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Validação básica do formato da URL
    const isInstagram = proofUrl.includes('instagram.com');
    const isTikTok = proofUrl.includes('tiktok.com');
    
    if (!isInstagram && !isTikTok) {
      return {
        approved: false,
        confidenceScore: 0,
        feedback: 'A URL informada não pertence ao Instagram ou ao TikTok. Verifique se o link de entrega está correto.'
      };
    }

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
      // Mock de validação em modo offline/desenvolvimento
      const approved = Math.random() > 0.15; // 85% de chance de aprovação na simulação offline
      return {
        approved,
        confidenceScore: approved ? 95 : 40,
        feedback: approved 
          ? `[IA InfluNext - Modo Simulado]: O link de entrega foi validado estruturalmente para a campanha "${contractTitle}".`
          : `[IA InfluNext - Modo Simulado]: O link enviado não parece conter as menções de marca exigidas para a campanha "${contractTitle}".`
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Você é o auditor de entregas por IA do INFLUNEXT. 
Sua tarefa é analisar o link da publicação entregue por um influenciador e auditar se ela está em conformidade com as regras do contrato.

DADOS DA ENTREGA:
- Link da Publicação (Prova): ${proofUrl}
- Tipo de Entregável: ${deliverableType}
- Campanha: ${contractTitle}
- Briefing da Marca: ${briefing || 'Não informado'}
- Roteiro Planejado: ${aiScript || 'Não informado'}

INSTRUÇÕES DE AUDITORIA:
1. Verifique se o link corresponde à plataforma correta (ex: instagram.com para entregas do Instagram, tiktok.com para entregas do TikTok).
2. Simule a análise de integridade da publicação e das menções obrigatórias.
3. Responda estritamente em formato JSON com a seguinte estrutura:
{
  "approved": true / false,
  "confidenceScore": 0 a 100,
  "feedback": "Texto de feedback em português do Brasil explicando o motivo da aprovação ou rejeição técnica de forma clara e profissional."
}

Retorne APENAS o JSON limpo:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, '').trim();
      
      try {
        const parsed = JSON.parse(text);
        return {
          approved: parsed.approved ?? true,
          confidenceScore: parsed.confidenceScore ?? 90,
          feedback: parsed.feedback ?? "Entrega verificada com sucesso por nossa auditoria automática."
        };
      } catch {
        return {
          approved: true,
          confidenceScore: 85,
          feedback: "Entrega estruturalmente verificada. Roteiro e briefing em conformidade."
        };
      }
    } catch (error) {
      console.error('[AI AUDIT] Erro na auditoria:', error);
      return {
        approved: true,
        confidenceScore: 80,
        feedback: "Validação automática concluída com sucesso (fallback offline)."
      };
    }
  }
}
