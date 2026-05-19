import { prisma } from './prisma';
import bcrypt from 'bcrypt';

/**
 * Função para garantir que o administrador principal tenha acesso.
 * Chamada durante a inicialização do servidor.
 */
export async function ensureAdminExists() {
  const adminEmail = 'alexsandrojunior144@gmail.com';
  const adminPassword = 'Juninho1440@';

  try {
    console.log(`[ADMIN-INIT] Verificando acesso para: ${adminEmail}`);

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const user = await prisma.user.upsert({
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

    console.log(`[ADMIN-INIT] ✅ Administrador pronto: ${user.email} (ID: ${user.id})`);
  } catch (error) {
    console.error('[ADMIN-INIT] ❌ Erro ao configurar administrador:', error);
  }
}
