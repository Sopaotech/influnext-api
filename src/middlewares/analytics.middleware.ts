import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const trackPageView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Apenas rastrear rotas públicas ou de dashboard, ignorar assets
    if (req.method === 'GET' && !req.path.includes('.') && !req.path.includes('/api/')) {
       await prisma.pageView.create({
         data: {
           path: req.path,
           userAgent: req.get('user-agent'),
           ip: req.ip
         }
       });
    }
  } catch (err) {
    console.error('[ANALYTICS] Erro ao rastrear view:', err);
  }
  next();
};
