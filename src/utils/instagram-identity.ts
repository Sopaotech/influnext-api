/** Safe, identifier-free failure used when an Instagram identity belongs elsewhere. */
export class InstagramIdentityConflictError extends Error {
  readonly code = 'IDENTITY_CONFLICT';

  constructor() {
    super('Instagram identity is already associated with another creator.');
    this.name = 'InstagramIdentityConflictError';
  }
}
