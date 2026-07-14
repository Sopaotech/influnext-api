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
