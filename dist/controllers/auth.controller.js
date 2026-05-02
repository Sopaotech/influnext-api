"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirm2FASetup = exports.setup2FA = exports.verify2FA = exports.login = exports.signup = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const roles_1 = require("../types/roles");
const zod_1 = require("zod");
const twoFactor_service_1 = require("../services/twoFactor.service");
// ─── Schemas de Validação ─────────────────────────────────────────────────────
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'E-mail inválido.' }),
    password: zod_1.z.string().min(8, { message: 'Senha deve ter ao menos 8 caracteres.' }),
    role: zod_1.z.nativeEnum(roles_1.UserRole),
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
            data: { email, passwordHash, role },
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
const login = async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { email, password } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }
        const isMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: 'Credenciais inválidas.' });
            return;
        }
        // ─── Fluxo 2FA ────────────────────────────────────────────────────────────
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
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            user: { id: user.id, email: user.email, role: user.role },
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
        if (payload.scope !== '2fa_pending') {
            res.status(401).json({ error: 'Token inválido para verificação 2FA.' });
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
            user: { id: user.id, email: user.email, role: user.role },
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
        const { code } = zod_1.z.object({ code: zod_1.z.string().length(6) }).parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.twoFactorSecret) {
            res.status(400).json({ error: 'Inicie a configuração 2FA primeiro.' });
            return;
        }
        const isValid = twoFactor_service_1.TwoFactorService.verifyToken(user.twoFactorSecret, code);
        if (!isValid) {
            res.status(400).json({ error: 'Código inválido. Tente novamente.' });
            return;
        }
        await prisma_1.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
        res.json({ message: '2FA ativado com sucesso! Sua conta está protegida.' });
    }
    catch (error) {
        console.error('[AUTH CONFIRM2FA ERROR]:', error);
        res.status(500).json({ error: 'Erro ao confirmar 2FA.' });
    }
};
exports.confirm2FASetup = confirm2FASetup;
