import { Router } from 'express';
import { AIService } from '../services/ai.service';
import { authenticate } from '../middlewares/auth.middleware';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Gerar nova análise semanal
router.post('/generate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });

    if (!profile) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true } });
    const userTier = user?.subscriptionTier || 'FREE';

    // Se for FREE, limitar a no máximo 1 análise (a inicial de onboarding)
    if (userTier === 'FREE') {
      const count = await prisma.aIAnalysis.count({ where: { influencerId: profile.id } });
      if (count >= 1) {
        res.status(403).json({ 
          error: 'tier_restricted',
          message: 'Você atingiu o limite de análises do plano gratuito. Para liberar análises semanais detalhadas, novos roteiros estratégicos e ferramentas de engajamento e acompanhamento do perfil, faça o upgrade para o plano Pro ou Master! 🚀' 
        });
        return;
      }
    }

    const result = await AIService.generateWeeklyAnalysis(profile.id);
    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar análise.';
    res.status(500).json({ error: message });
  }
});

router.get('/latest', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });

    if (!profile) {
      res.json({ analysisText: null, recommendations: [] });
      return;
    }

    const analysis = await AIService.getLatestAnalysis(profile.id);
    res.json(analysis ?? { analysisText: null, recommendations: [] });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar análise.' });
  }
});

// Interagir com o Mentor IA (Bilateral)
router.post('/chat', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Mensagem é obrigatória.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true } });
    const userTier = user?.subscriptionTier || 'FREE';

    // Roteamento de IA para Empresas (Brands)
    if (role === 'COMPANY') {
      const company = await prisma.companyProfile.findUnique({ where: { userId }, select: { id: true } });
      if (!company) {
        res.status(404).json({ error: 'Perfil de empresa não encontrado.' });
        return;
      }

      if (userTier === 'FREE') {
        const reply = `Olá! Você está usando o plano gratuito corporativo. Para liberar acesso completo ao mentor de IA de posicionamento de marca Vektor, estruturar roteiros e ganchos ilimitados para seus produtos, ter taxas de Escrow reduzidas para 10% e painel co-working, faça o upgrade para o Plano Brand Agency! 🚀`;
        res.json({ reply, isLocked: true });
        return;
      }

      const reply = await AIService.chatWithBrandMentor(company.id, message);
      res.json({ reply });
      return;
    }

    // Roteamento de IA para Criadores (Influencers)
    const profile = await prisma.influencerProfile.findUnique({ where: { userId }, select: { id: true } });

    if (!profile) {
      res.status(404).json({ error: 'Apenas influenciadores têm acesso ao mentor.' });
      return;
    }

    if (userTier === 'FREE') {
      if (message.includes('[PRESENÇA EM EVENTO]')) {
        const reply = `Espetacular, sócio(a)! Eventos presenciais são minas de ouro para o seu posicionamento e autoridade. Como você está no plano Free, preparei um Roteiro de Cobertura Padrão de 3 Fases para você aplicar:

1. 📸 Pré-Evento (Gere expectativa): Poste 2 Stories mostrando sua preparação, a escolha do look e a contagem regressiva marcando a marca patrocinadora.
2. 🎥 No Evento (Gere desejo): Poste 3 a 5 Stories em tempo real. Faça 1 vídeo mostrando os bastidores do espaço, 1 foto com o look final destacado e 1 interação/depoimento curto.
3. 📈 Pós-Evento (Gere prova social): Crie 1 post de feed compilando os melhores momentos com um gancho estratégico na legenda sobre networking.

Para que eu crie um roteiro de scripts personalizado para este evento específico com ideias de fotos exclusivas para seu nicho, faça o upgrade para o Plano Premium! 🚀`;
        res.json({ reply, isLocked: false });
        return;
      }

      const reply = `Olá, sócio(a)! Você atingiu o limite de consultas ao mentor no plano gratuito. Para liberar novos roteiros personalizados, scripts de venda de publis e ferramentas completas de engajamento e acompanhamento de crescimento, faça o upgrade para o Plano Premium! 🚀`;
      res.json({ reply, isLocked: true });
      return;
    }

    const reply = await AIService.chatWithMentor(profile.id, message);
    res.json({ reply });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro no chat com Mentor.';
    res.status(500).json({ error: errorMsg });
  }
});

// Gerar Briefing de Campanha (para Empresas)
router.post('/generate-briefing', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { influencerHandle, campaignTitle } = req.body;

    if (!influencerHandle || !campaignTitle) {
      res.status(400).json({ error: 'Handle do influenciador e título da campanha são obrigatórios.' });
      return;
    }

    const briefing = await AIService.generateCampaignBriefing(influencerHandle, campaignTitle);
    res.json({ briefing });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao gerar briefing.';
    res.status(500).json({ error: errorMsg });
  }
});

export default router;
