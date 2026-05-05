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
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ message: 'Usuário criado com sucesso!', user });
  } catch (error) {
    console.error('[AUTH SIGNUP ERROR]:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

// ─── Complete Profile (Etapa 2 do Onboarding) ─────────────────────────────────

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

      // Perfil já existe?
      const existing = await prisma.influencerProfile.findUnique({ where: { userId } });
      if (existing) {
        res.status(200).json({ message: 'Perfil já configurado.', profile: existing });
        return;
      }

      // Gerar handle único a partir do e-mail
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

      // Seta Onboarding como concluído e define os 15 dias de Trial agnóstico
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        }
      });

      // Cria uma métrica mock inicial para liberar o AIService
      await prisma.metricSnapshot.create({
        data: {
          influencerId: profile.id,
          provider: 'INITIAL_MOCK',
          followers: 0,
          engagementRate: 0,
          reachLast30Days: 0,
          avgViews: 0,
          integrityHash: 'mock_initial_hash'
        }
      });

      // Executa motor IA de forma assíncrona para não prender o request
      import('../services/ai.service').then(({ AIService }) => {
        AIService.generateWeeklyAnalysis(profile.id).catch(err => console.error('[AUTH] AI Background Error:', err));
      });

      res.status(201).json({ message: 'Perfil de influenciador criado com sucesso!', profile });

    } else if (role === 'COMPANY') {
      const schema = z.object({
        companyName:    z.string().min(2, 'Nome da empresa obrigatório.'),
        city:           z.string().optional(),
        state:          z.string().max(2).optional(),
        segment:        z.string().optional(),
        employeeCount:  z.string().optional(),
        campaignBudget: z.string().optional(),
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

      // taxId provisório — empresa atualizará via settings
      const taxId = `TEMP-${userId.substring(0, 8).toUpperCase()}`;

      const profile = await prisma.companyProfile.create({
        data: {
          userId,
          companyName:    parsed.data.companyName,
          taxId,
          city:           parsed.data.city,
          state:          parsed.data.state,
          segment:        parsed.data.segment,
          employeeCount:  parsed.data.employeeCount,
          campaignBudget: parsed.data.campaignBudget,
        },
      });

      // Seta Onboarding como concluído e define os 15 dias de Trial agnóstico
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
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

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    
    console.log('[LOGIN_ATTEMPT]', { email, userFound: !!user });

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    // ─── Fluxo 2FA ────────────────────────────────────────────────────────────
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
      user: { id: user.id, email: user.email, role: user.role, scoreDecayed },
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

    if (payload.scope !== '2fa_pending') {
      res.status(401).json({ error: 'Token inválido para verificação 2FA.' });
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
      user: { id: user.id, email: user.email, role: user.role },
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

export const simulateDemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const demoEmail = 'demo@influnext.com';
    let user = await prisma.user.findUnique({ where: { email: demoEmail } });

    if (!user) {
      const passwordHash = await bcrypt.hash('demo123', 12);
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          passwordHash,
          role: 'INFLUENCER',
          onboardingCompleted: true,
          subscriptionStatus: 'ACTIVE',
        },
      });
    }

    let profile = await prisma.influencerProfile.findUnique({ where: { userId: user.id } });

    if (!profile) {
      profile = await prisma.influencerProfile.create({
        data: {
          userId: user.id,
          handle: 'influ_demo',
          niche: 'Tecnologia & Inovação',
          city: 'São Paulo',
          state: 'SP',
          bio: 'Perfil de demonstração para o Influnext. Especialista em gadgets e futuro.',
          influScore: 85,
          scoreClass: 'GOLD',
          dailyMission: 'Postar 3 stories sobre produtividade',
        },
      });
    }

    // 1. Limpar dados antigos para garantir consistência
    await prisma.task.deleteMany({ where: { influencerId: profile.id } });
    await prisma.metricSnapshot.deleteMany({ where: { influencerId: profile.id } });
    await prisma.trendReference.deleteMany({ where: { influencerId: profile.id } });
    await prisma.contract.deleteMany({ where: { influencerId: profile.id } });
    await prisma.supportTicket.deleteMany({ where: { userId: user.id } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });

    // 2. Criar Empresa Mock para Contratos
    let demoCompany = await prisma.companyProfile.findFirst({ where: { companyName: 'TechGlobal Inc' } });
    if (!demoCompany) {
      const companyUser = await prisma.user.create({
        data: {
          email: 'brands@techglobal.com',
          passwordHash: 'dummy',
          role: 'COMPANY',
          onboardingCompleted: true
        }
      });
      demoCompany = await prisma.companyProfile.create({
        data: {
          userId: companyUser.id,
          companyName: 'TechGlobal Inc',
          taxId: 'DEMO-TAX-001',
          segment: 'Tecnologia'
        }
      });
    }

    const now = new Date();

    // 3. Gerar Histórico de Métricas (Gráfico de 30 dias)
    const metricSnapshots = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      metricSnapshots.push({
        influencerId: profile.id,
        provider: 'INSTAGRAM',
        followers: 12500 + (30 - i) * 80 + Math.floor(Math.random() * 50),
        engagementRate: 4.8 + Math.random() * 0.5,
        reachLast30Days: 45000 + (30 - i) * 600,
        avgViews: 2500 + (30 - i) * 45,
        integrityHash: `hash_s_${i}`,
        capturedAt: date,
      });
    }
    await prisma.metricSnapshot.createMany({ data: metricSnapshots });

    // 4. Criar Tasks do Calendário
    const tasksData = [
      { title: 'Revisão iPhone 15 Pro', days: -2, done: true, ai: true },
      { title: 'Story: Unboxing Headset XYZ', days: 0, done: false, ai: true },
      { title: 'Post: O futuro da IA em 2026', days: 2, done: false, ai: true },
      { title: 'Live: Setup Gamer 2026', days: 5, done: false, ai: true },
    ];
    for (const t of tasksData) {
      const date = new Date();
      date.setDate(now.getDate() + t.days);
      await prisma.task.create({
        data: {
          influencerId: profile.id,
          title: t.title,
          scheduledDate: date,
          isDone: t.done,
          fromAI: t.ai,
        }
      });
    }

    // 5. Trend Vault (Workspace)
    await prisma.trendReference.createMany({
      data: [
        { influencerId: profile.id, title: 'ASMR Tech Unboxing', videoUrl: '#', niche: 'Tecnologia', expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) },
        { influencerId: profile.id, title: 'AI Automation Workflow', videoUrl: '#', niche: 'Inovação', expiresAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) },
      ]
    });

    // 6. Contratos e Propostas (BRL)
    const company = await prisma.companyProfile.findFirst() || await prisma.companyProfile.create({
      data: { userId: user.id, companyName: 'TechGlobal Brasil', taxId: '00.000.000/0001-00' }
    });

    await prisma.contract.createMany({
      data: [
        { 
          influencerId: profile.id, 
          companyId: company.id, 
          title: 'Lançamento SmartWatch X', 
          budget: 2500.00, 
          escrowStatus: 'IN_PROGRESS', // Contrato Formalizado
          briefing: 'Criar 3 Reels focados em produtividade.' 
        },
        { 
          influencerId: profile.id, 
          companyId: company.id, 
          title: 'Review Headset Gamer', 
          budget: 1200.00, 
          escrowStatus: 'PENDING_PAYMENT',
          briefing: 'Postar nos Stories o unboxing.' 
        }
      ]
    });

    // 7. Suporte e Notificações
    await prisma.supportTicket.create({
      data: { userId: user.id, subject: 'Dúvida sobre Pagamento', message: 'Como funciona o repasse do escrow?', category: 'SUPPORT', status: 'OPEN' }
    });
    await prisma.notification.createMany({
      data: [
        { userId: user.id, message: 'Seu perfil atingiu o Score GOLD! Parabéns.', type: 'SYSTEM' },
        { userId: user.id, message: 'Nova proposta de contrato de TechGlobal Brasil.', type: 'CONTRACT' }
      ]
    });

    // 8. Análise de IA (Workspace) - Motivação Máxima
    await prisma.aIAnalysis.create({
      data: {
        influencerId: profile.id,
        analysisText: `Fala, @${profile.handle}! 🚀 O mercado está em chamas e você é o combustível. Sua audiência de Tecnologia está sedenta por conteúdos de IA. Não é hora de parar, é hora de escalar. O foco de hoje: Reels de alto impacto mostrando seu setup. Vamos dominar o topo?`,
        recommendations: JSON.stringify({
          trends: [
            { videoType: 'Tech Review Fast', duration: '30s', music: 'Phonk/Cyberpunk' },
            { videoType: 'Setup Tour v2', duration: '60s', music: 'Lo-fi Beats' }
          ],
          suggestedTasks: [
            { title: 'Gravar Review Headset', daysFromNow: 1 },
            { title: 'Postar Trends do Mês', daysFromNow: 2 }
          ],
          videoInspirations: [
            { title: 'Minimalist Desk Setup', hook: 'Como eu organizo meu dia...', platform: 'INSTAGRAM' }
          ],
          trendingNow: {
            audios: ['Cyberpunk 2077 Theme', 'Lo-fi Productivity'],
            topics: ['AI agents', 'Setup Gamer', 'Apple Vision Pro']
          }
        })
      }
    });

    const token = signFullToken(user as any);

    res.status(200).json({
      message: 'Simulação iniciada com sucesso!',
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('[AUTH SIMULATE ERROR]:', error);
    res.status(500).json({ error: 'Erro ao iniciar simulação.' });
  }
};