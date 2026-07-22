import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Middleware de analytics — registra page views de forma assíncrona (fire-and-forget).
 * NÃO bloqueia a resposta: next() é chamado imediatamente.
 * Rastreia rotas da API (/v1/) mas não assets estáticos ou arquivos.
 */
export const trackPageView = (req: Request, _res: Response, next: NextFunction): void => {
  // Processar apenas GETs e PATHs relevantes da API (sem extensão de arquivo)
  if (req.method === 'GET' && !req.path.includes('.')) {
    // Fire-and-forget: não aguarda a escrita no banco para não adicionar latência
    prisma.pageView.create({
      data: {
        path: req.path,
        userAgent: req.get('user-agent') || null,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || null,
      },
    }).catch(() => {
      // Silencia erros de analytics — nunca devem impactar as respostas da API
    });
  }
  next(); // ← Imediato, não espera a query acima
};
