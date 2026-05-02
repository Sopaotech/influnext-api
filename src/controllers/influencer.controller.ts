import { prisma } from '../lib/prisma';
import { MissionService } from '../services/mission.service';
import { z } from 'zod';

export const searchInfluencers = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      res.json([]);
      return;
    }

    const influencers = await prisma.influencerProfile.findMany({
      where: {
        handle: {
          contains: q
        }
      },
      select: {
        id: true,
        handle: true,
        verifiedMetrics: true
      },
      take: 10
    });

    res.json(influencers);
  } catch (error) {
    console.error('[INFLUENCER] Erro na busca:', error);
    res.status(500).json({ error: "Erro ao buscar influenciadores." });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const schema = z.object({
      handle: z.string().optional(),
      niche: z.string().optional(),
      profileImageUrl: z.string().url().optional(),
      bio: z.string().optional(),
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
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

    const profile = await MissionService.assignDailyMission(influencer.id);
    res.json({
      dailyMission: profile?.dailyMission,
      missionCompleted: profile?.missionCompleted
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao carregar missão." });
  }
};

export const completeMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
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
