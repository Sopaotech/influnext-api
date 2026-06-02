"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyDashboard = exports.getInfluencerDashboard = void 0;
const prisma_1 = require("../lib/prisma");
const getInfluencerDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        let profile = await prisma_1.prisma.influencerProfile.findUnique({
            where: { userId },
            include: {
                user: { select: { email: true, role: true, onboardingCompleted: true, subscriptionStatus: true, trialEndsAt: true, theme: true, accentColor: true } },
                platforms: true,
                contracts: {
                    where: { escrowStatus: { in: ['IN_PROGRESS', 'PENDING_PAYMENT', 'UNDER_REVIEW'] } },
                    select: { id: true, title: true, budget: true, escrowStatus: true, createdAt: true }
                },
                metricsHistory: { take: 30, orderBy: { capturedAt: 'desc' } },
                tasks: { where: { isDone: false }, orderBy: { scheduledDate: 'asc' } },
                trendVault: { where: { expiresAt: { gte: new Date() } }, orderBy: { createdAt: 'desc' } },
                aiAnalyses: { take: 1, orderBy: { generatedAt: 'desc' } },
                rateCards: true
            }
        });
        if (!profile) {
            // Se for ADMIN, retornamos um perfil fake ou dados globais para não quebrar a UI
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
            if (user?.role === 'ADMIN') {
                res.json({
                    profile: {
                        id: 'admin',
                        handle: 'Admin InfluNext',
                        niche: 'SaaS Platform',
                        profileImageUrl: null,
                        influScore: 100,
                        scoreClass: 'DIAMOND',
                        dailyMission: 'Gerenciar Ecossistema',
                        missionCompleted: false,
                        profileProgress: 100,
                    },
                    kpis: { influScore: 100, scoreClass: 'DIAMOND', escrowBalance: 0, activeContractsCount: 0, pendingMissionsCount: 0, latestFollowers: 0, latestEngagement: 0 },
                    userState: user,
                    contracts: [],
                    tasks: [],
                    platforms: [],
                    trendVault: [],
                    metricsHistory: [],
                    analysis: null,
                });
                return;
            }
            res.status(404).json({ error: 'Dashboard não encontrada.' });
            return;
        }
        // Cálculo de Progresso de Perfil (Fase 1 do Roadmap)
        let progress = 0;
        if (profile.niche)
            progress += 20;
        if (profile.city)
            progress += 20;
        if (profile.state)
            progress += 20;
        if (profile.bio)
            progress += 20;
        if (profile.platforms.length > 0)
            progress += 20;
        // KPI: Saldo em Escrow (soma dos contratos IN_PROGRESS)
        const escrowBalance = profile.contracts
            .filter((c) => c.escrowStatus === 'IN_PROGRESS')
            .reduce((sum, c) => sum + Number(c.budget), 0);
        // KPI: Contratos ativos (qualquer status não concluído)
        const activeContractsCount = profile.contracts.length;
        // KPI: Missões pendentes
        const pendingMissionsCount = profile.tasks.filter((t) => !t.isDone).length;
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
            platforms: profile.platforms,
            trendVault: profile.trendVault,
            metricsHistory: profile.metricsHistory,
            analysis: profile.aiAnalyses[0] || null,
            rateCard: profile.rateCards,
        });
    }
    catch (error) {
        console.error('[DASHBOARD] Erro ao carregar:', error);
        res.status(500).json({ error: 'Erro ao carregar a dashboard.' });
    }
};
exports.getInfluencerDashboard = getInfluencerDashboard;
const getCompanyDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'COMPANY') {
            res.status(403).json({ error: 'Acesso negado. Apenas empresas podem ver esta dashboard.' });
            return;
        }
        const company = await prisma_1.prisma.companyProfile.findUnique({
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
            activeContracts: company.contracts.filter((c) => c.escrowStatus !== 'COMPLETED').length,
            pendingReviews: company.contracts
                .flatMap((c) => c.deliverables)
                .filter((d) => d.status === 'UNDER_REVIEW').length,
            escrowHeld: company.contracts
                .filter((c) => c.escrowStatus === 'IN_PROGRESS')
                .reduce((sum, c) => sum + Number(c.budget), 0),
        };
        res.json({ stats, userState: company.user, contracts: company.contracts });
    }
    catch (error) {
        console.error('[DASHBOARD] Erro ao carregar company:', error);
        res.status(500).json({ error: 'Erro ao carregar dashboard.' });
    }
};
exports.getCompanyDashboard = getCompanyDashboard;
