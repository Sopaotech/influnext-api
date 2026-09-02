import bcrypt from 'bcrypt';
import { prisma } from './prisma';

/**
 * Bootstrap administrativo manual para ambientes locais e de teste.
 * Esta função não é chamada pelo startup da aplicação.
 */
export async function ensureAdminExists() {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    throw new Error('Administrative bootstrap is disabled outside development and test.');
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required for manual administrative bootstrap.');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  return prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'ADMIN',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
    },
  });
}
