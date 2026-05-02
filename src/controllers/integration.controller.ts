import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuditorService } from '../services/auditor.service';

const prisma = new PrismaClient();

// ─── Schema ───────────────────────────────────────────────────────────────────

const connectInstagramSchema = z.object({
  handle: z.string().min(1, 'Handle do Instagram obrigatório.'),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /v1/integrations/instagram
 * Conecta uma conta do Instagram ao perfil do influenciador autenticado e dispara auditoria.
 * TODO: Substituir mock por OAuth real da Meta Graph API.
 */
export const connectInstagram = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user é injetado pelo middleware `authenticate`
    const userId = req.user!.id;

    const parsed = connectInstagramSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { handle } = parsed.data;

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    const platform = await prisma.socialPlatform.upsert({
      where: { 
        influencerId_platformName: { 
          influencerId: influencer.id, 
          platformName: 'INSTAGRAM' 
        } 
      },
      update: { platformId: handle, accessToken: 'TEMP_TOKEN' },
      create: { 
        influencerId: influencer.id, 
        platformName: 'INSTAGRAM', 
        platformId: handle, 
        accessToken: 'TEMP_TOKEN' 
      }
    });

    // Dispara a auditoria inicial para capturar métricas e hash
    await AuditorService.syncInstagramMetrics(influencer.id, handle);

    res.status(201).json({ message: 'Instagram conectado e métricas auditadas!', platform });
  } catch (error) {
    console.error('[INTEGRATION] Erro ao conectar Instagram:', error);
    res.status(500).json({ error: 'Erro na integração.' });
  }
};