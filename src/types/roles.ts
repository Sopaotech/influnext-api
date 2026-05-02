export const UserRole = {
  ADMIN: 'ADMIN',
  INFLUENCER: 'INFLUENCER',
  COMPANY: 'COMPANY'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
