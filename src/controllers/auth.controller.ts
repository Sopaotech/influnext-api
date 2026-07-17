import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserRole } from '../types/roles';
import { z } from 'zod';
import { TwoFactorService } from '../services/twoFactor.service';

// ─── Schemas de Validação ─────────────────────────────────────────────────────

const signupSchema = z.object({
  email:    z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(8, { message: 'Senha deve ter ao menos 8 caracteres.' }),
  role:     z.enum(['ADMIN', 'INFLUENCER', 'COMPANY'], { required_error: 'Role inválida.' }),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const verify2FASchema = z.object({
  tempToken: z.string().min(1, 'Token temporário obrigatório.'),
  code:      z.string().length(6, 'O código TOTP deve ter 6 dígitos.'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

function signFullToken(user: { id: string; role: UserRole; email: string }) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'E-mail já cadastrado.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, role, theme: 'light' },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (role === 'INFLUENCER') {
      const baseHandle = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const handle = `${baseHandle}${suffix}`;
      await prisma.influencerProfile.create({
        data: {
          userId: user.id,
          handle,
          niche: 'Geral',
        }
      });
    }

    res.status(201).json({ message: 'Usuário criado com sucesso!', user });
  } catch (error) {
    console.error('[AUTH SIGNUP ERROR]:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const completeProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const role = (req as any).user!.role;

    if (role === 'INFLUENCER') {
      const schema = z.object({
        niche:        z.string().min(1, 'Nicho obrigatório.'),
        yearsOfCareer: z.number().int().min(0).max(50).optional(),
        goal:         z.string().optional(),
        city:         z.string().optional(),
        state:        z.string().max(2).optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const existing = await prisma.influencerProfile.findUnique({ where: { userId } });
      if (existing) {
        res.status(200).json({ message: 'Perfil já configurado.', profile: existing });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      const baseHandle = user!.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const handle = `${baseHandle}${suffix}`;

      const bioText = [
        parsed.data.goal ? `Objetivo: ${parsed.data.goal}` : null,
        parsed.data.yearsOfCareer !== undefined ? `Experiência: ${parsed.data.yearsOfCareer} ano(s)` : null,
      ].filter(Boolean).join(' | ');

      const profile = await prisma.influencerProfile.create({
        data: {
          userId,
          handle,
          niche: parsed.data.niche,
          city:  parsed.data.city,
          state: parsed.data.state,
          bio:   bioText || undefined,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: 'FREE'
        }
      });

      // Executa motor IA de forma assíncrona
      import('../services/ai.service').then(({ AIService }) => {
        AIService.generateWeeklyAnalysis(profile.id).catch(err => console.error('[AUTH] AI Background Error:', err));
      });

      res.status(201).json({ message: 'Perfil de influenciador criado com sucesso!', profile });

    } else if (role === 'COMPANY') {
      const schema = z.object({
        companyName:          z.string().min(2, 'Nome da empresa obrigatório.'),
        city:                 z.string().optional(),
        state:                z.string().max(2).optional(),
        segment:              z.string().optional(),
        employeeCount:        z.string().optional(),
        campaignBudget:       z.string().optional(),
        salesGoal:            z.string().optional(),
        averageTicket:        z.string().optional(),
        instagramPositioning: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const existing = await prisma.companyProfile.findUnique({ where: { userId } });
      if (existing) {
        res.status(200).json({ message: 'Perfil já configurado.', profile: existing });
        return;
      }

      const taxId = `TEMP-${userId.substring(0, 8).toUpperCase()}`;

      const profile = await prisma.companyProfile.create({
        data: {
          userId,
          companyName:          parsed.data.companyName,
          taxId,
          city:                 parsed.data.city,
          state:                parsed.data.state,
          segment:              parsed.data.segment,
          employeeCount:        parsed.data.employeeCount,
          campaignBudget:       parsed.data.campaignBudget,
          salesGoal:            parsed.data.salesGoal,
          averageTicket:        parsed.data.averageTicket,
          instagramPositioning: parsed.data.instagramPositioning,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: 'FREE'
        }
      });

      res.status(201).json({ message: 'Perfil empresarial criado com sucesso!', profile });

    } else {
      res.status(400).json({ error: 'Role não suportada para criação de perfil.' });
    }
  } catch (error) {
    console.error('[AUTH COMPLETE PROFILE ERROR]:', error);
    res.status(500).json({ error: 'Erro ao criar perfil.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email: rawEmail, password } = parsed.data;
    const email = rawEmail.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    console.log('[AUTH DEBUG]', { 
      email, 
      userRole: user.role, 
      isMatch 
    });

    if (!isMatch) {
      console.warn('[AUTH LOGIN FAIL]', { email, reason: 'Password mismatch' });
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { id: user.id, scope: '2fa_pending' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      res.status(200).json({
        status:    'PENDING_2FA',
        tempToken,
        message:   'Código de autenticação necessário.',
      });
      return;
    }

    const token = signFullToken(user as any);
    let scoreDecayed = 0;

    if (user.role === 'INFLUENCER') {
      const influencer = await prisma.influencerProfile.findUnique({ where: { userId: user.id } });
      if (influencer) {
        const now = new Date();
        const lastLogin = influencer.lastLoginAt || new Date();
        const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let newScore = influencer.influScore;
        if (diffDays > 7) {
          const penalty = (diffDays - 7) * 2;
          scoreDecayed = penalty;
          newScore = Math.max(0, newScore - penalty);
        }

        await prisma.influencerProfile.update({
          where: { id: influencer.id },
          data: { lastLoginAt: now, influScore: newScore }
        });
      }
    }

    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        scoreDecayed,
        onboardingCompleted: user.onboardingCompleted 
      },
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = verify2FASchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { tempToken, code } = parsed.data;
    let payload: { id: string; scope: string };
    try {
      payload = jwt.verify(tempToken, JWT_SECRET) as { id: string; scope: string };
    } catch {
      res.status(401).json({ error: 'Token temporário inválido ou expirado.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.twoFactorSecret) {
      res.status(401).json({ error: 'Usuário não encontrado ou 2FA não configurado.' });
      return;
    }

    const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, code);
    if (!isValid) {
      res.status(401).json({ error: 'Código TOTP inválido ou expirado.' });
      return;
    }

    const token = signFullToken(user as any);
    res.status(200).json({
      message: 'Autenticação 2FA bem-sucedida!',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        onboardingCompleted: user.onboardingCompleted 
      },
    });
  } catch (error) {
    console.error('[AUTH VERIFY2FA ERROR]:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

export const setup2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user   = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    const setup = await TwoFactorService.generateSetup(user.email);
    await prisma.user.update({
      where: { id: userId },
      data:  { twoFactorSecret: setup.encrypted },
    });
    res.json({
      qrCode:     setup.qrCodeData,
      secret:     setup.secret, 
      message:    'Escaneie o QR Code no seu app autenticador e confirme com um código.',
    });
  } catch (error) {
    console.error('[AUTH SETUP2FA ERROR]:', error);
    res.status(500).json({ error: 'Erro ao configurar 2FA.' });
  }
};

export const confirm2FASetup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      res.status(404).json({ error: 'Configuração 2FA não iniciada.' });
      return;
    }
    const isValid = TwoFactorService.verifyToken(user.twoFactorSecret, code);
    if (!isValid) {
      res.status(400).json({ error: 'Código inválido.' });
      return;
    }
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });
    res.json({ message: '2FA ativado com sucesso!' });
  } catch (error) {
    console.error('[AUTH CONFIRM2FA ERROR]:', error);
    res.status(500).json({ error: 'Erro ao confirmar 2FA.' });
  }
};


export const socialLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, username: rawUsername, gender, niche } = req.body;
    if (!platform || !rawUsername) {
      res.status(400).json({ error: 'Plataforma e username são obrigatórios.' });
      return;
    }

    const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
    const email = `${username.toLowerCase()}@social.influnext.com`;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { influencer: true }
    }) as any;

    if (!user) {
      // 1. Criar o User
      const passwordHash = await bcrypt.hash('simulated_social_pwd_2026', 12);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: 'INFLUENCER',
          theme: 'dark',
          accentColor: '#a855f7',
          onboardingCompleted: true,
          subscriptionStatus: 'ACTIVE',
        },
        include: { influencer: true }
      }) as any;

      // 2. Criar o InfluencerProfile
      const aiInterview = {
        dream: 'Trabalhar com grandes marcas',
        followersGoal: '100.000 seguidores',
        incomeTarget: 'Publis/Parcerias',
        difficulty: 'Consistência de posts',
        experience: 'De 6 meses a 2 anos',
        availability: 'Tardes (12h às 18h)',
        frequency: '3 vezes por semana',
        boughtFollowers: 'Não, todo o crescimento foi orgânico',
        gender: gender || 'feminino'
      };

      const profile = await prisma.influencerProfile.create({
        data: {
          userId: user.id,
          handle: username,
          niche: niche || 'Lifestyle',
          careerObjective: 'CONTRACTS',
          aiInterview: aiInterview as any,
          influScore: 78,
          scoreClass: 'SILVER',
          verifiedMetrics: true,
        }
      });

      // 3. Criar a SocialPlatform correspondente
      const platformName = platform.toUpperCase();
      let followersCount = 15430;
      let engagementRate = 4.75;
      let avgViews = 9230;
      let reachLast30Days = 48900;
      let profilePicture = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80';

      if (platformName === 'TIKTOK') {
        followersCount = 32800;
        engagementRate = 8.2;
        avgViews = 18400;
        reachLast30Days = 110200;
        profilePicture = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80';
      }

      await prisma.socialPlatform.create({
        data: {
          influencerId: profile.id,
          platformName,
          platformId: `simulated_${platformName.toLowerCase()}_${Math.floor(100000 + Math.random() * 900000)}`,
          username,
          profilePicture,
          followersCount,
          accessToken: `simulated_access_token_${platformName.toLowerCase()}`,
          isActive: true
        }
      });

      // 4. Criar MetricSnapshot correspondente
      await prisma.metricSnapshot.create({
        data: {
          influencerId: profile.id,
          provider: platformName,
          followers: followersCount,
          engagementRate,
          reachLast30Days,
          avgViews,
          integrityHash: `simulated_hash_${Math.random().toString(36).substring(7)}`
        }
      });

      // Recalcular score
      import('../services/scoring.service').then(({ ScoringService }) => {
        ScoringService.calculateAndPersist(profile.id).catch(err => console.error('[AUTH SOCIAL] Scoring Error:', err));
      });

      // Gerar análise de IA em background
      import('../services/ai.service').then(({ AIService }) => {
        AIService.generateWeeklyAnalysis(profile.id).catch(err => console.error('[AUTH SOCIAL] AI Error:', err));
      });

      user.influencer = profile;
    }

    const token = signFullToken(user);

    res.status(200).json({
      message: 'Login social bem-sucedido!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        scoreDecayed: 0,
        onboardingCompleted: true
      }
    });
  } catch (error) {
    console.error('[AUTH SOCIAL LOGIN ERROR]:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao autenticar via rede social.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        subscriptionTier: true,
        trialEndsAt: true,
        onboardingCompleted: true,
        theme: true,
        accentColor: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('[AUTH GETME ERROR]:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
  }
};

export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token FCM é obrigatório.' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token }
    });

    res.status(200).json({ success: true, message: 'Token FCM atualizado com sucesso.' });
  } catch (error) {
    console.error('[UPDATE FCM TOKEN ERROR]:', error);
    res.status(500).json({ error: 'Erro ao atualizar token FCM.' });
  }
};