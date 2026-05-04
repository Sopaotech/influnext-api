import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { UserRole } from '../types/roles';

// Nota: Em produção, estas chaves devem estar no .env
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = `${process.env.NEXT_PUBLIC_API_URL}/integrations/instagram/callback`;

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_API_URL}/integrations/tiktok/callback`;

export const getAuthUrls = async (req: Request, res: Response): Promise<void> => {
  const instagramUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  
  const tiktokUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=${TIKTOK_REDIRECT_URI}`;

  res.json({
    instagram: instagramUrl,
    tiktok: tiktokUrl
  });
};

export const handleInstagramCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    if (!code) {
      res.status(400).json({ error: "Código de autorização ausente." });
      return;
    }

    // Mock do processo de troca de token (em produção faria um fetch para a API do Meta)
    console.log(`[INTEGRATION] Recebido código Instagram: ${code}`);
    
    // Supondo que o usuário está logado e passamos o ID via state ou sessão
    // Para simplificar no MVP, vamos buscar o último influenciador logado (apenas para teste)
    // Em produção, usaríamos o req.user.id
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=instagram`);
  } catch (error) {
    console.error('[INSTAGRAM] Erro no callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error`);
  }
};

export const handleTikTokCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    if (!code) {
      res.status(400).json({ error: "Código de autorização ausente." });
      return;
    }

    console.log(`[INTEGRATION] Recebido código TikTok: ${code}`);
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=success&platform=tiktok`);
  } catch (error) {
    console.error('[TIKTOK] Erro no callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?status=error`);
  }
};

export const getConnectedPlatforms = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: { platforms: true }
    });

    if (!influencer) {
      res.status(404).json({ error: "Perfil não encontrado." });
      return;
    }

    res.json(influencer.platforms);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar plataformas." });
  }
};