import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// --- 1. Middlewares de Base ---
app.use(cors());
app.use(express.json());

// --- 2. Rota de Health-Check ---
// Essencial para monitoramento (Kubernetes, AWS Health Checks, IDX)
app.get('/health', async (req: Request, res: Response) => {
    try {
        // Testa a conexão com o banco executando uma query simples
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: 'Database connection failed'
        });
    }
});

// --- 3. Tratamento Global de Erros ---
// Captura erros não tratados nos controllers para evitar crash do node
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[SERVER_ERROR] ${new Date().toISOString()}:`, err);

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// --- 4. Inicialização do Servidor ---
async function startServer() {
    try {
        console.log('--- INFLUNEXT: Iniciando Processo de Boot ---');

        // Tenta conectar ao Prisma
        console.log('1. Conectando ao PostgreSQL via Prisma...');
        await prisma.$connect();
        console.log('✅ Banco de dados conectado com sucesso.');

        // Inicia o listen apenas se o banco estiver OK
        app.listen(PORT, () => {
            console.log(`2. Servidor HTTP pronto na porta ${PORT}`);
            console.log(`🚀 INFLUNEXT API rodando em modo ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Link de Health Check: http://localhost:${PORT}/health`);
        });

    } catch (error) {
        console.error('❌ Falha Crítica no Boot do Servidor:');
        console.error(error);

        // Encerra o processo com erro (importante para ferramentas de orquestração)
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Escuta por sinais de encerramento para fechar as conexões graciosamente
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

startServer();