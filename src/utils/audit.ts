import crypto from 'crypto';

/**
 * Gera um hash SHA-256 determinístico dos dados capturados.
 * As chaves são ordenadas para garantir que o mesmo objeto produza sempre o mesmo hash.
 */
export function generateIntegrityHash(data: Record<string, unknown>): string {
  const str = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(str).digest('hex');
}
