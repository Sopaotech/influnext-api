const JWT_SECRET_ERROR = 'JWT_SECRET is required and must not be empty.';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error(JWT_SECRET_ERROR);
  }

  return secret;
}

