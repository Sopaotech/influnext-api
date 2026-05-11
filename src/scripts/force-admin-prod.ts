import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'alexsandro.adm@influnext.com.br'; // Ajuste para o seu e-mail se for diferente
  const password = 'Juninho1440@'; // Sua senha definitiva
  
  console.log(`🚀 Iniciando reset de Admin para: ${email}...`);

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        role: 'ADMIN',
        passwordHash,
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE'
      },
      create: {
        email: email.toLowerCase().trim(),
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
