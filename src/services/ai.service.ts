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
          const interviewObj = JSON.parse(influencer.aiInterview);
          if (isUserAlexsandro) {
            mentorName = 'Kowalski';
            pronounGuidelines = 'Trate o criador diretamente pelo nome Alexsandro, aja como seu mentor virtual e engenheiro de IA de confiança (Kowalski).';
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

      DÊ 3 ORDENS DIRETAS. RETORNE ESTRITAMENTE EM JSON.`;oUrl": "...", "thumbnail": "..."}] 
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
          const parsed = JSON.parse(influencer.aiInterview);
          if (isUserAlexsandro) {
            mentorName = 'Kowalski';
            pronounGuidelines = 'Trate o criador diretamente pelo nome Alexsandro, aja como seu mentor virtual e engenheiro de IA de confiança (Kowalski).';
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
}
