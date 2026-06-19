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
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configuração de CORS Dinâmica para Multi-Domínio
const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://influnext.com.br,https://www.influnext.com.br,https://influnext.com,https://www.influnext.com';
const ALLOWED_ORIGINS = allowedOriginsStr.split(',').map(origin => origin.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permite requisições sem origem (como Postman, aplicativos móveis ou requisições locais de servidor para servidor)
        if (!origin)
            return callback(null, true);
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error('Bloqueado por CORS: Origem não permitida.'));
        }
    },
    credentials: true
}));
// Middleware de Analytics (Movido para ser carregado sob demanda)
// Webhook da Stripe precisa do body cru (Buffer) ANTES do express.json() processar a requisição
app.use('/v1/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    res.on('finish', () => {
        if (res.statusCode === 404) {
            try {
                const fs = require('fs');
                const path = require('path');
                const logLine = `[404 ERROR] ${new Date().toISOString()} - ${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers)}\n`;
                fs.appendFileSync(path.join(__dirname, '../404-debug.log'), logLine);
            }
            catch (err) {
                console.error('Failed to write 404 debug log:', err);
            }
        }
    });
    next();
});
// Endpoint de Health Check (CRÍTICO para o Railway)
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('🚀 API ONLINE');
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'online', timestamp: new Date().toISOString() });
});
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
const startServer = async () => {
    try {
        console.log('🔍 Verificando conexão com o banco de dados...');
        const { prisma } = await Promise.resolve().then(() => __importStar(require('./lib/prisma')));
        await prisma.$connect();
        console.log('✅ Banco de dados conectado!');
        // Garante que o administrador solicitado pelo usuário exista
        const { ensureAdminExists } = await Promise.resolve().then(() => __importStar(require('./lib/admin-init')));
        await ensureAdminExists();
        // Inicializa workers e crons de background de forma assíncrona/defensiva (não bloqueante)
        console.log('🔄 Inicializando workers e crons de background em paralelo...');
        Promise.all([
            Promise.resolve().then(() => __importStar(require('./workers/notification.worker'))),
            Promise.resolve().then(() => __importStar(require('./workers/cleanup.worker'))),
            Promise.resolve().then(() => __importStar(require('./workers/token-renewal.worker'))),
            Promise.resolve().then(() => __importStar(require('./queues/cleanup.queue'))).then(m => m.addDailyCleanupJob()),
            Promise.resolve().then(() => __importStar(require('./queues/token-renewal.queue'))).then(m => m.addDailyTokenRenewalJob())
        ]).then(() => {
            console.log('✅ Workers e crons de background ativos.');
        }).catch((workerError) => {
            console.warn('⚠️ Falha ao inicializar workers em background (Redis offline?):', workerError.message || workerError);
        });
        app.listen(PORT, () => {
            console.log(`🚀 INFLUNEXT ONLINE: Port ${PORT}`);
            console.log(`🌍 URL da API: https://api.influnext.com.br`);
        });
    }
    catch (error) {
        console.error('❌ FALHA CRÍTICA NO STARTUP:', error);
        // Tenta subir o servidor mesmo com erro no banco para podermos ver o erro via HTTP/Health
        app.listen(PORT, () => {
            console.log(`⚠️ Servidor subiu com ERROS (Port ${PORT}). Verifique os logs.`);
        });
    }
};
startServer();
