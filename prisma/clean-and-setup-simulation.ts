import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpeza COMPLETA do banco de dados (Zerar Tudo)...');

  // 1. Excluir dados vinculados respeitando chaves estrangeiras
  console.log('🗑️ Excluindo entregas (Deliverables)...');
  await prisma.deliverable.deleteMany({});

  console.log('🗑️ Excluindo contratos (Contracts)...');
  await prisma.contract.deleteMany({});

  console.log('🗑️ Excluindo referências de tendências (TrendReferences)...');
  await prisma.trendReference.deleteMany({});

  console.log('🗑️ Excluindo conexões de redes sociais (SocialPlatforms)...');
  await prisma.socialPlatform.deleteMany({});

  console.log('🗑️ Excluindo snapshots de métricas (MetricSnapshots)...');
  await prisma.metricSnapshot.deleteMany({});

  console.log('🗑️ Excluindo cartões de tarifas (RateCards)...');
  await prisma.rateCard.deleteMany({});

  console.log('🗑️ Excluindo análises de IA (AIAnalyses)...');
  await prisma.aIAnalysis.deleteMany({});

  console.log('🗑️ Excluindo tarefas (Tasks)...');
  await prisma.task.deleteMany({});

  console.log('🗑️ Excluindo assinaturas (Subscriptions)...');
  await prisma.subscription.deleteMany({});

  console.log('🗑️ Excluindo notificações (Notifications)...');
  await prisma.notification.deleteMany({});

  console.log('🗑️ Excluindo tickets de suporte (SupportTickets)...');
  await prisma.supportTicket.deleteMany({});

  console.log('🗑️ Excluindo perfis de empresas (CompanyProfiles)...');
  await prisma.companyProfile.deleteMany({});

  console.log('🗑️ Excluindo perfis de influenciadores (InfluencerProfiles)...');
  await prisma.influencerProfile.deleteMany({});

  console.log('🗑️ Excluindo logs de visualização de página (PageViews)...');
  await prisma.pageView.deleteMany({});

  console.log('🗑️ Excluindo estratégias administrativas (AdminStrategies)...');
  await prisma.adminStrategy.deleteMany({});

  console.log('🗑️ Excluindo todos os usuários (Users)...');
  await prisma.user.deleteMany({});

  console.log('🗑️ Excluindo planos de assinatura (Plans)...');
  await prisma.plan.deleteMany({});

  console.log('✅ Banco de dados limpo com sucesso!');

  // 2. Criar contas de administrador oficiais zeradas
  console.log('👤 Criando administradores oficiais...');

  const passwordHashAlexsandro = await bcrypt.hash('123456', 12);
  const admin1 = await prisma.user.create({
    data: {
      email: 'alexsandro@influnext.com.br',
      passwordHash: passwordHashAlexsandro,
      role: 'ADMIN',
      onboardingCompleted: false,
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: 'MASTER',
    }
  });
  console.log(`✅ Administrador 1 criado: ${admin1.email} (onboarding zerado)`);

  const passwordHashJuninho = await bcrypt.hash('Juninho1440@', 12);
  const admin2 = await prisma.user.create({
    data: {
      email: 'alexsandrojunior144@gmail.com',
      passwordHash: passwordHashJuninho,
      role: 'ADMIN',
      onboardingCompleted: false,
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: 'MASTER',
    }
  });
  console.log(`✅ Administrador 2 criado: ${admin2.email} (onboarding zerado)`);

  // 3. Cadastrar Planos de Assinatura Básicos de Produção (para o sistema não quebrar ao buscar planos)
  console.log('🌱 Cadastrando planos de assinatura padrão...');
  const plans = [
    {
      id: 'plan_pro_influencer_1',
      name: 'Plano Creator Premium',
      price: 49.90,
      interval: 'month',
      externalId: process.env.STRIPE_PRICE_PRO || 'plan_pro_influencer_1',
    },
    {
      id: 'plan_brand_enterprise_1',
      name: 'Plano Agency / Co-Working',
      price: 110.00,
      interval: 'month',
      externalId: process.env.STRIPE_PRICE_ENTERPRISE || 'plan_brand_enterprise_1',
    }
  ];

  for (const plan of plans) {
    await prisma.plan.create({
      data: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        externalId: plan.externalId,
        active: true
      }
    });
    console.log(`   - Plano: ${plan.name} (R$ ${plan.price})`);
  }

  console.log('🎉 Reset do banco de dados concluído! O sistema está limpo e pronto do zero.');
}

main()
  .catch((e) => {
    console.error('❌ Erro no script de limpeza/reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
