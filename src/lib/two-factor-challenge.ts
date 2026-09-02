import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwt-secret';

export function createTwoFactorChallenge(userId: string): string {
  return jwt.sign({ id: userId, scope: '2fa_pending' }, getJwtSecret(), {
    algorithm: 'HS256', issuer: 'influnext', audience: '2fa-challenge', expiresIn: '5m',
  });
}

export function verifyTwoFactorChallenge(token: string): string {
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'], issuer: 'influnext', audience: '2fa-challenge', maxAge: '5m',
  });
  if (typeof payload === 'string' || payload.scope !== '2fa_pending' ||
      typeof payload.id !== 'string' || !payload.id || typeof payload.exp !== 'number') {
    throw new Error('Invalid two-factor challenge.');
  }
  return payload.id;
}
