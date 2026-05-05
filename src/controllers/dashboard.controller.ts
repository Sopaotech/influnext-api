import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getInfluencerDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const profile = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { onboardingCompleted: true, subscriptionStatus: true, trialEndsAt: true } },
        platforms: true,
        contracts: {
          where: { escrowStatus: { in: ['IN_PROGRESS', 'PENDING_PAYMENT', 'UNDER_REVIEW'] } },
          select: { id: true, title: true, budget: true, escrowStatus: true, createdAt: true }
        },
        metricsHistory: { take: 30, orderBy: { capturedAt: 'desc' } },
        tasks: { where: { isDone: false }, orderBy: { scheduledDate: 'asc' } },
        trendVault: { where: { expiresAt: { gte: new Date() } }, orderBy: { createdAt: 'desc' } },
        aIAnalyses: { take: 1, orderBy: { generatedAt: 'desc' } }
      }
    });

    if (!profile) {
      res.status(404).json({ error: 'Dashboard não encontrada.' });
      return;
    }

    // Cálculo de Progresso de Perfil (Fase 1 do Roadmap)
    let progress = 0;
    if (profile.niche) progress += 20;
    if (profile.city)  progress += 20;
    if (profile.state) progress += 20;
    if (profile.bio)   progress += 20;
    if (profile.platforms.length > 0) progress += 20;

    // KPI: Saldo em Escrow (soma dos contratos IN_PROGRESS)
    const escrowBalance = profile.contracts
      .filter(c => c.escrowStatus === 'IN_PROGRESS')
      .reduce((sum, c) => sum + Number(c.budget), 0);

    // KPI: Contratos ativos (qualquer status não concluído)
    const activeContractsCount = profile.contracts.length;

    // KPI: Missões pendentes
    const pendingMissionsCount = profile.tasks.filter(t => !t.isDone).length;

    res.json({
      profile: {
        id: profile.id,
        handle: profile.handle,
        niche: profile.niche,
        profileImageUrl: profile.profileImageUrl,
        influScore: profile.influScore,
        scoreClass: profile.scoreClass,
        dailyMission: profile.dailyMission,
        missionCompleted: profile.missionCompleted,
        profileProgress: progress,
      },
      kpis: {
        influScore: profile.influScore,
        scoreClass: profile.scoreClass,
        escrowBalance,
        activeContractsCount,
        pendingMissionsCount,
        latestFollowers: profile.metricsHistory?.[0]?.followers ?? null,
        latestEngagement: profile.metricsHistory?.[0]?.engagementRate ?? null,
      },
      userState: profile.user,
      contracts: profile.contracts,
      tasks: profile.tasks,
      trendVault: profile.trendVault,
      metricsHistory: profile.metricsHistory,
      analysis: profile.aIAnalyses[0] || null,
    });
  } catch (error) {
    console.error('[DASHBOARD] Erro ao carregar:', error);
    res.status(500).json({ error: 'Erro ao carregar a dashboard.' });
  }
};

export const getCompanyDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole !== 'COMPANY') {
      res.status(403).json({ error: 'Acesso negado. Apenas empresas podem ver esta dashboard.' });
      return;
    }

    const company = await prisma.companyProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { onboardingCompleted: true, subscriptionStatus: true, trialEndsAt: true } },
        contracts: {
          include: {
            deliverables: true,
            influencer: { 
              select: { 
                handle: true, 
                niche: true, 
                influScore: true,
                metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' }, select: { capturedAt: true } }
              } 
            }
          }
        }
      }
    });

    if (!company) {
      res.status(404).json({ error: 'Perfil não encontrado.' });
      return;
    }

    const stats = {
      totalInvested: company.contracts.reduce((sum, c) => sum + Number(c.budget), 0),
      activeContracts: company.contracts.filter(c => c.escrowStatus !== 'COMPLETED').length,
      pendingReviews: company.contracts
        .flatMap(c => c.deliverables)
        .filter(d => d.status === 'UNDER_REVIEW').length,
      escrowHeld: company.contracts
        .filter(c => c.escrowStatus === 'IN_PROGRESS')
        .reduce((sum, c) => sum + Number(c.budget), 0),
    };

    res.json({ stats, userState: company.user, contracts: company.contracts });
  } catch (error) {
    console.error('[DASHBOARD] Erro ao carregar company:', error);
    res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
};
