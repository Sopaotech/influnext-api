export interface SanitizedProviderError {
  message: string;
  status?: number;
  code?: string;
}

const SENSITIVE_MESSAGE_PATTERN = /(?:bearer\s+|access[_\s-]?token|refresh[_\s-]?token|client[_\s-]?secret|authorization\s*[:=])/i;
const URL_PATTERN = /https?:\/\/\S+/gi;
const SAFE_CODE_PATTERN = /^[a-z0-9_.-]{1,80}$/i;

export function sanitizeProviderMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;

  const message = value.trim();
  if (!message || SENSITIVE_MESSAGE_PATTERN.test(message)) return fallback;

  return message.replace(URL_PATTERN, '[provider-url]').slice(0, 500);
}

export function sanitizeProviderError(error: unknown, fallback = 'Falha na comunicação com o provedor.'): SanitizedProviderError {
  const candidate = error as any;
  const data = candidate?.response?.data;
  const rawMessage = data?.error?.message
    ?? (typeof data?.error === 'string' ? data.error : undefined)
    ?? data?.error_message
    ?? data?.message
    ?? candidate?.message;
  const rawCode = data?.error?.code
    ?? data?.error_code
    ?? data?.code
    ?? candidate?.code;
  const status = candidate?.response?.status;

  const sanitized: SanitizedProviderError = {
    message: sanitizeProviderMessage(rawMessage, fallback),
  };

  if (typeof status === 'number' && Number.isFinite(status)) {
    sanitized.status = status;
  }
  if ((typeof rawCode === 'string' || typeof rawCode === 'number') && SAFE_CODE_PATTERN.test(String(rawCode))) {
    sanitized.code = String(rawCode);
  }

  return sanitized;
}
