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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./routes");
// import './workers/notification.worker';
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configuração de CORS Dinâmica para Multi-Domínio
const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://influnext.com.br,https://www.influnext.com.br';
const ALLOWED_ORIGINS = allowedOriginsStr.split(',').map(origin => origin.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permite requisições sem origin (como mobile apps ou curl)
        if (!origin)
            return callback(null, true);
        const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin === 'https://influnext-api.vercel.app' ||
            origin.includes('localhost');
        if (isAllowed) {
            callback(null, true);
        }
        else {
            console.warn(`[CORS] Bloqueado: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// Middleware de Analytics (Movido para ser carregado sob demanda)
const analyticsMiddleware = (req, res, next) => {
    if (req.path === '/' || req.path === '/health')
        return next();
    Promise.resolve().then(() => __importStar(require('./middlewares/analytics.middleware'))).then(m => m.trackPageView(req, res, next)).catch(() => next());
};
app.use(express_1.default.json());
// Rota Stripe (Deve vir ANTES do json() global se possível, mas aqui usamos o raw body específico)
app.use('/v1/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(analyticsMiddleware);
// Endpoint de Health Check Simples para o Railway (RAIZ) - DEVE VIR ANTES DE TUDO
app.get('/', (req, res) => res.status(200).send('🚀 API ONLINE'));
app.get('/health', (req, res) => res.status(200).json({ status: 'online' }));
// Todas as suas rotas começarão com /v1
app.use('/v1', routes_1.routes);
// Tratamento de erros globais
process.on('unhandledRejection', (reason) => {
    // Silencia erros de conexão do Redis para não poluir o terminal
    if (reason?.message?.includes('ECONNREFUSED') && reason?.message?.includes('6379'))
        return;
    console.error('❌ REJEIÇÃO:', reason);
});
process.on('uncaughtException', (error) => {
    if (error?.message?.includes('ECONNREFUSED') && error?.message?.includes('6379'))
        return;
    console.error('❌ EXCEÇÃO:', error);
});
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 INFLUNEXT ONLINE: Port ${PORT}`);
});
