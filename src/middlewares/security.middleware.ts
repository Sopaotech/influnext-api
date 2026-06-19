import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// ─── IP Registration Limiter ───────────────────────────────────────────────────
// Impede criação de múltiplas contas pelo mesmo endereço IP.
// Limite: 1 conta por IP por janela de 24h.

const IP_LIMIT = 1;
const IP_WINDOW_HOURS = 24;

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

export const ipSignupLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ip = getClientIp(req);
    if (ip === 'unknown') {
      next();
      return;
    }

    const windowStart = new Date(Date.now() - IP_WINDOW_HOURS * 60 * 60 * 1000);

    const count = await prisma.pageView.count({
      where: {
        ip,
        path: '/auth/signup',
        createdAt: { gte: windowStart },
      },
    });

    if (count >= IP_LIMIT) {
      res.status(429).json({
        error: 'Limite de cadastros atingido para este endereço IP. Tente novamente após 24 horas.',
      });
      return;
    }

    // Registra a tentativa antes de prosseguir
    await prisma.pageView.create({
      data: { ip, path: '/auth/signup', userAgent: req.headers['user-agent'] ?? '' },
    });

    next();
  } catch (error) {
    console.error('[IP LIMITER ERROR]:', error);
    next(); // Fail open: não bloqueia se o middleware falhar
  }
};

// ─── Contract Budget Guard ─────────────────────────────────────────────────────
// Bloqueia contratos cujo budget seja zero, negativo ou absurdamente alto (>R$1M).
// Proteção básica contra parameter tampering.

const MAX_CONTRACT_BUDGET = 1_000_000;

export const contractBudgetGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { budget } = req.body as { budget?: unknown };

  if (budget === undefined || budget === null) {
    next();
    return;
  }

  const value = Number(budget);

  if (isNaN(value) || value <= 0) {
    res.status(400).json({ error: 'Budget do contrato deve ser um valor positivo.' });
    return;
  }

  if (value > MAX_CONTRACT_BUDGET) {
    res.status(400).json({
      error: `Budget excede o limite máximo permitido de R$ ${MAX_CONTRACT_BUDGET.toLocaleString('pt-BR')}.`,
    });
    return;
  }

  next();
};
