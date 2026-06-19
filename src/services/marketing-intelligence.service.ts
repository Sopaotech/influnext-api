import { prisma } from '../lib/prisma';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export type AnalysisType =
  | 'A1' | 'A2' | 'A3' | 'A4' | 'A5'  // Análises de posicionamento/campanha/crescimento
  | 'O1' | 'O2' | 'O3' | 'O4';         // Análises operacionais/concorrenciais

export interface MarketingAnalysisInput {
  companyId: string;
  companyName: string;
  segment: string;
  campaignBudget?: string;
  salesGoal?: string;
  averageTicket?: string;
  instagramPositioning?: string;
  planTier: string;
  analysisType: AnalysisType;
  // Campos extras livres por tipo de análise
  extras?: Record<string, string>;
}

// ─── Templates por tipo de análise ────────────────────────────────────────────

const ANALYSIS_TEMPLATES: Record<AnalysisType, { title: string; prompt: string }> = {
  A1: {
    title: 'Diagnóstico de Posicionamento',
    prompt: `Analise o posicionamento desta empresa no mercado de influência. 
Avalie: diferenciação, proposta de valor, mensagem principal e alinhamento com o público.`,
  },
  A2: {
    title: 'Estratégia de Campanha de Influência',
    prompt: `Crie uma estratégia de campanha com influenciadores para esta empresa.
Inclua: tipo ideal de criador, nicho-alvo, formato de conteúdo recomendado, KPIs esperados e budget allocation.`,
  },
  A3: {
    title: 'Análise de Crescimento e Escala',
    prompt: `Identifique as principais alavancas de crescimento para esta empresa.
Considere: expansão de canais, sazonalidade, frequência de campanhas e potencial de escala do budget.`,
  },
  A4: {
    title: 'Estratégia de Retenção de Audiência',
    prompt: `Analise como esta empresa pode aumentar a retenção e o engajamento do seu público via influenciadores.
Aborde: consistência de conteúdo, fidelização, co-criação e programas de longo prazo.`,
  },
  A5: {
    title: 'Diagnóstico de Precificação e ROI',
    prompt: `Avalie se o modelo de precificação desta empresa está alinhado com o mercado de influência.
Analise: ticket médio, expectativa de ROI por campanha, benchmark de CPM/CPC e fee de escrow de 15%.`,
  },
  O1: {
    title: 'Resposta Competitiva',
    prompt: `Analise o cenário competitivo desta empresa no segmento. 
Identifique: concorrentes diretos, pontos de vulnerabilidade, oportunidades de diferenciação via influenciadores.`,
  },
  O2: {
    title: 'Auditoria de Presença Digital',
    prompt: `Faça uma auditoria de presença digital desta empresa.
Avalie: consistência de marca, qualidade de conteúdo nas redes, gaps de posicionamento e quick wins.`,
  },
  O3: {
    title: 'Mapeamento de Nichos de Criadores',
    prompt: `Identifique os nichos de criadores de conteúdo mais adequados para esta empresa.
Considere: segmento, público-alvo, ticket médio e objetivo de campanha.`,
  },
  O4: {
    title: 'Plano de Ativação com Nano e Microinfluenciadores',
    prompt: `Crie um plano de ativação com nano e microinfluenciadores (1K-50K seguidores).
Inclua: critérios de seleção, frequência de contato, estrutura de briefing e métricas de sucesso.`,
  },
};

// ─── Serviço ───────────────────────────────────────────────────────────────────

export class MarketingIntelligenceService {
  /**
   * Executa uma análise estratégica de marketing usando IA e salva no banco.
   */
  static async runAnalysis(input: MarketingAnalysisInput): Promise<{
    id: string;
    analysisType: string;
    title: string;
    output: string;
    createdAt: Date;
  }> {
    const template = ANALYSIS_TEMPLATES[input.analysisType];
    if (!template) {
      throw new Error(`Tipo de análise inválido: ${input.analysisType}`);
    }

    // Constrói o contexto da empresa para o prompt
    const context = [
      `Empresa: ${input.companyName}`,
      `Segmento: ${input.segment || 'Não informado'}`,
      input.campaignBudget && `Budget de campanha: ${input.campaignBudget}`,
      input.salesGoal && `Objetivo de vendas: ${input.salesGoal}`,
      input.averageTicket && `Ticket médio: ${input.averageTicket}`,
      input.instagramPositioning && `Posicionamento atual no Instagram: ${input.instagramPositioning}`,
      ...(input.extras
        ? Object.entries(input.extras).map(([k, v]) => `${k}: ${v}`)
        : []),
    ]
      .filter(Boolean)
      .join('\n');

    const fullPrompt = `
# Consultoria Estratégica InfluNext — ${template.title}

## Contexto da Empresa
${context}

## Tarefa
${template.prompt}

## Instruções de Formato
- Use Markdown com títulos, bullets e negrito para facilitar leitura
- Seja direto, sênior e acionável — sem introduções genéricas
- Cada recomendação deve ter um próximo passo concreto
- Finalize com "3 Ações para Esta Semana" em formato de lista numerada
`.trim();

    // Chama a API de IA (integração com OpenAI ou OpenRouter via env)
    const aiOutput = await MarketingIntelligenceService.callAI(fullPrompt, input.planTier);

    // Salva no banco
    const record = await prisma.marketingAnalysis.create({
      data: {
        companyId: input.companyId,
        analysisType: input.analysisType,
        inputs: JSON.stringify({
          segment: input.segment,
          campaignBudget: input.campaignBudget,
          salesGoal: input.salesGoal,
          averageTicket: input.averageTicket,
          instagramPositioning: input.instagramPositioning,
          extras: input.extras,
        }),
        output: aiOutput,
        planTier: input.planTier,
      },
    });

    return {
      id: record.id,
      analysisType: record.analysisType,
      title: template.title,
      output: record.output,
      createdAt: record.createdAt,
    };
  }

  /**
   * Retorna o histórico de análises de uma empresa (paginado, 10 por página).
   */
  static async getHistory(companyId: string, page = 1) {
    const pageSize = 10;
    const [items, total] = await Promise.all([
      prisma.marketingAnalysis.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          analysisType: true,
          planTier: true,
          createdAt: true,
          // Output resumido (primeiros 300 chars) para listagem
          output: true,
        },
      }),
      prisma.marketingAnalysis.count({ where: { companyId } }),
    ]);

    return {
      data: items.map((item) => ({
        ...item,
        outputPreview: item.output.substring(0, 300) + (item.output.length > 300 ? '...' : ''),
        title: ANALYSIS_TEMPLATES[item.analysisType as AnalysisType]?.title ?? item.analysisType,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /**
   * Retorna uma análise completa pelo ID.
   */
  static async getById(id: string, companyId: string) {
    const record = await prisma.marketingAnalysis.findFirst({
      where: { id, companyId },
    });

    if (!record) return null;

    return {
      ...record,
      title: ANALYSIS_TEMPLATES[record.analysisType as AnalysisType]?.title ?? record.analysisType,
      inputs: JSON.parse(record.inputs),
    };
  }

  // ─── Integração com IA ──────────────────────────────────────────────────────

  private static async callAI(prompt: string, planTier: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.OPENROUTER_API_KEY
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1';

    // Planos FREE usam modelo mais leve; PRO+ usam GPT-4o
    const model = ['PRO', 'MASTER', 'ENTERPRISE'].includes(planTier)
      ? 'gpt-4o'
      : 'gpt-4o-mini';

    if (!apiKey) {
      // Fallback de desenvolvimento — retorna mock estruturado
      return MarketingIntelligenceService.mockOutput(prompt, planTier);
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Você é um consultor estratégico sênior especializado em marketing de influência no Brasil. Responda sempre em português brasileiro, com precisão e objetividade.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Erro na API de IA: ${response.status} - ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    return data.choices[0]?.message?.content ?? 'Não foi possível gerar a análise.';
  }

  // ─── Mock para desenvolvimento sem chave de API ─────────────────────────────

  private static mockOutput(prompt: string, planTier: string): string {
    return `## Análise Estratégica (Modo Demo — ${planTier})

> ⚠️ Esta é uma análise de demonstração. Configure **OPENAI_API_KEY** ou **OPENROUTER_API_KEY** para ativar a IA real.

### Diagnóstico Inicial
Com base nos dados da empresa, identificamos **3 pontos críticos** de atenção no posicionamento atual.

### Recomendações Prioritárias

**1. Clareza de mensagem**
A proposta de valor ainda precisa ser traduzida em linguagem de criador de conteúdo — o que o influenciador vai falar sobre você em 15 segundos?

**2. Budget allocation**
Distribua entre: 60% criadores de médio porte (10K–100K), 30% nano-influenciadores (alta conversão), 10% mega-influenciadores (awareness).

**3. Métricas de sucesso**
Defina antes da campanha: taxa de conversão mínima esperada, CPV (custo por visualização) e CPL (custo por lead).

### 3 Ações para Esta Semana
1. Escrever o briefing padrão que será enviado para todos os influenciadores desta campanha
2. Mapear 10 criadores no nicho alvo e analisar os últimos 3 posts de cada um
3. Definir o orçamento por creator tier e aprovar internamente`;
  }
}
