import request from 'supertest';
import express from 'express';
import { helmetSecurity, globalRateLimiter, authRateLimiter, responseHardening } from '../src/middlewares/security-hardening.middleware';

describe('Security Hardening Middleware (Helmet, Headers & Rate Limiting)', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(helmetSecurity);
    app.use(responseHardening);
    app.get('/test', (req, res) => res.json({ ok: true }));
  });

  it('deve injetar cabeçalhos de segurança obrigatórios (HSTS, NoSniff, Frameguard)', async () => {
    const res = await request(app).get('/test');

    expect(res.status).toBe(200);
    // HSTS
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    // Anti-Sniff
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    // Anti-Clickjacking
    expect(res.headers['x-frame-options']).toBe('DENY');
    // Referrer Policy
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    // Remove X-Powered-By
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('deve aplicar Rate Limiting quando o limite for excedido', async () => {
    const rateLimitedApp = express();
    const strictLimiter = authRateLimiter;
    rateLimitedApp.use(strictLimiter);
    rateLimitedApp.post('/login', (req, res) => res.json({ success: true }));

    // Executa requisições até o limite
    let lastRes;
    for (let i = 0; i < 21; i++) {
      lastRes = await request(rateLimitedApp).post('/login');
    }

    expect(lastRes?.status).toBe(429);
    expect(lastRes?.body.error).toBe('Too Many Attempts');
  });
});
