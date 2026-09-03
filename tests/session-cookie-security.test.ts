import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticate } from '../src/middlewares/auth.middleware';
import { protectCookieSessionFromCsrf } from '../src/middlewares/csrf.middleware';
import { clearSession, establishSession, SESSION_COOKIE_NAME } from '../src/lib/session-cookie';
import { createTwoFactorChallenge } from '../src/lib/two-factor-challenge';
import fs from 'fs';
import path from 'path';

const user = { id: 'user-1', email: 'session@example.com', role: 'INFLUENCER' };

function cookieFrom(response: request.Response): { pair: string; serialized: string; token: string } {
  const values = (response.headers['set-cookie'] || []) as unknown as string[];
  const serialized = values.find(value => value.startsWith(`${SESSION_COOKIE_NAME}=`));
  expect(serialized).toBeDefined();
  const pair = serialized!.split(';')[0];
  return { pair, serialized: serialized!, token: decodeURIComponent(pair.slice(SESSION_COOKIE_NAME.length + 1)) };
}

function testApp() {
  const app = express();
  app.use(express.json());
  app.use(protectCookieSessionFromCsrf);
  app.post('/login', (_req, res) => {
    establishSession(res, user);
    res.json({ user });
  });
  app.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
  app.post('/change', authenticate, (_req, res) => res.json({ ok: true }));
  app.post('/logout', (_req, res) => { clearSession(res); res.status(204).send(); });
  return app;
}

describe('STEP 1E — HttpOnly browser session', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      JWT_SECRET: 'session-cookie-test-only-secret',
      ALLOWED_ORIGINS: 'https://frontend.example,http://localhost:3000',
    };
    delete process.env.SESSION_COOKIE_DOMAIN;
    delete process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  });
  afterEach(() => { process.env = originalEnv; });

  it('login creates an explicit full session only in an HttpOnly production cookie', async () => {
    const response = await request(testApp()).post('/login');
    expect(response.body.token).toBeUndefined();
    const session = cookieFrom(response);
    expect(session.serialized).toContain('HttpOnly');
    expect(session.serialized).toContain('Secure');
    expect(session.serialized).toContain('SameSite=Lax');
    expect(session.serialized).toContain('Path=/');
    expect(session.serialized).toMatch(/Max-Age=604800/);
    expect(jwt.verify(session.token, process.env.JWT_SECRET!)).toMatchObject({ ...user, purpose: 'session' });
  });

  it('keeps local HTTP development functional without weakening production settings', async () => {
    process.env.NODE_ENV = 'development';
    const session = cookieFrom(await request(testApp()).post('/login'));
    expect(session.serialized).toContain('HttpOnly');
    expect(session.serialized).toContain('SameSite=Lax');
    expect(session.serialized).not.toContain('Secure');
  });

  it('/me accepts the cookie and rejects a missing session', async () => {
    const app = testApp();
    const session = cookieFrom(await request(app).post('/login'));
    expect((await request(app).get('/me').set('Cookie', session.pair)).status).toBe(200);
    expect((await request(app).get('/me')).status).toBe(401);
  });

  it('logout expires the browser cookie', async () => {
    const app = testApp();
    const session = cookieFrom(await request(app).post('/login'));
    const response = await request(app).post('/logout').set('Cookie', session.pair).set('Origin', 'https://frontend.example');
    expect(response.status).toBe(204);
    expect(cookieFrom(response).serialized).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
  });

  it('requires an allowlisted Origin for unsafe cookie-authenticated requests', async () => {
    const app = testApp();
    const session = cookieFrom(await request(app).post('/login'));
    expect((await request(app).post('/change').set('Cookie', session.pair)).status).toBe(403);
    expect((await request(app).post('/change').set('Cookie', session.pair).set('Origin', 'https://attacker.example')).status).toBe(403);
    expect((await request(app).post('/change').set('Cookie', session.pair).set('Origin', 'https://frontend.example')).status).toBe(200);
  });

  it('never accepts a 2fa_pending challenge as a normal cookie session', async () => {
    const pending = createTwoFactorChallenge(user.id);
    expect((await request(testApp()).get('/me').set('Cookie', `${SESSION_COOKIE_NAME}=${pending}`)).status).toBe(401);
  });

  it('contains no browser source that reads or writes the session JWT', () => {
    const files = [
      'web/src/lib/api.ts', 'web/src/app/auth/login/page.tsx',
      'web/src/app/auth/signup/SignupClient.tsx', 'web/src/app/auth/callback/[platform]/page.tsx',
      'web/src/app/demo/page.tsx', 'web/src/components/appearance-manager.tsx',
      'web/src/lib/auth-browser.ts',
    ];
    const source = files.map(file => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8')).join('\n');
    expect(source).not.toContain("Cookies.get('influnext_token')");
    expect(source).not.toContain("Cookies.set('influnext_token'");
    expect(source).not.toContain("['Authorization'] = `Bearer");
  });

  it('keeps the HttpOnly session server-readable for Next proxy and authenticated SSR', () => {
    const proxySource = fs.readFileSync(path.resolve(__dirname, '../web/src/proxy.ts'), 'utf8');
    const adminSource = fs.readFileSync(path.resolve(__dirname, '../web/src/app/admin/page.tsx'), 'utf8');
    expect(proxySource).toContain("request.cookies.get('influnext_token')");
    expect(proxySource).toContain("'/admin/:path*'");
    expect(adminSource).toContain("(await cookies()).get('influnext_token')");
    expect(adminSource).toContain('Cookie: `influnext_token=${encodeURIComponent(session)}`');
  });
});
