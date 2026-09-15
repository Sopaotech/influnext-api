import { sanitizeProviderError } from './provider-error';

export type InstagramSyncErrorCode =
  | 'TOKEN_INVALID'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'SYNC_UNAVAILABLE';

export interface InstagramSyncFailure {
  code: InstagramSyncErrorCode;
  reconnectRequired: boolean;
}

/** A token-safe failure shape shared by the collector and its BullMQ consumer. */
export class InstagramSyncOperationalError extends Error {
  readonly code: InstagramSyncErrorCode;
  readonly reconnectRequired: boolean;

  constructor(failure: InstagramSyncFailure) {
    super('Falha ao sincronizar métricas do Instagram.');
    this.name = 'InstagramSyncOperationalError';
    this.code = failure.code;
    this.reconnectRequired = failure.reconnectRequired;
  }
}

export function classifyInstagramSyncFailure(error: unknown): InstagramSyncFailure {
  const sanitized = sanitizeProviderError(error);
  const providerCode = sanitized.code?.toLowerCase();

  if (sanitized.status === 401 || providerCode === 'invalid_token') {
    return { code: 'TOKEN_INVALID', reconnectRequired: true };
  }
  if (sanitized.status === 403 || providerCode === 'permission_denied') {
    return { code: 'PERMISSION_DENIED', reconnectRequired: true };
  }
  if (sanitized.status === 429) {
    return { code: 'RATE_LIMITED', reconnectRequired: false };
  }
  if (sanitized.status && sanitized.status >= 500) {
    return { code: 'PROVIDER_UNAVAILABLE', reconnectRequired: false };
  }

  return { code: 'SYNC_UNAVAILABLE', reconnectRequired: false };
}
