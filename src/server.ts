import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes';
// import './workers/notification.worker';

dotenv.config();

const app = express();

// Configuração de CORS Dinâmica para Multi-Domínio
const allowedOriginsStr = process.env.ALLOWED_ORIGINS || 'http://localhost:3000,https://influnext.com.br,https://www.influnext.com.br';
const ALLOWED_ORIGINS = allowedOriginsStr.split(',').map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
                     origin.endsWith('.vercel.app') ||
                     origin === 'https://influnext-api.vercel.app' ||
                     origin.includes('localhost');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Bloqueado: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

import { trackPageView } from './middlewares/analytics.middleware';

app.use(express.json());
app.use(trackPageView);

// Todas as suas rotas começarão com /v1
app.use('/v1', routes);

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`🚀 INFLUNEXT ONLINE: Port ${PORT}`);
  console.log(`🌍 MODO VIDA REAL ATIVADO`);
});
