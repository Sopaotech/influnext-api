import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * 1. Configuração do Helmet para Security Headers
 * Injeta HSTS (1 ano), Anti-Clickjacking, NoSniff, Referrer-Policy e CSP flexível
 */
export const helmetSecurity = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.influnext.com.br', 'https://influnext.com.br', 'http://localhost:4000', 'http://localhost:3000'],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

/**
 * 2. Rate Limiter Global (Anti-DDoS / API Abuse)
 * Limite de 150 requisições por minuto por IP
 */
export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Muitas requisições originadas deste IP. Por favor, aguarde 1 minuto.'
  }
});

/**
 * 3. Rate Limiter para Autenticação (Anti Brute-Force)
 * Limite de 20 tentativas a cada 15 minutos para rotas críticas de login/registro
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Attempts',
    message: 'Muitas tentativas de autenticação detectadas. Por segurança, tente novamente em 15 minutos.'
  }
});

/**
 * 4. Rate Limiter para Mídia Kit Público (Anti-Scraping / Bot Protection)
 * Limite de 60 requisições por minuto
 */
export const publicRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Limite de consultas atingido. Tente novamente em instantes.'
  }
});

/**
 * 5. Middleware de Sanitização e Ocultação de Tecnologias (Data Trimming)
 */
export const responseHardening = (req: Request, res: Response, next: NextFunction) => {
  // Remove o header padrão do Express para dificultar fingerprinting
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};
