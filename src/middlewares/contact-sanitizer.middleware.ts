import { Request, Response, NextFunction } from 'express';

// Expressões regulares para detecção de contatos externos e chaves de pagamento
const PHONE_REGEX = /(\+?55\s?)?(\(?\d{2}\)?\s?)?(9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/g;
const WHATSAPP_KEYWORD_REGEX = /(chama\s+no\s+zap|meu\s+whats|chama\s+no\s+wpp|fala\s+no\s+whatsapp|me\s+add\s+no\s+whats|chama\s+no\s+whatsapp)/gi;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CPF_CNPJ_REGEX = /(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{11}|\d{14})/g;
const EXTERNAL_DM_REGEX = /(manda\s+dm\s+no\s+insta|fala\s+no\s+telegram|dm\s+do\s+instagram|meu\s+telegram)/gi;

const REPLACEMENT_MASK = '[CONTATO BLOQUEADO POR SEGURANÇA 🛡️]';

export function sanitizeText(text: string): { sanitizedText: string; hasViolations: boolean } {
  if (typeof text !== 'string' || !text.trim()) {
    return { sanitizedText: text, hasViolations: false };
  }

  let original = text;
  let sanitized = text
    .replace(EMAIL_REGEX, REPLACEMENT_MASK)
    .replace(WHATSAPP_KEYWORD_REGEX, REPLACEMENT_MASK)
    .replace(PHONE_REGEX, REPLACEMENT_MASK)
    .replace(EXTERNAL_DM_REGEX, REPLACEMENT_MASK);

  const hasViolations = original !== sanitized;

  return { sanitizedText: sanitized, hasViolations };
}

/**
 * Middleware express para sanitização de requisições de criação de contrato e mensagens
 */
export function sanitizeContactData(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  const fieldsToSanitize = ['briefing', 'title', 'description', 'message', 'campaignTitle'];
  let totalViolations = 0;

  for (const field of fieldsToSanitize) {
    if (typeof req.body[field] === 'string') {
      const { sanitizedText, hasViolations } = sanitizeText(req.body[field]);
      if (hasViolations) {
        req.body[field] = sanitizedText;
        totalViolations++;
      }
    }
  }

  if (totalViolations > 0) {
    console.warn(`[ANTI-BYPASS] 🛡️ Tentativa de envio de dados de contato externos detectada e sanitizada no IP ${req.ip}.`);
  }

  next();
}
