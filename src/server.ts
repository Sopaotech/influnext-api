import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes';
// import './workers/notification.worker';

dotenv.config();

const app = express();

// Configuração de CORS Dinâmica para Multi-Domínio
const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://influnext.com.br,https://www.influnext.com.br,https://influnext.com,https://www.influnext.com';
const ALLOWED_ORIGINS = allowedOriginsStr.split(',').map(origin => origin.trim());

app.use(cors({
  origin: true, // Temporário: permite TUDO para diagnóstico
  credentials: true
}));

// Middleware de Analytics (Movido para ser carregado sob demanda)
// Middleware de Analytics (Desativado temporariamente para estabilidade)
app.use((req, res, next) => {
  next();
});

app.use(express.json());
app.use('/v1/payments/webhook', express.raw({ type: 'application/json' }));

// Endpoint de Health Check (CRÍTICO para o Railway)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('🚀 API ONLINE');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'online', timestamp: new Date().toISOString() });
});

// Todas as suas rotas começarão com /v1
app.use('/v1', routes);

// Tratamento de erros globais
process.on('unhandledRejection', (reason: any) => {
  // Silencia erros de conexão do Redis para não poluir o terminal
  if (reason?.message?.includes('ECONNREFUSED') && reason?.message?.includes('6379')) return;
  console.error('❌ REJEIÇÃO:', reason);
});

process.on('uncaughtException', (error: any) => {
  if (error?.message?.includes('ECONNREFUSED') && error?.message?.includes('6379')) return;
  console.error('❌ EXCEÇÃO:', error);
});

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 INFLUNEXT ONLINE: Port ${PORT}`);
});
