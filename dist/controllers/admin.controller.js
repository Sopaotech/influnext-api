"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllUsers = exports.grantProAccess = exports.getAdminStats = exports.getGrowthStrategy = void 0;
const prisma_1 = require("../lib/prisma");
const generative_ai_1 = require("@google/generative-ai");
const getGrowthStrategy = async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: "Gemini API Key não configurada." });
            return;
        }
        // Buscar dados reais do sistema para alimentar a IA do Alexsandro
        const [totalUsers, totalContracts, totalRevenue] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.contract.count(),
            prisma_1.prisma.contract.aggregate({ _sum: { platformFee: true } })
        ]);
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const prompt = `Você é um consultor de crescimento de SaaS (Growth Hacker) especializado no mercado brasileiro.
    Você está ajudando o Alexsandro, o fundador do InfluNext, a escalar sua plataforma.
    
    DADOS ATUAIS DO INFLUNEXT:
    - Total de Usuários: ${totalUsers}
    - Total de Contratos: ${totalContracts}
    - Receita da Plataforma (Taxas): R$ ${totalRevenue._sum.platformFee || 0}

    TAREFA:
    1. Analise o momento atual.
    2. Sugira 3 estratégias práticas para aquisição de usuários (Tráfego Pago, Parcerias, Viralidade).
    3. Sugira uma melhoria no produto para aumentar o LTV (Lifetime Value).
    4. Dê um conselho de "Guerra" para dominar o mercado de influenciadores no Brasil.

    Responda em tom executivo, motivador e focado em lucro. Use Markdown.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const strategyContent = response.text();
        // Salvar no histórico
        const strategy = await prisma_1.prisma.adminStrategy.create({
            data: {
                strategyTitle: `Plano de Guerra - ${new Date().toLocaleDateString()}`,
                content: strategyContent,
                targetMetric: 'User Acquisition'
            }
        });
        res.json(strategy);
    }
    catch (error) {
        console.error('[ADMIN STRATEGY] Erro:', error);
        res.status(500).json({ error: "Erro ao gerar estratégia de crescimento." });
    }
};
exports.getGrowthStrategy = getGrowthStrategy;
const getAdminStats = async (req, res) => {
    try {
        const [totalUsers, userBreakdown, totalContracts, marketplaceHealth, totalRevenue, totalViews] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            prisma_1.prisma.contract.count(),
            prisma_1.prisma.contract.groupBy({ by: ['escrowStatus'], _count: { _all: true } }),
            prisma_1.prisma.contract.aggregate({ _sum: { platformFee: true, budget: true } }),
            prisma_1.prisma.pageView.count()
        ]);
        res.json({
            metrics: {
                totalUsers: userBreakdown,
                totalContracts,
                marketplaceHealth,
                revenue: totalRevenue._sum.platformFee || 0,
                gmv: totalRevenue._sum.budget || 0,
                pageViews: totalViews
            },
            status: 'OK',
            serverTime: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[ADMIN STATS] Erro:', error);
        res.status(500).json({ error: "Erro ao buscar estatísticas do admin." });
    }
};
exports.getAdminStats = getAdminStats;
const grantProAccess = async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            res.status(400).json({ error: 'Identificador (e-mail ou ID) é obrigatório.' });
            return;
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { id: identifier }
                ]
            }
        });
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                subscriptionStatus: 'ACTIVE',
                trialEndsAt: null, // Remove expiração de trial
            }
        });
        // Registrar notificação para o usuário
        await prisma_1.prisma.notification.create({
            data: {
                userId: user.id,
                type: 'SYSTEM',
                message: '🚀 Parabéns! Seu acesso PRO foi liberado pelo administrador.'
            }
        });
        res.json({ message: `Acesso PRO liberado para ${user.email}` });
    }
    catch (error) {
        console.error('[ADMIN GRANT PRO] Erro:', error);
        res.status(500).json({ error: 'Erro ao liberar acesso PRO.' });
    }
};
exports.grantProAccess = grantProAccess;
const listAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                subscriptionStatus: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
};
exports.listAllUsers = listAllUsers;
