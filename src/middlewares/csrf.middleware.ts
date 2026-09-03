import { NextFunction, Request, Response } from 'express';
import { isAllowedOrigin } from '../lib/origins';
import { readSessionCookie } from '../lib/session-cookie';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function protectCookieSessionFromCsrf(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method) || req.headers.authorization?.startsWith('Bearer ') ||
      !readSessionCookie(req.headers.cookie)) {
    next();
    return;
  }

  if (!isAllowedOrigin(req.get('origin'))) {
    res.status(403).json({ error: 'Origem não autorizada para esta sessão.' });
    return;
  }

  next();
}
