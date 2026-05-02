import { Router } from 'express';
import { AIService } from '../services/ai.service';
import { authenticate } from '../middlewares/auth.middleware';
import { Request, Response } from 'express';

const router = Router();

// Gerar nova análise semanal
router.post('/generate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });

    if (!profile) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    const result = await AIService.generateWeeklyAnalysis(profile.id);
    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar análise.';
    res.status(500).json({ error: message });
  }
});

// Buscar análise mais recente
router.get('/latest', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });

    if (!profile) {
      res.status(404).json({ error: 'Perfil não encontrado.' });
      return;
    }

    const analysis = await AIService.getLatestAnalysis(profile.id);
    res.json(analysis ?? { analysisText: null, recommendations: [] });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar análise.' });
  }
});

// Interagir com o Mentor IA
router.post('/chat', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Mensagem é obrigatória.' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });

    if (!profile) {
      res.status(404).json({ error: 'Apenas influenciadores têm acesso ao mentor.' });
      return;
    }

    const reply = await AIService.chatWithMentor(profile.id, message);
    res.json({ reply });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro no chat com Mentor.';
    res.status(500).json({ error: errorMsg });
  }
});

export default router;
