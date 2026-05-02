import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes';
import './workers/notification.worker';

dotenv.config();

const app = express();

// Configuração de CORS Dinâmica para Multi-Domínio
const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 'http://localhost:3000';
const ALLOWED_ORIGINS = allowedOriginsStr.split(',').map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Todas as suas rotas começarão com /v1
app.use('/v1', routes);

const PORT = 4000; // Forçando a porta 4000 para consistência

app.listen(PORT, () => {
  console.log(`🚀 INFLUNEXT ONLINE: http://localhost:${PORT}/v1/health`);
  console.log('🌱 INFLUNEXT READY FOR SEEDING PHASE');
  console.log('[RESET] Porta 4000 forçada e CORS configurado para http://localhost:3000');
});
