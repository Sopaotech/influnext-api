import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { MarketingIntelligenceService, AnalysisType } from '../services/marketing-intelligence.service';

// ─── Plano de créditos por tier ───────────────────────────────────────────────

const TIER_CREDITS: Record<string, number> = {
  FREE: 1,
  PRO: 5,
  MASTER: 15,
  ENTERPRISE: Infinity,
};

// ─── Schema de validação ───────────────────────────────────────────────────────

const runAnalysisSchema = z.object({
  analysisType: z.enum(['A1', 'A2', 'A3', 'A4', 'A5', 'O1', 'O2', 'O3', 'O4'], {
    required_error: 'Tipo de análise obrigatório.',
  }),
  extras: z.record(z.string()).optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /marketing-intelligence/run
 * Executa uma nova análise de marketing para a empresa autenticada.
 */
export const runAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const role = (req as any).user!.role;

    if (role !== 'COMPANY') {
      res.status(403).json({ error: 'Acesso restrito a contas de empresa.' });
      return;
    }

    const parsed = runAnalysisSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    // Busca perfil e plano da empresa
    const [user, company] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true } }),
      prisma.companyProfile.findUnique({ where: { userId } }),
    ]);

    if (!company) {
      res.status(404).json({ error: 'Perfil empresarial não encontrado. Complete o onboarding primeiro.' });
      return;
    }

    const planTier = user?.subscriptionTier ?? 'FREE';
    const maxCredits = TIER_CREDITS[planTier] ?? 1;

    // Verifica créditos mensais restantes
    if (maxCredits !== Infinity) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const usedThisMonth = await prisma.marketingAnalysis.count({
        where: { companyId: company.id, createdAt: { gte: monthStart } },
      });

      if (usedThisMonth >= maxCredits) {
        res.status(429).json({
          error: `Limite de análises para o plano ${planTier} atingido (${maxCredits}/mês). Faça upgrade para continuar.`,
          currentPlan: planTier,
          used: usedThisMonth,
          limit: maxCredits,
        });
        return;
      }
    }

    // Executa a análise
    const result = await MarketingIntelligenceService.runAnalysis({
      companyId: company.id,
      companyName: company.companyName,
      segment: company.segment ?? 'Não informado',
      campaignBudget: company.campaignBudget ?? undefined,
      salesGoal: company.salesGoal ?? undefined,
      averageTicket: company.averageTicket ?? undefined,
      instagramPositioning: company.instagramPositioning ?? undefined,
      planTier,
      analysisType: parsed.data.analysisType as AnalysisType,
      extras: parsed.data.extras,
    });

    res.status(201).json({
      message: 'Análise gerada com sucesso!',
      analysis: result,
    });
  } catch (error) {
    console.error('[MARKETING INTELLIGENCE RUN ERROR]:', error);
    res.status(500).json({ error: 'Erro ao executar análise de marketing.' });
  }
};

/**
 * GET /marketing-intelligence/history?page=1
 * Retorna o histórico paginado de análises da empresa.
 */
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const role = (req as any).user!.role;

    if (role !== 'COMPANY') {
      res.status(403).json({ error: 'Acesso restrito a contas de empresa.' });
      return;
    }

    const company = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!company) {
      res.status(404).json({ error: 'Perfil empresarial não encontrado.' });
      return;
    }

    let page = 1;
    if (req.query.page !== undefined) {
      const parsedPage = parseInt(req.query.page as string, 10);
      if (isNaN(parsedPage) || parsedPage < 1) {
        res.status(400).json({ error: "O parâmetro de paginação 'page' deve ser um número inteiro positivo maior ou igual a 1." });
        return;
      }
      page = parsedPage;
    }

    const history = await MarketingIntelligenceService.getHistory(company.id, page);

    res.status(200).json(history);
  } catch (error) {
    console.error('[MARKETING INTELLIGENCE HISTORY ERROR]:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de análises.' });
  }
};

/**
 * GET /marketing-intelligence/:id
 * Retorna uma análise completa pelo ID.
 */
export const getAnalysisById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const role = (req as any).user!.role;

    if (role !== 'COMPANY') {
      res.status(403).json({ error: 'Acesso restrito a contas de empresa.' });
      return;
    }

    const company = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!company) {
      res.status(404).json({ error: 'Perfil empresarial não encontrado.' });
      return;
    }

    const analysis = await MarketingIntelligenceService.getById(req.params.id, company.id);
    if (!analysis) {
      res.status(404).json({ error: 'Análise não encontrada.' });
      return;
    }

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('[MARKETING INTELLIGENCE GET BY ID ERROR]:', error);
    res.status(500).json({ error: 'Erro ao buscar análise.' });
  }
};
