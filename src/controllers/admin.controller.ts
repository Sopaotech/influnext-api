import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const getGrowthStrategy = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Gemini API Key não configurada." });
      return;
    }

    // Buscar dados reais do sistema para alimentar a IA do Alexsandro
    const [totalUsers, totalContracts, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.contract.count(),
      prisma.contract.aggregate({ _sum: { platformFee: true } })
    ]);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    const strategy = await prisma.adminStrategy.create({
      data: {
        strategyTitle: `Plano de Guerra - ${new Date().toLocaleDateString()}`,
        content: strategyContent,
        targetMetric: 'User Acquisition'
      }
    });

    res.json(strategy);
  } catch (error) {
    console.error('[ADMIN STRATEGY] Erro:', error);
    res.status(500).json({ error: "Erro ao gerar estratégia de crescimento." });
  }
};

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      userBreakdown,
      totalContracts,
      marketplaceHealth,
      totalRevenue,
      totalViews,
      activeSubs,
      canceledSubs,
      pastDueSubs,
      totalSubs,
      activeUsers,
      inactiveUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.contract.count(),
      prisma.contract.groupBy({ by: ['escrowStatus'], _count: { _all: true } }),
      prisma.contract.aggregate({ _sum: { platformFee: true, budget: true } }),
      prisma.pageView.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'canceled' } }),
      prisma.subscription.count({ where: { status: 'past_due' } }),
      prisma.subscription.count(),
      prisma.user.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      prisma.user.count({ where: { subscriptionStatus: 'INACTIVE' } })
    ]);

    const activeCount = activeSubs > 0 ? activeSubs : activeUsers;
    const canceledCount = canceledSubs > 0 ? canceledSubs : inactiveUsers;
    
    const churnRate = (activeCount + canceledCount) > 0 
      ? (canceledCount / (activeCount + canceledCount)) * 100 
      : 0;

    const defaultRate = totalSubs > 0 
      ? (pastDueSubs / totalSubs) * 100 
      : 0;

    res.json({
      metrics: {
        totalUsers: userBreakdown,
        totalContracts,
        marketplaceHealth,
        revenue: totalRevenue._sum.platformFee || 0,
        gmv: totalRevenue._sum.budget || 0,
        pageViews: totalViews,
        churnRate: Number(churnRate.toFixed(2)),
        defaultRate: Number(defaultRate.toFixed(2)),
        activeSubs,
        canceledSubs,
        pastDueSubs
      },
      status: 'OK',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN STATS] Erro:', error);
    res.status(500).json({ error: "Erro ao buscar estatísticas do admin." });
  }
};

export const grantProAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({ error: 'Identificador (e-mail ou ID) é obrigatório.' });
      return;
    }

    const user = await prisma.user.findFirst({
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: null, // Remove expiração de trial
      }
    });

    // Registrar notificação para o usuário
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        message: '🚀 Parabéns! Seu acesso PRO foi liberado pelo administrador.'
      }
    });

    res.json({ message: `Acesso PRO liberado para ${user.email}` });
  } catch (error) {
    console.error('[ADMIN GRANT PRO] Erro:', error);
    res.status(500).json({ error: 'Erro ao liberar acesso PRO.' });
  }
};

export const listAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
};
