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
      res.status(404).json({ error: "Perfil não encontrado." });
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

    try {
      const parsedCommand = await AIService.parseNaturalCommand(text);
      if (parsedCommand && parsedCommand.action === 'CREATE_TASK' && parsedCommand.data) {
        if (parsedCommand.data.title) {
          title = parsedCommand.data.title;
        }
        if (parsedCommand.data.scheduledDate) {
          scheduledDate = new Date(parsedCommand.data.scheduledDate);
        }
      } else {
        // Fallback heurístico inteligente
        let daysFromNow = 0;
        if (text.toLowerCase().includes('amanhã')) daysFromNow = 1;
        if (text.toLowerCase().includes('depois de amanhã')) daysFromNow = 2;
        scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
      }
    } catch (e) {
      console.warn('[INFLUENCER] IA indisponível para comando de voz, usando fallback heurístico.');
      let daysFromNow = 0;
      if (text.toLowerCase().includes('amanhã')) daysFromNow = 1;
      if (text.toLowerCase().includes('depois de amanhã')) daysFromNow = 2;
      scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);
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
      res.status(404).json({ error: "Perfil não encontrado." });
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
      onboardingCompleted: z.boolean().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { theme, accentColor, onboardingCompleted, ...profileData } = parsed.data;

    // Atualiza perfil do influenciador
    const updated = await prisma.influencerProfile.update({
      where: { userId },
      data: profileData,
    });

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
    console.error('[INFLUENCER PROFILE] Erro ao atualizar perfil:', error);
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
    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: { rateCards: true }
    });
    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
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
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

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

    // Registrar solicitação via notificação para auditoria
    await prisma.notification.create({
      data: {
        userId,
        message: `Solicitação de saque PIX: R$ ${withdrawAmount.toFixed(2)} para CPF ${cpfClean.substring(0, 3)}.***.***-${cpfClean.substring(9)}`,
        type: 'WITHDRAW_REQUEST',
        metadata: JSON.stringify({
          amount: withdrawAmount,
          cpf: cpfClean,
          influencerId: influencer.id,
          requestedAt: new Date().toISOString(),
          status: 'PROCESSING'
        })
      }
    });

    res.json({
      success: true,
      message: 'Saque solicitado com sucesso! O PIX será processado em até 1 hora útil.',
      amount: withdrawAmount,
      pixKey: `${cpfClean.substring(0, 3)}.${cpfClean.substring(3, 6)}.${cpfClean.substring(6, 9)}-${cpfClean.substring(9)}`,
      estimatedTime: '< 1 hora',
      availableBalance: (availableBalance - withdrawAmount).toFixed(2)
    });
  } catch (error) {
    console.error('[WITHDRAW] Erro ao processar saque:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação de saque.' });
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
      res.status(404).json({ error: 'Perfil não encontrado.' });
      return;
    }

    const completedContracts = await prisma.contract.findMany({
      where: { influencerId: influencer.id, escrowStatus: 'COMPLETED' },
      select: { netAmount: true, budget: true, title: true }
    });

    const totalEarned = completedContracts.reduce((acc, c) => {
      return acc + (c.netAmount || c.budget * 0.85);
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

    res.json({
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      completedContracts: completedContracts.length,
      currency: 'BRL'
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

