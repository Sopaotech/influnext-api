"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = require("./routes");
require("./workers/notification.worker");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Configuração de CORS Estrita para Localhost durante o Reset de Diagnóstico
const ALLOWED_ORIGINS = ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: ALLOWED_ORIGINS,
    credentials: true
}));
app.use(express_1.default.json());
// Todas as suas rotas começarão com /v1
app.use('/v1', routes_1.routes);
const PORT = 4000; // Forçando a porta 4000 para consistência
app.listen(PORT, () => {
    console.log(`🚀 INFLUNEXT ONLINE: http://localhost:${PORT}/v1/health`);
    console.log('🌱 INFLUNEXT READY FOR SEEDING PHASE');
    console.log('[RESET] Porta 4000 forçada e CORS configurado para http://localhost:3000');
});
