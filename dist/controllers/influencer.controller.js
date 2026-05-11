"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRateCard = exports.getRateCard = exports.completeMission = exports.getMyMission = exports.updateProfile = exports.searchInfluencers = exports.getDailyInsight = exports.updateTask = exports.getTasks = void 0;
const prisma_1 = require("../lib/prisma");
const mission_service_1 = require("../services/mission.service");
const career_service_1 = require("../services/career.service");
const zod_1 = require("zod");
const getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        const tasks = await prisma_1.prisma.task.findMany({
            where: { influencerId: influencer.id },
            orderBy: { scheduledDate: 'asc' }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar tarefas." });
    }
};
exports.getTasks = getTasks;
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { isDone } = req.body;
        const updated = await prisma_1.prisma.task.update({
            where: { id },
            data: { isDone }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar tarefa." });
    }
};
exports.updateTask = updateTask;
const getDailyInsight = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        const insight = await career_service_1.CareerService.getDailyBusinessInsight(influencer.id);
        res.json({ insight });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar insight." });
    }
};
exports.getDailyInsight = getDailyInsight;
const searchInfluencers = async (req, res) => {
    try {
        const q = req.query.q;
        const city = req.query.city;
        const state = req.query.state;
        const niche = req.query.niche;
        const minScore = req.query.minScore ? parseInt(req.query.minScore, 10) : undefined;
        // Must have at least one filter or return all (for marketplace initial load)
        const where = {};
        if (q && q.length >= 1) {
            where.handle = { contains: q };
        }
        if (city) {
            where.city = { contains: city };
        }
        if (state && state.length === 2) {
            where.state = { equals: state.toUpperCase() };
        }
        if (niche && niche !== 'Todos') {
            where.niche = { contains: niche };
        }
        if (minScore !== undefined && !isNaN(minScore)) {
            where.influScore = { gte: minScore };
        }
        const influencers = await prisma_1.prisma.influencerProfile.findMany({
            where,
            select: {
                id: true,
                handle: true,
                niche: true,
                city: true,
                state: true,
                influScore: true,
                scoreClass: true,
                verifiedMetrics: true,
                profileImageUrl: true,
            },
            orderBy: { influScore: 'desc' },
            take: 50,
        });
        res.json(influencers);
    }
    catch (error) {
        console.error('[INFLUENCER] Erro na busca:', error);
        res.status(500).json({ error: "Erro ao buscar influenciadores." });
    }
};
exports.searchInfluencers = searchInfluencers;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const schema = zod_1.z.object({
            handle: zod_1.z.string().optional(),
            niche: zod_1.z.string().optional(),
            profileImageUrl: zod_1.z.string().nullable().optional(),
            bio: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().max(2).optional(),
            theme: zod_1.z.enum(['dark', 'light', 'system']).optional(),
            accentColor: zod_1.z.string().optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { theme, accentColor, ...profileData } = parsed.data;
        // Atualiza perfil do influenciador
        const updated = await prisma_1.prisma.influencerProfile.update({
            where: { userId },
            data: profileData,
        });
        // Atualiza preferências do usuário (se enviadas)
        if (theme || accentColor) {
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    theme: theme,
                    accentColor
                }
            });
        }
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar perfil." });
    }
};
exports.updateProfile = updateProfile;
const getMyMission = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        const profile = await mission_service_1.MissionService.assignDailyMission(influencer.id);
        res.json({
            dailyMission: profile?.dailyMission,
            missionCompleted: profile?.missionCompleted,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao carregar missão." });
    }
};
exports.getMyMission = getMyMission;
const completeMission = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        const updated = await mission_service_1.MissionService.completeMission(influencer.id);
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao completar missão." });
    }
};
exports.completeMission = completeMission;
const getRateCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({
            where: { userId },
            include: { rateCards: true }
        });
        if (!influencer) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        res.json(influencer.rateCards);
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao buscar tabela de preços." });
    }
};
exports.getRateCard = getRateCard;
const updateRateCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: "Perfil não encontrado." });
            return;
        }
        const schema = zod_1.z.array(zod_1.z.object({
            serviceName: zod_1.z.string(),
            price: zod_1.z.number(),
            description: zod_1.z.string().optional()
        }));
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: "Dados inválidos." });
            return;
        }
        // Resetar e recriar para simplificar o MVP (ou fazer update/upsert individual)
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.rateCard.deleteMany({ where: { influencerId: influencer.id } }),
            prisma_1.prisma.rateCard.createMany({
                data: parsed.data.map(item => ({
                    influencerId: influencer.id,
                    ...item
                }))
            })
        ]);
        res.json({ message: "Tabela de preços atualizada!" });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao atualizar tabela de preços." });
    }
};
exports.updateRateCard = updateRateCard;
