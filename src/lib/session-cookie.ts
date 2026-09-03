import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwt-secret';

export const SESSION_COOKIE_NAME = 'influnext_token';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  role: string;
  email: string;
}

function configuredDomain(): string | undefined {
  const domain = (process.env.SESSION_COOKIE_DOMAIN || process.env.NEXT_PUBLIC_COOKIE_DOMAIN)?.trim();
  if (!domain) return undefined;
  if (!/^\.?[a-z0-9.-]+$/i.test(domain) || domain.includes('..')) {
    throw new Error('SESSION_COOKIE_DOMAIN is invalid.');
  }
  return domain;
}

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS,
    domain: configuredDomain(),
  };
}

export function createSessionToken(user: SessionUser): string {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, purpose: 'session' },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '7d' },
  );
}

export function establishSession(res: Response, user: SessionUser): void {
  res.cookie(SESSION_COOKIE_NAME, createSessionToken(user), sessionCookieOptions());
  res.setHeader('Cache-Control', 'no-store');
}

export function clearSession(res: Response): void {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE_NAME, options);
  res.setHeader('Cache-Control', 'no-store');
}

export function readSessionCookie(cookieHeader: string | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== SESSION_COOKIE_NAME) continue;
    try { return decodeURIComponent(rest.join('=')); } catch { return undefined; }
  }
  return undefined;
}
