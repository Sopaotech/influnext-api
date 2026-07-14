import { prisma } from '../lib/prisma';
import { MissionService } from '../services/mission.service';
import { CareerService } from '../services/career.service';
import { AIService } from '../services/ai.service';
import { Request, Response } from 'express';
import { z } from 'zod';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    
    if (!influencer) {
      res.json([]);
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { influencerId: influencer.id },
      orderBy: { scheduledDate: 'asc' }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar tarefas." });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isDone } = req.body;

    const userId = (req as any).user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    
    if (!influencer) {
      res.status(403).json({ error: "Perfil não encontrado." });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task || task.influencerId !== influencer.id) {
      res.status(403).json({ error: "Você não tem permissão para alterar esta tarefa." });
      return;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { isDone }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar tarefa." });
  }
};

export const createVoiceTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const { text } = req.body;
    
    if (!text) {
      res.status(400).json({ error: "Texto não fornecido." });
      return;
    }

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

    // Usando o parser de linguagem natural da IA para extrair a intenção e data
    let title = text;
    let scheduledDate = new Date();
    let parsedSuccessfully = false;

    try {
      const parsedCommand = await AIService.parseNaturalCommand(text);
      if (parsedCommand && parsedCommand.action === 'CREATE_TASK' && parsedCommand.data) {
        if (parsedCommand.data.title) {
          title = parsedCommand.data.title;
        }
        if (parsedCommand.data.scheduledDate) {
          scheduledDate = new Date(parsedCommand.data.scheduledDate);
        }
        parsedSuccessfully = true;
      }
    } catch (e) {
      console.warn('[INFLUENCER] IA indisponível para comando de voz, usando fallback heurístico.');
    }

    if (!parsedSuccessfully) {
      // Fallback heurístico inteligente para comandos em Português
      let daysFromNow = 0;
      const lowerText = text.toLowerCase();
      if (lowerText.includes('amanhã')) {
        daysFromNow = 1;
      } else if (lowerText.includes('depois de amanhã')) {
        daysFromNow = 2;
      }
      scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

      // Tentar extrair hora (ex: "às 16h", "às 4 da tarde", "às 15:30", "às 4 horas")
      const hourRegex = /(?:às|as)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas)?\s*(da tarde|da noite)?/i;
      const match = text.match(hourRegex);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const period = match[3];
        if (period && (period.includes('tarde') || period.includes('noite')) && hours < 12) {
          hours += 12;
        }
        scheduledDate.setHours(hours, minutes, 0, 0);
      } else {
        scheduledDate.setHours(14, 0, 0, 0); // Padrão 14h
      }

      // Tentar extrair um título limpo
      let cleanTitle = text
        .replace(/(?:por favor|agendar|marcar|criar|tarefa|reunião|compromisso)/gi, '')
        .replace(/(?:amanhã|hoje|depois de amanhã)/gi, '')
        .replace(/(?:às|as)\s*\d{1,2}(?::\d{2})?\s*(?:h|horas)?\s*(?:da manhã|da tarde|da noite)?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanTitle) {
        // Capitalizar primeira letra
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        title = `Reunião: ${cleanTitle}`;
      } else {
        title = "Reunião Agendada";
      }
    }

    const task = await prisma.task.create({
      data: {
        influencerId: influencer.id,
        title: title.substring(0, 50),
        description: "Agendado via Comando de Voz / IA",
        fromAI: true,
        isDone: false,
        scheduledDate
      }
    });

    res.json(task);
  } catch (error) {
    console.error('[INFLUENCER] Erro no createVoiceTask:', error);
    res.status(500).json({ error: "Erro ao criar tarefa por voz." });
  }
};

export const getDailyInsight = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    
    if (!influencer) {
      res.json({ insight: "Configure seu perfil no onboarding para começar a receber insights diários da IA." });
      return;
    }

    const insight = await CareerService.getDailyBusinessInsight(influencer.id);
    res.json({ insight });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar insight." });
  }
};

export const searchInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const q        = req.query.q        as string | undefined;
    const city     = req.query.city     as string | undefined;
    const state    = req.query.state    as string | undefined;
    const niche    = req.query.niche    as string | undefined;
    const minScore = req.query.minScore ? parseInt(req.query.minScore as string, 10) : undefined;

    // Must have at least one filter or return all (for marketplace initial load)
    const where: any = {};

    if (q && q.length >= 1) {
      const cleanQ = q.startsWith('@') ? q.slice(1) : q;
      where.handle = { contains: cleanQ, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state && state.length === 2) {
      where.state = { equals: state.toUpperCase() };
    }

    if (niche && niche !== 'Todos') {
      where.niche = { contains: niche, mode: 'insensitive' };
    }

    if (minScore !== undefined && !isNaN(minScore)) {
      where.influScore = { gte: minScore };
    }

    const influencers = await prisma.influencerProfile.findMany({
      where,
      select: {
        id:              true,
        handle:          true,
        niche:           true,
        city:            true,
        state:           true,
        influScore:      true,
        scoreClass:      true,
        verifiedMetrics: true,
        profileImageUrl: true,
        metricsHistory: {
          take: 1,
          orderBy: { capturedAt: 'desc' },
          select: { followers: true }
        }
      },
      orderBy: { influScore: 'desc' },
      take: 50,
    });

    res.json(influencers);
  } catch (error) {
    console.error('[INFLUENCER] Erro na busca:', error);
    res.status(500).json({ error: "Erro ao buscar influenciadores." });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const role = (req as any).user!.role;

    const schema = z.object({
      handle:         z.string().optional(),
      niche:          z.string().optional(),
      profileImageUrl: z.string().nullable().optional(),
      bio:            z.string().optional(),
      city:           z.string().optional(),
      state:          z.string().max(2).optional(),
      theme:          z.string().optional(),
      accentColor:    z.string().optional(),
      careerObjective: z.string().optional(),
      aiInterview:    z.string().optional(),
      onboardingCompleted: z.boolean().optional(),
      // Company specific fields
      companyName:    z.string().optional(),
      taxId:          z.string().optional(),
      segment:        z.string().optional(),
      employeeCount:  z.string().optional(),
      campaignBudget: z.string().optional(),
      logoUrl:        z.string().nullable().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { theme, accentColor, onboardingCompleted, ...profileData } = parsed.data;

    let updated;

    if (role === 'COMPANY') {
      const companyData: any = {};
      if (profileData.companyName) companyData.companyName = profileData.companyName;
      else if (profileData.handle) companyData.companyName = profileData.handle;

      if (profileData.segment) companyData.segment = profileData.segment;
      else if (profileData.niche) companyData.segment = profileData.niche;

      if (profileData.logoUrl !== undefined) companyData.logoUrl = profileData.logoUrl;
      else if (profileData.profileImageUrl !== undefined) companyData.logoUrl = profileData.profileImageUrl;

      if (profileData.bio !== undefined) companyData.bio = profileData.bio;
      if (profileData.city !== undefined) companyData.city = profileData.city;
      if (profileData.state !== undefined) companyData.state = profileData.state;
      if (profileData.taxId !== undefined) companyData.taxId = profileData.taxId;
      if (profileData.employeeCount !== undefined) companyData.employeeCount = profileData.employeeCount;
      if (profileData.campaignBudget !== undefined) companyData.campaignBudget = profileData.campaignBudget;

      updated = await prisma.companyProfile.update({
        where: { userId },
        data: companyData,
      });
    } else if (role === 'ADMIN') {
      const userData: any = {};
      if (profileData.profileImageUrl !== undefined) userData.profileImageUrl = profileData.profileImageUrl;
      if (theme) userData.theme = theme;
      if (accentColor) userData.accentColor = accentColor;
      if (onboardingCompleted !== undefined) userData.onboardingCompleted = onboardingCompleted;

      const userUpdated = await prisma.user.update({
        where: { id: userId },
        data: userData,
      });

      // Retorna formato compatível para não quebrar o frontend
      res.json({
        id: 'admin',
        handle: 'Admin InfluNext',
        profileImageUrl: userUpdated.profileImageUrl,
        theme: userUpdated.theme,
        accentColor: userUpdated.accentColor,
      });
      return;
    } else {
      const influencerData: any = {};
      if (profileData.handle) influencerData.handle = profileData.handle;
      if (profileData.niche) influencerData.niche = profileData.niche;
      if (profileData.profileImageUrl !== undefined) influencerData.profileImageUrl = profileData.profileImageUrl;
      if (profileData.bio !== undefined) influencerData.bio = profileData.bio;
      if (profileData.city !== undefined) influencerData.city = profileData.city;
      if (profileData.state !== undefined) influencerData.state = profileData.state;
      if (profileData.careerObjective !== undefined) influencerData.careerObjective = profileData.careerObjective;
      if (profileData.aiInterview !== undefined) influencerData.aiInterview = profileData.aiInterview;

      updated = await prisma.influencerProfile.update({
        where: { userId },
        data: influencerData,
      });
    }

    // Atualiza preferências e status do usuário (se enviados)
    if (theme || accentColor || onboardingCompleted !== undefined) {
      const userData: any = {};
      if (theme) userData.theme = theme;
      if (accentColor) userData.accentColor = accentColor;
      if (onboardingCompleted !== undefined) userData.onboardingCompleted = onboardingCompleted;

      await prisma.user.update({
        where: { id: userId },
        data: userData
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('[PROFILE] Erro ao atualizar perfil:', error);
    res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
};

export const getMyMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

    const profile = await MissionService.assignDailyMission(influencer.id);
    res.json({
      dailyMission: profile?.dailyMission,
      missionCompleted: profile?.missionCompleted,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar missão." });
  }
};

export const completeMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

    const updated = await MissionService.completeMission(influencer.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao completar missão." });
  }
};

export const getRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    if (role === 'COMPANY') {
      const company = await prisma.companyProfile.findUnique({
        where: { userId },
        include: { rateCards: true }
      });
      if (!company) {
        res.json([]);
        return;
      }
      res.json(company.rateCards);
      return;
    }

    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: { rateCards: true }
    });
    if (!influencer) {
      res.json([]);
      return;
    }
    res.json(influencer.rateCards);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar tabela de preços." });
  }
};

export const updateRateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const schema = z.array(z.object({
      serviceName: z.string(),
      price: z.number(),
      description: z.string().optional()
    }));

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos." });
      return;
    }

    if (role === 'COMPANY') {
      const company = await prisma.companyProfile.findUnique({ where: { userId } });
      if (!company) {
        res.status(404).json({ error: "Perfil não encontrado." });
        return;
      }

      await prisma.$transaction([
        prisma.rateCard.deleteMany({ where: { companyId: company.id } }),
        prisma.rateCard.createMany({
          data: parsed.data.map(item => ({
            companyId: company.id,
            ...item
          }))
        })
      ]);

      res.json({ message: "Tabela de preços atualizada!" });
      return;
    }

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

    // Resetar e recriar para simplificar o MVP (ou fazer update/upsert individual)
    await prisma.$transaction([
      prisma.rateCard.deleteMany({ where: { influencerId: influencer.id } }),
      prisma.rateCard.createMany({
        data: parsed.data.map(item => ({
          influencerId: influencer.id,
          ...item
        }))
      })
    ]);

    res.json({ message: "Tabela de preços atualizada!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar tabela de preços." });
  }
};

/**
 * POST /v1/influencer/withdraw
 * Solicita saque PIX do saldo disponível (contratos COMPLETED com netAmount)
 */
export const requestWithdraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { cpf, amount } = req.body;

    // Validação do CPF (apenas dígitos, 11 caracteres)
    const cpfClean = String(cpf || '').replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      res.status(400).json({ error: 'CPF inválido. A chave PIX deve ser um CPF com 11 dígitos.' });
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      res.status(400).json({ error: 'Valor de saque inválido.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeConnectAccountId: true }
    });

    if (!user || !user.stripeConnectAccountId) {
      res.status(400).json({
        error: 'Você precisa vincular sua conta Stripe Connect para solicitar saques. Vá até a aba da Carteira e clique em Conectar.'
      });
      return;
    }

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: 'Perfil não encontrado.' });
      return;
    }

    // Calcular ganhos totais dos contratos COMPLETED
    const completedContracts = await prisma.contract.findMany({
      where: { influencerId: influencer.id, escrowStatus: 'COMPLETED' },
      select: { netAmount: true, budget: true }
    });

    const totalEarned = completedContracts.reduce((acc, c) => {
      return acc + (c.netAmount || c.budget * 0.85); // 85% líquido se netAmount não definido
    }, 0);

    // Calcular saques totais já feitos (não rejeitados e não cancelados)
    const withdrawNotifications = await prisma.notification.findMany({
      where: { userId, type: 'WITHDRAW_REQUEST' },
      select: { metadata: true }
    });

    let totalWithdrawn = 0;
    for (const notif of withdrawNotifications) {
      if (notif.metadata) {
        try {
          const meta = JSON.parse(notif.metadata);
          if (meta && meta.amount && meta.status !== 'REJECTED' && meta.status !== 'CANCELLED') {
            totalWithdrawn += parseFloat(meta.amount);
          }
        } catch (e) {
          // ignore
        }
      }
    }

    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

    if (withdrawAmount > availableBalance) {
      res.status(400).json({
        error: 'Saldo insuficiente.',
        availableBalance: availableBalance.toFixed(2)
      });
      return;
    }

    // Executa a transferência real na Stripe
    const { stripe } = await import('../lib/stripe');
    if (!stripe) {
      res.status(500).json({ error: 'Serviço de saques/pagamentos indisponível.' });
      return;
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(withdrawAmount * 100), // Stripe trabalha com centavos
      currency: 'brl',
      destination: user.stripeConnectAccountId,
      metadata: {
        userId,
        type: 'withdraw_payout',
        influencerId: influencer.id
      }
    });

    // Registrar solicitação via notificação para auditoria
    await prisma.notification.create({
      data: {
        userId,
        message: `Saque de R$ ${withdrawAmount.toFixed(2)} efetuado com sucesso via Stripe Connect.`,
        type: 'WITHDRAW_REQUEST',
        metadata: JSON.stringify({
          amount: withdrawAmount,
          stripeTransferId: transfer.id,
          influencerId: influencer.id,
          requestedAt: new Date().toISOString(),
          status: 'COMPLETED'
        })
      }
    });

    res.json({
      success: true,
      message: 'Saque realizado com sucesso via Stripe Connect! O valor estará disponível em sua conta vinculada.',
      amount: withdrawAmount,
      transferId: transfer.id,
      availableBalance: (availableBalance - withdrawAmount).toFixed(2)
    });
  } catch (error: any) {
    console.error('[WITHDRAW] Erro ao processar saque:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação de saque.', details: error.message });
  }
};

/**
 * GET /v1/influencer/balance
 * Retorna o saldo disponível do influenciador com base em contratos COMPLETED
 */
export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      // Retorna saldo zero em vez de 404 para contas que não são influenciadores (como Admin ou Company)
      res.json({
        availableBalance: 0,
        completedContracts: 0,
        currency: 'BRL',
        transactions: [],
        monthlyData: [
          { month: 'Jan', value: 0 },
          { month: 'Fev', value: 0 },
          { month: 'Mar', value: 0 },
          { month: 'Abr', value: 0 },
          { month: 'Mai', value: 0 },
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Set', value: 0 },
          { month: 'Out', value: 0 },
          { month: 'Nov', value: 0 },
          { month: 'Dez', value: 0 }
        ]
      });
      return;
    }

    const completedContracts = await prisma.contract.findMany({
      where: { influencerId: influencer.id, escrowStatus: 'COMPLETED' },
      select: { id: true, netAmount: true, budget: true, title: true, createdAt: true }
    });

    const totalEarned = completedContracts.reduce((acc, c) => {
      return acc + (c.netAmount || c.budget * 0.85);
    }, 0);

    // Calcular saques totais já feitos (não rejeitados e não cancelados)
    const withdrawNotifications = await prisma.notification.findMany({
      where: { userId, type: 'WITHDRAW_REQUEST' },
      select: { id: true, createdAt: true, metadata: true, message: true }
    });

    let totalWithdrawn = 0;
    const transactions: any[] = [];

    // 1. Adicionar Contratos Concluídos como receitas
    for (const c of completedContracts) {
      const amount = Number(c.netAmount || c.budget * 0.85);
      transactions.push({
        id: `CTR-${c.id.substring(0, 4).toUpperCase()}`,
        dateRaw: c.createdAt,
        date: new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        desc: c.title,
        amount,
        status: 'Concluído'
      });
    }

    for (const notif of withdrawNotifications) {
      if (notif.metadata) {
        try {
          const meta = JSON.parse(notif.metadata);
          if (meta && meta.amount) {
            if (meta.status !== 'REJECTED' && meta.status !== 'CANCELLED') {
              totalWithdrawn += parseFloat(meta.amount);
            }
            const statusMap: any = {
              'PROCESSING': 'Processando',
              'COMPLETED': 'Processado',
              'REJECTED': 'Rejeitado',
              'CANCELLED': 'Cancelado'
            };
            transactions.push({
              id: `WD-${notif.id.substring(0, 4).toUpperCase()}`,
              dateRaw: notif.createdAt,
              date: new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
              desc: 'Saque PIX para Conta Pessoal',
              amount: -parseFloat(meta.amount),
              status: statusMap[meta.status] || 'Processado'
            });
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // Ordenar transações por data decrescente
    transactions.sort((a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime());

    // Gerar faturamento mensal dinâmico com base nos contratos do ano corrente
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = months.map(m => ({ month: m, value: 0 }));

    for (const c of completedContracts) {
      const date = new Date(c.createdAt);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].value += Number(c.netAmount || c.budget * 0.85);
        }
      }
    }

    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

    res.json({
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      completedContracts: completedContracts.length,
      currency: 'BRL',
      transactions,
      monthlyData
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar saldo.' });
  }
};

/**
 * POST /v1/influencer/seed-balance
 * Cria um contrato simulado para injetar saldo na carteira do influenciador logado
 */
export const seedDemoBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    // Tentar encontrar uma empresa existente para vincular o contrato
    let company = await prisma.companyProfile.findFirst();
    
    // Se não houver nenhuma empresa no banco, cria uma de testes
    if (!company) {
      // Encontrar ou criar um usuário com role COMPANY
      let companyUser = await prisma.user.findFirst({ where: { role: 'COMPANY' } });
      if (!companyUser) {
        companyUser = await prisma.user.create({
          data: {
            email: `company_demo_${Date.now()}@influnext.com.br`,
            passwordHash: '$2b$10$wN1iNlEaXw5U/W6N22n/fe.7VqK5j5.5n.YxIeGvOqR.tHw2kY16y', // bcrypt para '123456'
            role: 'COMPANY',
            onboardingCompleted: true
          }
        });
      }
      company = await prisma.companyProfile.create({
        data: {
          userId: companyUser.id,
          companyName: 'Marca Demonstrativa Ltda',
          taxId: `123456780001${Math.floor(Math.random() * 90) + 10}`,
          city: 'São Paulo',
          state: 'SP',
          segment: 'TECNOLOGIA'
        }
      });
    }

    // Criar o contrato de demonstração concluído
    const contract = await prisma.contract.create({
      data: {
        companyId: company.id,
        influencerId: influencer.id,
        title: 'Campanha Demonstrativa de Engajamento v2.1',
        briefing: 'Divulgação de posts demonstrativos no workspace para investidores.',
        budget: 2500.00,
        platformFee: 375.00, // 15% taxa
        netAmount: 2125.00,  // 85% líquido
        escrowStatus: 'COMPLETED'
      }
    });

    res.json({
      success: true,
      message: 'Saldo demonstrativo injetado com sucesso!',
      contract
    });
  } catch (error) {
    console.error('[SEED_BALANCE] Erro ao injetar saldo:', error);
    res.status(500).json({ error: 'Erro ao injetar saldo de demonstração.' });
  }
};

