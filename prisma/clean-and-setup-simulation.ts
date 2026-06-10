import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();
import { AIService } from '../src/services/ai.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpeza do banco de dados (preservando administrador)...');

  // 1. Identificar o administrador
  const adminUser = await prisma.user.findUnique({
    where: { email: 'alexsandro@influnext.com.br' },
    include: { influencer: true, company: true }
  });

  if (!adminUser) {
    console.log('⚠️ Administrador alexsandro@influnext.com.br não encontrado no banco de dados!');
  } else {
    console.log(`👤 Administrador encontrado: ID=${adminUser.id}`);
  }

  // IDs a serem preservados
  const adminUserId = adminUser?.id;
  const adminInfluencerId = adminUser?.influencer?.id;
  const adminCompanyId = adminUser?.company?.id;

  // 2. Excluir dados vinculados a outros usuários respeitando chaves estrangeiras
  console.log('🗑️ Excluindo registros secundários de outros usuários...');

  // Excluir Deliverables
  await prisma.deliverable.deleteMany({
    where: adminInfluencerId && adminCompanyId ? {
      contract: {
        NOT: {
          influencerId: adminInfluencerId,
          companyId: adminCompanyId
        }
      }
    } : {}
  });

  // Excluir Contracts
  await prisma.contract.deleteMany({
    where: adminInfluencerId && adminCompanyId ? {
      NOT: {
        influencerId: adminInfluencerId,
        companyId: adminCompanyId
      }
    } : {}
  });

  // Excluir TrendReferences
  await prisma.trendReference.deleteMany({
    where: adminInfluencerId ? {
      NOT: { influencerId: adminInfluencerId }
    } : {}
  });

  // Excluir SocialPlatforms
  await prisma.socialPlatform.deleteMany({
    where: adminInfluencerId ? {
      NOT: { influencerId: adminInfluencerId }
    } : {}
  });

  // Excluir MetricSnapshots
  await prisma.metricSnapshot.deleteMany({
    where: adminInfluencerId ? {
      NOT: { influencerId: adminInfluencerId }
    } : {}
  });

  // Excluir RateCards
  await prisma.rateCard.deleteMany({
    where: adminInfluencerId ? {
      NOT: { influencerId: adminInfluencerId }
    } : {}
  });

  // Excluir AIAnalyses
  await prisma.aIAnalysis.deleteMany({
    where: adminInfluencerId ? {
      NOT: { influencerId: adminInfluencerId }
    } : {}
  });

  // Excluir Tasks
  await prisma.task.deleteMany({
    where: adminInfluencerId ? {
      NOT: { influencerId: adminInfluencerId }
    } : {}
  });

  // Excluir Subscriptions
  await prisma.subscription.deleteMany({
    where: adminUserId ? {
      NOT: { userId: adminUserId }
    } : {}
  });

  // Excluir Notifications
  await prisma.notification.deleteMany({
    where: adminUserId ? {
      NOT: { userId: adminUserId }
    } : {}
  });

  // Excluir SupportTickets
  await prisma.supportTicket.deleteMany({
    where: adminUserId ? {
      NOT: { userId: adminUserId }
    } : {}
  });

  // Excluir CompanyProfiles
  await prisma.companyProfile.deleteMany({
    where: adminUserId ? {
      NOT: { userId: adminUserId }
    } : {}
  });

  // Excluir InfluencerProfiles
  await prisma.influencerProfile.deleteMany({
    where: adminUserId ? {
      NOT: { userId: adminUserId }
    } : {}
  });

  // Excluir Users (exceto admin)
  await prisma.user.deleteMany({
    where: adminUserId ? {
      NOT: { id: adminUserId }
    } : {}
  });

  console.log('✅ Banco de dados limpo com sucesso!');

  // 3. Criar Contas de Teste Oficiais
  console.log('🌱 Criando contas de teste oficiais e simulando conexões...');

  const passwordHash = await bcrypt.hash('123456', 12);

  // 3.1. Empresa de Teste (Company)
  const companyEmail = 'empresa@teste.com';
  const companyUser = await prisma.user.create({
    data: {
      email: companyEmail,
      passwordHash,
      role: 'COMPANY',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
    }
  });

  const companyProfile = await prisma.companyProfile.create({
    data: {
      userId: companyUser.id,
      companyName: 'Loreal Brasil SA',
      taxId: '98765432109876',
      city: 'Rio de Janeiro',
      state: 'RJ',
      segment: 'Beleza & Cosméticos',
      campaignBudget: 'R$ 50.000 - R$ 100.000'
    }
  });

  console.log(`✅ Empresa de Teste: ${companyEmail} | Senha: 123456 | Perfil: @loreal_brasil`);

  // 3.2. Influenciador de Teste (Influencer)
  const influencerEmail = 'influenciador@teste.com';
  const influencerUser = await prisma.user.create({
    data: {
      email: influencerEmail,
      passwordHash,
      role: 'INFLUENCER',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
    }
  });

  const influencerProfile = await prisma.influencerProfile.create({
    data: {
      userId: influencerUser.id,
      handle: 'demo.influencer',
      city: 'São Paulo',
      state: 'SP',
      niche: 'Tecnologia',
      influScore: 92,
      scoreClass: 'PLATINUM',
      bio: 'Criador de conteúdo focado em inteligência profissional e tecnologia.'
    }
  });

  console.log(`✅ Influenciador de Teste: ${influencerEmail} | Senha: 123456 | Perfil: @demo.influencer`);

  // Adicionar conexões de redes sociais para o Demo Influencer para exibição
  await prisma.socialPlatform.createMany({
    data: [
      {
        influencerId: influencerProfile.id,
        platformName: 'INSTAGRAM',
        platformId: 'ig_123',
        username: 'demo.influencer',
        followersCount: 125000,
        accessToken: 'mock_token_ig'
      },
      {
        influencerId: influencerProfile.id,
        platformName: 'TIKTOK',
        platformId: 'tt_123',
        username: 'demo.influencer',
        followersCount: 342000,
        accessToken: 'mock_token_tt'
      },
      {
        influencerId: influencerProfile.id,
        platformName: 'YOUTUBE',
        platformId: 'yt_123',
        username: 'demo.influencer',
        followersCount: 88000,
        accessToken: 'mock_token_yt'
      }
    ]
  });

  // Criar snapshots de métricas para alimentar os gráficos
  await prisma.metricSnapshot.createMany({
    data: [
      {
        influencerId: influencerProfile.id,
        provider: 'INSTAGRAM',
        followers: 125000,
        engagementRate: 4.8,
        reachLast30Days: 95000,
        avgViews: 12000,
        integrityHash: 'hash_ig'
      },
      {
        influencerId: influencerProfile.id,
        provider: 'TIKTOK',
        followers: 342000,
        engagementRate: 8.2,
        reachLast30Days: 280000,
        avgViews: 45000,
        integrityHash: 'hash_tt'
      },
      {
        influencerId: influencerProfile.id,
        provider: 'YOUTUBE',
        followers: 88000,
        engagementRate: 5.5,
        reachLast30Days: 60000,
        avgViews: 8500,
        integrityHash: 'hash_yt'
      }
    ]
  });

  // 4. Vincular ambos os usuários criando contratos simulados com ciclo completo de fluxo
  console.log('🤝 Criando contratos simulados entre Empresa e Influenciador de teste...');

  // Contrato 1: Concluído e pago (Histórico de Sucesso)
  const contractCompleted = await prisma.contract.create({
    data: {
      companyId: companyProfile.id,
      influencerId: influencerProfile.id,
      title: 'Lançamento Loreal Paris Pro',
      briefing: 'Gravar 1 Reels e 3 Stories demonstrando a nova linha profissional Loreal.',
      aiScript: 'Roteiro estratégico: Começar destacando a importância dos cuidados diários. Apresentar o produto em ação. Chamar para compra.',
      budget: 2500.00,
      platformFee: 250.00,
      netAmount: 2250.00,
      escrowStatus: 'COMPLETED',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 dias atrás
    }
  });

  await prisma.deliverable.create({
    data: {
      contractId: contractCompleted.id,
      type: 'Reels + Stories',
      deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      proofUrl: 'https://instagram.com/reel/demo_loreal'
    }
  });

  // Contrato 2: Em progresso (Fluxo Ativo)
  const contractActive = await prisma.contract.create({
    data: {
      companyId: companyProfile.id,
      influencerId: influencerProfile.id,
      title: 'Campanha de Inverno Loreal',
      briefing: 'Postagem de Carrossel no feed e Stories recomendando rotinas de hidratação de inverno.',
      aiScript: 'Enfatizar a proteção contra o frio urbano. Mostrar rotina rápida de 3 passos.',
      budget: 3500.00,
      platformFee: 350.00,
      netAmount: 3150.00,
      escrowStatus: 'IN_PROGRESS',
      createdAt: new Date()
    }
  });

  await prisma.deliverable.create({
    data: {
      contractId: contractActive.id,
      type: 'Carrossel Feed + Stories',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'PENDING'
    }
  });

  // 5. Adicionar tarefas no Calendário para o Demo Influencer
  console.log('📅 Criando tarefas estratégicas para o Demo Influencer...');

  const tasksData = [
    { day: 2, title: 'Definição da linha editorial de Junho', desc: 'Planejar os temas de posts, carrosséis e reels de acordo com a estratégia do Sócio.', isDone: true, fromAI: false },
    { day: 5, title: 'Reunião de Alinhamento com Loreal Brasil', desc: 'Apresentação do Mídia Kit e fechamento do contrato de R$ 2.500.', isDone: true, fromAI: true },
    { day: 8, title: 'Gravar Reels para Campanha Loreal Paris Pro', desc: 'Focar na qualidade profissional dos fios. Roteiro da IA aprovado.', isDone: true, fromAI: true },
    { day: 9, title: 'Postar Stories: Dia a Dia Espontâneo', desc: 'Postar bastidores sem pretensão comercial. Humanizar a marca gera engajamento e conexão real.', isDone: true, fromAI: true },
    { day: 12, title: 'Entrega do Reels finalizado para aprovação da Loreal', desc: 'Fazer o upload do link da prova na InfluNext.', isDone: false, fromAI: false },
    { day: 15, title: 'Planejamento de Roteiro para Campanha de Inverno', desc: 'Script sugerido pela IA aprovado pela marca parceira.', isDone: false, fromAI: true },
    { day: 18, title: 'Postar Stories: Rotina de Criador (Bastidores)', desc: 'Compartilhar um momento aleatório/espontâneo da sua rotina. Gestão e crescimento orgânico de carreira.', isDone: false, fromAI: true },
    { day: 20, title: 'Disparo de Propostas Comerciais', desc: 'Enviar proposta comercial para marcas cosméticas utilizando as estatísticas da InfluNext.', isDone: false, fromAI: true },
    { day: 22, title: 'Revisão de Tendências no Trends Vault', desc: 'Analizar tendências de beleza e estética em alta para o feed.', isDone: false, fromAI: true }
  ];

  for (const item of tasksData) {
    const scheduledDate = new Date(2026, 5, item.day, 12, 0, 0); // Junho de 2026

    await prisma.task.create({
      data: {
        influencerId: influencerProfile.id,
        title: item.title,
        description: item.desc,
        scheduledDate: scheduledDate,
        isDone: item.isDone,
        fromAI: item.fromAI
      }
    });
  }

  console.log('🤖 Gerando análise estratégica com Inteligência Artificial (Gemini)...');
  try {
    const analysis = await AIService.generateWeeklyAnalysis(influencerProfile.id);
    console.log('--------------------------------------------------');
    if (analysis) {
      console.log(analysis.analysisText);
    } else {
      console.log('Nenhuma análise gerada.');
    }
    console.log('--------------------------------------------------');
    
    // Buscar tarefas geradas pela IA no banco de dados para confirmar que foram salvas
    const dbTasks = await prisma.task.findMany({
      where: { influencerId: influencerProfile.id, fromAI: true },
      orderBy: { scheduledDate: 'asc' }
    });
    console.log(`📊 Tarefas criadas pela IA no Banco de Dados (${dbTasks.length} encontradas):`);
    dbTasks.forEach(task => {
      console.log(`   - [ ] ${task.title}: ${task.description}`);
    });
    
    // Buscar referências de tendências no banco de dados
    const dbTrends = await prisma.trendReference.findMany({
      where: { influencerId: influencerProfile.id }
    });
    console.log(`📊 Referências visuais salvas no Trend Vault (${dbTrends.length} encontradas):`);
    dbTrends.forEach(trend => {
      console.log(`   - ${trend.title} (${trend.videoUrl})`);
    });
    console.log('--------------------------------------------------');
  } catch (aiErr: any) {
    console.error('❌ Erro ao gerar estratégia da IA:', aiErr.message || aiErr);
  }

  console.log('🚀 Configuração da Simulação concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no script de simulação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
