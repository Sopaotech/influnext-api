import { NextFunction, Request, Response } from 'express';

export function developmentOrTestOnly(_req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  res.status(404).json({ error: 'Not found.' });
}

