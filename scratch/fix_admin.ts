import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'alexsandrojunior144@gmail.com';
  const password = 'Juninho1440@';
  const role = 'ADMIN';

  console.log(`🚀 Iniciando configuração do Admin: ${email}`);

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role,
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE',
      },
      create: {
        email,
        passwordHash,
        role,
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE',
      },
    });

    console.log('✅ Usuário Admin configurado com sucesso!');
    console.log('Dados do usuário:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('❌ Erro ao configurar Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
