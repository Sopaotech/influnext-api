import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { routes } from './routes';
import { trackPageView } from './middlewares/analytics.middleware';
import { helmetSecurity, globalRateLimiter, responseHardening } from './middlewares/security-hardening.middleware';
import { getAllowedOrigins } from './lib/origins';
import { protectCookieSessionFromCsrf } from './middlewares/csrf.middleware';

dotenv.config();

/**
 * Builds the HTTP application without listening, connecting clients, starting
 * workers, or registering scheduled jobs. Runtime concerns belong in server.ts.
 */
export function createApp(): express.Express {
  const app = express();

  app.use(helmetSecurity);
  app.use(responseHardening);
  app.use(globalRateLimiter);

  const allowedOrigins = getAllowedOrigins();
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Bloqueado por CORS: Origem não permitida.'));
    },
    credentials: true,
  }));

  // Stripe webhooks require their raw body before express.json().
  app.use('/v1/payments/webhook', express.raw({ type: 'application/json' }));
  app.use('/v1/webhooks/stripe', express.raw({ type: 'application/json' }));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));
  app.use(protectCookieSessionFromCsrf);
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[REQUEST] ${req.method} ${req.url}`);
      }
      res.on('finish', () => {
        if (res.statusCode === 404) {
          const logLine = `[404] ${new Date().toISOString()} ${req.method} ${req.url}\n`;
          fs.appendFile(path.join(__dirname, '../404-debug.log'), logLine, () => {});
        }
      });
    }
    next();
  });

  app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('🚀 API ONLINE');
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'online', timestamp: new Date().toISOString() });
  });

  app.use(trackPageView);
  app.use('/v1', routes);

  return app;
}

export const app = createApp();
