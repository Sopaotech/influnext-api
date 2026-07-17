import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de Produção...');

  // 1. Admin Master
  const adminEmail = process.env.ADMIN_EMAIL || 'Alexsandrojunior144@gmail.com'.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Juninho1440@';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin master configurado: ${admin.email}`);

  // 2. Planos de Assinatura
  const plans = [
    {
      id: 'plan_pro_influencer_1',
      name: 'Plano Creator Premium',
      price: 49.00,
      interval: 'month',
      externalId: process.env.STRIPE_PRICE_PRO || 'plan_pro_influencer_1',
    },
    {
      id: 'plan_brand_enterprise_1',
      name: 'Plano Agency / Co-Working',
      price: 119.00,
      interval: 'month',
      externalId: process.env.STRIPE_PRICE_ENTERPRISE || 'plan_brand_enterprise_1',
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        price: plan.price,
        externalId: plan.externalId,
      },
      create: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        externalId: plan.externalId,
        active: true
      }
    });
    console.log(`✅ Plano configurado: ${plan.name} (R$ ${plan.price})`);
  }
  // 3. Contas de Teste Integradas
  console.log('🌱 Iniciando criação de contas de teste...');
  const testPasswordHash = await bcrypt.hash('123456', 12);

  // 3a. Conta Empresa (Company)
  const companyEmail = 'empresa@teste.com';
  const companyUser = await prisma.user.upsert({
    where: { email: companyEmail },
    update: { passwordHash: testPasswordHash },
    create: {
      email: companyEmail,
      passwordHash: testPasswordHash,
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

  // 3b. Conta Influenciador (Influencer)
  const influencerEmail = 'influenciador@teste.com';
  const influencerUser = await prisma.user.upsert({
    where: { email: influencerEmail },
    update: { passwordHash: testPasswordHash },
    create: {
      email: influencerEmail,
      passwordHash: testPasswordHash,
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

  // 3c. Mock Service Providers
  const serviceAccounts = [
    { email: 'fotografo@teste.com', handle: 'pedro_ph', city: 'São Paulo', state: 'SP', niche: 'Serviços' },
    { email: 'editor@teste.com', handle: 'lucas_filmes', city: 'Rio de Janeiro', state: 'RJ', niche: 'Serviços' },
    { email: 'socialmedia@teste.com', handle: 'ana_social', city: 'Belo Horizonte', state: 'MG', niche: 'Serviços' }
  ];

  for (const svc of serviceAccounts) {
    const svcUser = await prisma.user.upsert({
      where: { email: svc.email },
      update: { passwordHash: testPasswordHash },
      create: {
        email: svc.email,
        passwordHash: testPasswordHash,
        role: 'INFLUENCER',
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE',
      }
    });

    await prisma.influencerProfile.upsert({
      where: { userId: svcUser.id },
      update: {
        handle: svc.handle,
        niche: svc.niche,
        city: svc.city,
        state: svc.state,
      },
      create: {
        userId: svcUser.id,
        handle: svc.handle,
        city: svc.city,
        state: svc.state,
        niche: svc.niche,
        influScore: 80,
        scoreClass: 'GOLD',
      }
    });
    console.log(`✅ Provedor de Serviço criado: ${svc.email} | Senha: 123456`);
  }
  
  console.log('🚀 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
