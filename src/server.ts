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

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 INFLUNEXT ONLINE: Port ${PORT}`);
  console.log(`🌍 MODO VIDA REAL ATIVADO`);
});
