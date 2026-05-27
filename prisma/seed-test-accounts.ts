import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando criação de contas de teste...');

  const passwordHash = await bcrypt.hash('123456', 12);

  // 1. Conta Empresa (Company)
  const companyEmail = 'empresa@teste.com';
  const companyUser = await prisma.user.upsert({
    where: { email: companyEmail },
    update: { passwordHash },
    create: {
      email: companyEmail,
      passwordHash,
      role: 'COMPANY',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
    },
  });

  await prisma.companyProfile.upsert({
    where: { userId: companyUser.id },
    update: {
      companyName: 'Empresa Teste SA',
      taxId: '12345678901234',
    },
    create: {
      userId: companyUser.id,
      companyName: 'Empresa Teste SA',
      taxId: '12345678901234',
      city: 'São Paulo',
      state: 'SP',
      segment: 'Tecnologia',
    }
  });

  console.log(`✅ Empresa de Teste criada: ${companyEmail} | Senha: 123456`);

  // 2. Conta Influenciador (Influencer)
  const influencerEmail = 'influenciador@teste.com';
  const influencerUser = await prisma.user.upsert({
    where: { email: influencerEmail },
    update: { passwordHash },
    create: {
      email: influencerEmail,
      passwordHash,
      role: 'INFLUENCER',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
    },
  });

  await prisma.influencerProfile.upsert({
    where: { userId: influencerUser.id },
    update: {
      handle: 'influ_teste',
    },
    create: {
      userId: influencerUser.id,
      handle: 'influ_teste',
      city: 'Rio de Janeiro',
      state: 'RJ',
      niche: 'Tecnologia',
      influScore: 85,
      scoreClass: 'GOLD',
    }
  });

  console.log(`✅ Influenciador de Teste criado: ${influencerEmail} | Senha: 123456`);

  console.log('🚀 Contas de teste configuradas com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
