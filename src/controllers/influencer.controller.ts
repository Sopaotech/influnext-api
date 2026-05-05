import { prisma } from '../lib/prisma';
import { MissionService } from '../services/mission.service';
import { Request, Response } from 'express';
import { z } from 'zod';

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
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const updated = await prisma.influencerProfile.update({
      where: { userId },
      data: parsed.data,
    });

    res.json(updated);
  } catch (error) {
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
