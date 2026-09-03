const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://influnext.com.br',
  'https://www.influnext.com.br',
  'https://influnext.com',
  'https://www.influnext.com',
];

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.origin === value.trim().replace(/\/$/, '') ? url.origin : null;
  } catch {
    return null;
  }
}

export function getAllowedOrigins(): string[] {
  const configured = process.env.ALLOWED_ORIGINS?.split(',') || DEFAULT_ALLOWED_ORIGINS;
  return configured.map(value => normalizeOrigin(value)).filter((value): value is string => Boolean(value));
}

export function isAllowedOrigin(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = normalizeOrigin(value);
  return normalized !== null && getAllowedOrigins().includes(normalized);
}
