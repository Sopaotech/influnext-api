"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyDashboard = exports.getInfluencerDashboard = void 0;
const prisma_1 = require("../lib/prisma");
const getInfluencerDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const dashboard = await prisma_1.prisma.influencerProfile.findUnique({
            where: { userId },
            include: {
                contracts: { where: { NOT: { escrowStatus: 'COMPLETED' } }, include: { deliverables: true } },
                metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' } },
                tasks: { where: { isDone: false } }
            }
        });
        if (!dashboard) {
            res.status(404).json({ error: "Dashboard não encontrada." });
            return;
        }
        res.json(dashboard);
    }
    catch (error) {
        console.error('[DASHBOARD] Erro ao carregar:', error);
        res.status(500).json({ error: "Erro ao carregar a dashboard." });
    }
};
exports.getInfluencerDashboard = getInfluencerDashboard;
const getCompanyDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== 'COMPANY') {
            res.status(403).json({ error: "Acesso negado. Apenas empresas podem ver esta dashboard." });
            return;
        }
        const company = await prisma_1.prisma.companyProfile.findUnique({
            where: { userId },
            include: {
                contracts: {
                    include: {
                        deliverables: true,
                        influencer: { select: { handle: true } }
                    }
                }
            }
        });
        if (!company) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        const stats = {
            totalInvested: company.contracts.reduce((sum, c) => sum + Number(c.budget), 0),
            activeContracts: company.contracts.filter(c => c.escrowStatus !== 'COMPLETED').length,
            pendingReviews: company.contracts.flatMap(c => c.deliverables).filter(d => d.status === 'UNDER_REVIEW').length
        };
        res.json({ stats, contracts: company.contracts });
    }
    catch (error) {
        console.error('[DASHBOARD] Erro ao carregar company:', error);
        res.status(500).json({ error: "Erro ao carregar dashboard." });
    }
};
exports.getCompanyDashboard = getCompanyDashboard;
