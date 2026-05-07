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
    update: {},
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
      name: 'Plano Influencer Pro',
      price: 97.00,
      interval: 'month',
    },
    {
      id: 'plan_brand_enterprise_1',
      name: 'Plano Brand Enterprise',
      price: 497.00,
      interval: 'month',
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        price: plan.price,
      },
      create: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        externalId: plan.id,
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
