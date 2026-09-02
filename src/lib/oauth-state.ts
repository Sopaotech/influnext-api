import { Request, Response, CookieOptions } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwt-secret';
import { redisConnection } from './redis';

const TTL_SECONDS = 600;
const ISSUER = 'influnext';
const AUDIENCE = 'oauth-state';
const PLATFORMS = ['instagram', 'tiktok', 'google', 'youtube'] as const;
export type OAuthPlatform = typeof PLATFORMS[number];
type OAuthMode = 'login' | 'link';
export interface OAuthState extends jwt.JwtPayload {
  purpose: 'oauth_state';
  platform: OAuthPlatform;
  mode: OAuthMode;
  userId?: string;
  browserHash: string;
  frontendUrl: string;
  from: '' | 'onboarding';
  jti: string;
  exp: number;
}

export class OAuthBoundaryError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function isOAuthPlatform(value: unknown): value is OAuthPlatform {
  return typeof value === 'string' && (PLATFORMS as readonly string[]).includes(value);
}

export function assertOAuthIdentity(accessToken: unknown, platformId: unknown): void {
  if (typeof accessToken !== 'string' || !accessToken.trim() ||
      typeof platformId !== 'string' || !platformId.trim() || ['undefined', 'null'].includes(platformId)) {
    throw new OAuthBoundaryError(400, 'O provedor não confirmou uma identidade válida.');
  }
}

export function getOAuthFrontendUrl(req?: Request): string {
  const fallback = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
  const allowed = new Set([
    fallback, process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
    'https://influnext.com.br', 'https://www.influnext.com.br',
    'https://influnext.com', 'https://www.influnext.com',
    ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? ['http://localhost:3000'] : []),
  ].filter(Boolean).map(value => value!.trim().replace(/\/$/, '')));
  let candidate = req?.get('origin');
  if (!candidate && req?.get('referer')) {
    try { candidate = new URL(req.get('referer')!).origin; } catch { /* reject below */ }
    if (!candidate) throw new OAuthBoundaryError(400, 'Origem OAuth inválida.');
  }
  candidate = (candidate || fallback).replace(/\/$/, '');
  if (!allowed.has(candidate)) throw new OAuthBoundaryError(400, 'Origem OAuth não permitida.');
  const url = new URL(candidate);
  if (url.origin !== candidate || (url.protocol !== 'https:' && !(
    ['development', 'test'].includes(process.env.NODE_ENV || '') &&
    url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
  ))) throw new OAuthBoundaryError(400, 'Origem OAuth inválida.');
  return candidate;
}

function cookieOptions(): CookieOptions {
  const local = ['development', 'test'].includes(process.env.NODE_ENV || '');
  return { httpOnly: true, secure: !local, sameSite: local ? 'lax' : 'none', path: '/' };
}
function cookieName(id: string) {
  return `${cookieOptions().secure ? '__Host-' : ''}influnext_oauth_${id}`;
}
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

// Only ephemeral attempt hashes are stored. Losing Redis state invalidates attempts.
async function withRedis<T>(operation: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        if (redisConnection.status === 'wait') await redisConnection.connect();
        if (redisConnection.status !== 'ready') throw new Error('not ready');
        return operation();
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), 5000);
      }),
    ]);
  } catch {
    throw new OAuthBoundaryError(503, 'Autenticação social temporariamente indisponível.');
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function createOAuthState(req: Request, res: Response, platform: OAuthPlatform, mode: OAuthMode): Promise<string> {
  const frontendUrl = getOAuthFrontendUrl(req);
  if (mode === 'link' && !req.user?.id) throw new OAuthBoundaryError(401, 'Sessão autenticada necessária.');
  const nonce = crypto.randomBytes(32).toString('hex');
  const id = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign({
    purpose: 'oauth_state', platform, mode,
    ...(mode === 'link' ? { userId: req.user!.id } : {}),
    browserHash: hash(nonce), frontendUrl,
    from: req.query.from === 'onboarding' ? 'onboarding' : '',
  }, getJwtSecret(), {
    algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE, expiresIn: TTL_SECONDS, jwtid: id,
  });
  const stored = await withRedis(() => redisConnection.set(`oauth:attempt:${id}`, hash(token), 'EX', TTL_SECONDS, 'NX'));
  if (stored !== 'OK') throw new OAuthBoundaryError(503, 'Não foi possível iniciar OAuth.');
  res.setHeader('Cache-Control', 'no-store');
  res.cookie(cookieName(id), nonce, { ...cookieOptions(), maxAge: TTL_SECONDS * 1000 });
  return token;
}

export async function consumeOAuthState(req: Request, res: Response, platform: OAuthPlatform, requiredMode?: OAuthMode): Promise<OAuthState> {
  const invalid = () => new OAuthBoundaryError(400, 'Tentativa OAuth inválida ou expirada. Reinicie a conexão.');
  if (typeof req.query.code !== 'string' || !req.query.code.trim() ||
      typeof req.query.state !== 'string' || !req.query.state) throw invalid();
  let state: OAuthState;
  // Resolve config outside token-error handling: missing configuration is not an accepted state.
  const secret = getJwtSecret();
  try {
    state = jwt.verify(req.query.state, secret, {
      algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE, maxAge: TTL_SECONDS,
    }) as OAuthState;
    if (state.purpose !== 'oauth_state' || state.platform !== platform ||
        !['login', 'link'].includes(state.mode) || (requiredMode && state.mode !== requiredMode) ||
        typeof state.jti !== 'string' || !/^[a-f0-9]{32}$/.test(state.jti) ||
        typeof state.exp !== 'number' || typeof state.browserHash !== 'string' ||
        !/^[a-f0-9]{64}$/.test(state.browserHash) || typeof state.frontendUrl !== 'string' ||
        !['', 'onboarding'].includes(state.from) ||
        (state.mode === 'link' && (typeof state.userId !== 'string' || !state.userId)) ||
        (state.mode === 'login' && state.userId !== undefined)) throw invalid();
    const cookies = (req.headers.cookie || '').split(';').map(value => value.trim());
    const matches = cookies.filter(value => value.startsWith(`${cookieName(state.jti)}=`));
    const nonce = matches.length === 1 ? matches[0].slice(cookieName(state.jti).length + 1) : '';
    if (!/^[a-f0-9]{64}$/.test(nonce) || !crypto.timingSafeEqual(Buffer.from(hash(nonce)), Buffer.from(state.browserHash))) throw invalid();
  } catch { throw invalid(); }
  const consumed = await withRedis(() => redisConnection.eval(
    "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
    1, `oauth:attempt:${state.jti}`, hash(req.query.state as string),
  ));
  if (consumed !== 1) throw invalid();
  res.clearCookie(cookieName(state.jti), cookieOptions());
  res.setHeader('Cache-Control', 'no-store');
  return state;
}

export function oauthBoundaryFailure(res: Response, error: unknown) {
  const known = error instanceof OAuthBoundaryError;
  return res.status(known ? error.status : 503).json({
    error: known ? error.message : 'Configuração OAuth indisponível.',
  });
}
