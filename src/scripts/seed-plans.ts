import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Semeando planos de assinatura...');

  const plans = [
    {
      name: 'Plano Influencer Pro',
      price: 97.00,
      interval: 'month',
      externalId: 'plan_pro_influencer_1', // ID que você criará no Pagar.me
    },
    {
      name: 'Plano Brand Enterprise',
      price: 497.00,
      interval: 'month',
      externalId: 'plan_brand_enterprise_1',
    }
  ];

  for (const plan of plans) {
    const createdPlan = await prisma.plan.upsert({
      where: { id: plan.externalId || 'default' }, // Usando externalId como chave ou gerando um novo
      update: {},
      create: {
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        externalId: plan.externalId,
        active: true
      }
    });
    console.log(`✅ Plano criado: ${createdPlan.name} - R$ ${createdPlan.price}`);
  }

  console.log('🚀 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
