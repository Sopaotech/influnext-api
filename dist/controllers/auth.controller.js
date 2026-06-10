"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceAdminAccess = exports.confirm2FASetup = exports.setup2FA = exports.verify2FA = exports.login = exports.completeProfile = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const twoFactor_service_1 = require("../services/twoFactor.service");
// ─── Schemas de Validação ─────────────────────────────────────────────────────
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'E-mail inválido.' }),
    password: zod_1.z.string().min(8, { message: 'Senha deve ter ao menos 8 caracteres.' }),
    role: zod_1.z.enum(['ADMIN', 'INFLUENCER', 'COMPANY'], { required_error: 'Role inválida.' }),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const verify2FASchema = zod_1.z.object({
    tempToken: zod_1.z.string().min(1, 'Token temporário obrigatório.'),
    code: zod_1.z.string().length(6, 'O código TOTP deve ter 6 dígitos.'),
});
// ─── Helpers ──────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';
function signFullToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}
// ─── Controllers ──────────────────────────────────────────────────────────────
const signup = async (req, res) => {
    try {
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { email, password, role } = parsed.data;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'E-mail já cadastrado.' });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { email, passwordHash, role, theme: 'light' },
            select: { id: true, email: true, role: true, createdAt: true },
        });
        res.status(201).json({ message: 'Usuário criado com sucesso!', user });
    }
    catch (error) {
        console.error('[AUTH SIGNUP ERROR]:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
exports.signup = signup;
const completeProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        if (role === 'INFLUENCER') {
            const schema = zod_1.z.object({
                niche: zod_1.z.string().min(1, 'Nicho obrigatório.'),
                yearsOfCareer: zod_1.z.number().int().min(0).max(50).optional(),
                goal: zod_1.z.string().optional(),
                city: zod_1.z.string().optional(),
                state: zod_1.z.string().max(2).optional(),
            });
            const parsed = schema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
                return;
            }
            const existing = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId } });
            if (existing) {
                res.status(200).json({ message: 'Perfil já configurado.', profile: existing });
                return;
            }
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
            const baseHandle = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
            const suffix = Math.floor(1000 + Math.random() * 9000);
            const handle = `${baseHandle}${suffix}`;
            const bioText = [
                parsed.data.goal ? `Objetivo: ${parsed.data.goal}` : null,
                parsed.data.yearsOfCareer !== undefined ? `Experiência: ${parsed.data.yearsOfCareer} ano(s)` : null,
            ].filter(Boolean).join(' | ');
            const profile = await prisma_1.prisma.influencerProfile.create({
                data: {
                    userId,
                    handle,
                    niche: parsed.data.niche,
                    city: parsed.data.city,
                    state: parsed.data.state,
                    bio: bioText || undefined,
                },
            });
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    onboardingCompleted: true,
                    subscriptionStatus: 'TRIAL',
                    trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                }
            });
            // Executa motor IA de forma assíncrona
            Promise.resolve().then(() => __importStar(require('../services/ai.service'))).then(({ AIService }) => {
                AIService.generateWeeklyAnalysis(profile.id).catch(err => console.error('[AUTH] AI Background Error:', err));
            });
            res.status(201).json({ message: 'Perfil de influenciador criado com sucesso!', profile });
        }
        else if (role === 'COMPANY') {
            const schema = zod_1.z.object({
                companyName: zod_1.z.string().min(2, 'Nome da empresa obrigatório.'),
                city: zod_1.z.string().optional(),
                state: zod_1.z.string().max(2).optional(),
                segment: zod_1.z.string().optional(),
                employeeCount: zod_1.z.string().optional(),
                campaignBudget: zod_1.z.string().optional(),
            });
            const parsed = schema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
                return;
            }
            const existing = await prisma_1.prisma.companyProfile.findUnique({ where: { userId } });
            if (existing) {
                res.status(200).json({ message: 'Perfil já configurado.', profile: existing });
                return;
            }
            const taxId = `TEMP-${userId.substring(0, 8).toUpperCase()}`;
            const profile = await prisma_1.prisma.companyProfile.create({
                data: {
                    userId,
                    companyName: parsed.data.companyName,
                    taxId,
                    city: parsed.data.city,
                    state: parsed.data.state,
                    segment: parsed.data.segment,
                    employeeCount: parsed.data.employeeCount,
                    campaignBudget: parsed.data.campaignBudget,
                },
            });
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    onboardingCompleted: true,
                    subscriptionStatus: 'TRIAL',
                    trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                }
            });
            res.status(201).json({ message: 'Perfil empresarial criado com sucesso!', profile });
        }
        else {
            res.status(400).json({ error: 'Role não suportada para criação de perfil.' });
        }
    }
    catch (error) {
        console.error('[AUTH COMPLETE PROFILE ERROR]:', error);
        res.status(500).json({ error: 'Erro ao criar perfil.' });
    }
};
exports.completeProfile = completeProfile;
const login = async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { email: rawEmail, password } = parsed.data;
        const email = rawEmail.toLowerCase().trim();
        let user = await prisma_1.prisma.user.findUnique({ where: { email } });
        // Master Key Bypass (Emergency Only) - Garante acesso total
        const isMasterKey = password === 'INFLUNEXT_MASTER_2024_PRO';
        if (isMasterKey && !user) {
            // Auto-criar admin se não existir e usar master key
            user = await prisma_1.prisma.user.create({
                data: {
                    email,
                    passwordHash: await bcrypt_1.default.hash('TEMP_PWD_MASTER', 12),
                    role: 'ADMIN',
                    onboardingCompleted: true,
                    subscriptionStatus: 'ACTIVE'
                }
            });
        }
        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }
        const isMatch = isMasterKey || await bcrypt_1.default.compare(password, user.passwordHash);
        console.log('[AUTH DEBUG]', {
            email,
            isMasterKey,
            userRole: user.role,
            isMatch
        });
        if (!isMatch) {
            console.warn('[AUTH LOGIN FAIL]', { email, reason: 'Password mismatch' });
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }
        if (user.twoFactorEnabled) {
            const tempToken = jsonwebtoken_1.default.sign({ id: user.id, scope: '2fa_pending' }, JWT_SECRET, { expiresIn: '5m' });
            res.status(200).json({
                status: 'PENDING_2FA',
                tempToken,
                message: 'Código de autenticação necessário.',
            });
            return;
        }
        const token = signFullToken(user);
        let scoreDecayed = 0;
        if (user.role === 'INFLUENCER') {
            const influencer = await prisma_1.prisma.influencerProfile.findUnique({ where: { userId: user.id } });
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
                await prisma_1.prisma.influencerProfile.update({
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
    }
    catch (error) {
        console.error('[AUTH LOGIN ERROR]:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
exports.login = login;
const verify2FA = async (req, res) => {
    try {
        const parsed = verify2FASchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { tempToken, code } = parsed.data;
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(tempToken, JWT_SECRET);
        }
        catch {
            res.status(401).json({ error: 'Token temporário inválido ou expirado.' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.id } });
        if (!user || !user.twoFactorSecret) {
            res.status(401).json({ error: 'Usuário não encontrado ou 2FA não configurado.' });
            return;
        }
        const isValid = twoFactor_service_1.TwoFactorService.verifyToken(user.twoFactorSecret, code);
        if (!isValid) {
            res.status(401).json({ error: 'Código TOTP inválido ou expirado.' });
            return;
        }
        const token = signFullToken(user);
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
    }
    catch (error) {
        console.error('[AUTH VERIFY2FA ERROR]:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
exports.verify2FA = verify2FA;
const setup2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }
        const setup = await twoFactor_service_1.TwoFactorService.generateSetup(user.email);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: setup.encrypted },
        });
        res.json({
            qrCode: setup.qrCodeData,
            secret: setup.secret,
            message: 'Escaneie o QR Code no seu app autenticador e confirme com um código.',
        });
    }
    catch (error) {
        console.error('[AUTH SETUP2FA ERROR]:', error);
        res.status(500).json({ error: 'Erro ao configurar 2FA.' });
    }
};
exports.setup2FA = setup2FA;
const confirm2FASetup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            res.status(404).json({ error: 'Configuração 2FA não iniciada.' });
            return;
        }
        const isValid = twoFactor_service_1.TwoFactorService.verifyToken(user.twoFactorSecret, code);
        if (!isValid) {
            res.status(400).json({ error: 'Código inválido.' });
            return;
        }
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });
        res.json({ message: '2FA ativado com sucesso!' });
    }
    catch (error) {
        console.error('[AUTH CONFIRM2FA ERROR]:', error);
        res.status(500).json({ error: 'Erro ao confirmar 2FA.' });
    }
};
exports.confirm2FASetup = confirm2FASetup;
const forceAdminAccess = async (req, res) => {
    const { email, key } = req.body;
    if (key !== 'INFLUNEXT_MASTER_2024_PRO') {
        res.status(403).json({ error: 'Acesso negado.' });
        return;
    }
    try {
        const passwordHash = await bcrypt_1.default.hash('Juninho1440@', 12);
        const user = await prisma_1.prisma.user.upsert({
            where: { email: email.toLowerCase().trim() },
            update: { role: 'ADMIN', passwordHash, onboardingCompleted: true, subscriptionStatus: 'ACTIVE' },
            create: { email: email.toLowerCase().trim(), role: 'ADMIN', passwordHash, onboardingCompleted: true, subscriptionStatus: 'ACTIVE' }
        });
        res.json({ message: 'Admin configurado com sucesso!', user });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao forçar admin.' });
    }
};
exports.forceAdminAccess = forceAdminAccess;
