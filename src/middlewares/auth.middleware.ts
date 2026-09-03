import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../lib/jwt-secret';
import { clearSession, readSessionCookie } from '../lib/session-cookie';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
  const cookieToken = readSessionCookie(req.headers.cookie);
  const token = bearerToken || cookieToken;
  const usesCookieSession = !bearerToken && Boolean(cookieToken);
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    const validPurpose = usesCookieSession ? decoded !== null && typeof decoded !== 'string' && decoded.purpose === 'session' :
      decoded !== null && typeof decoded !== 'string' && (decoded.purpose === undefined || decoded.purpose === 'session');
    if (typeof decoded === 'string' || !validPurpose || decoded.scope !== undefined ||
        decoded.aud !== undefined || typeof decoded.id !== 'string' || !decoded.id ||
        typeof decoded.email !== 'string' || !decoded.email ||
        !['INFLUENCER', 'COMPANY', 'ADMIN'].includes(decoded.role)) {
      return res.status(401).json({ error: 'Sessão completa necessária.' });
    }
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('JWT_SECRET is required')) {
      return res.status(500).json({ error: 'Configuração de autenticação indisponível.' });
    }
    if (cookieToken) clearSession(res);
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito. Apenas administradores podem realizar esta ação.' });
  }
  next();
};
