import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  }
  
  console.log(`🚀 Iniciando reset de Admin para: ${email}...`);

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        passwordHash,
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE'
      },
      create: {
        email,
        role: 'ADMIN',
        passwordHash,
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE'
      }
    });

    console.log('✅ SUCESSO: Seu usuário foi configurado como ADMIN na produção.');
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
