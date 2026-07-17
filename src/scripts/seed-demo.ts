/**
 * Script de Seed para Usuários Demo — Influnext
 * 
 * Cria:
 * - influencer@demo.influnext.com.br  /  Demo@2026!
 * - empresa@demo.influnext.com.br     /  Demo@2026!
 * - 1 contrato COMPLETED entre eles (para demo de saldo na Wallet)
 * 
 * Execute: npx ts-node src/scripts/seed-demo.ts
 */

import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

const DEMO_PASSWORD = 'Demo@2026!';

export async function seedDemo() {
  console.log('🌱 [SEED] Iniciando seed de usuários demo...\n');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── 1. Influenciador Demo ──────────────────────────────────────────────────
  const influencerUser = await prisma.user.upsert({
    where: { email: 'influencer@demo.influnext.com.br' },
    update: { passwordHash, role: 'INFLUENCER', onboardingCompleted: true, subscriptionStatus: 'ACTIVE', subscriptionTier: 'PRO' },
    create: {
      email: 'influencer@demo.influnext.com.br',
      passwordHash,
      role: 'INFLUENCER',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: 'PRO',
    }
  });
  console.log(`✅ Usuário influencer: ${influencerUser.email}`);

  const influencerProfile = await prisma.influencerProfile.upsert({
    where: { userId: influencerUser.id },
    update: {},
    create: {
      userId: influencerUser.id,
      handle: 'demo.influencer',
      niche: 'Fashion & Lifestyle',
      bio: 'Criadora de conteúdo premium — parceira estratégica de marcas que buscam autenticidade.',
      city: 'São Paulo',
      state: 'SP',
      influScore: 78,
      scoreClass: 'GOLD',
      careerObjective: 'FAME',
      profileImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop',
    }
  });
  console.log(`✅ Perfil influencer: @${influencerProfile.handle}`);

  // ── 2. Empresa Demo ────────────────────────────────────────────────────────
  const companyUser = await prisma.user.upsert({
    where: { email: 'empresa@demo.influnext.com.br' },
    update: { passwordHash, role: 'COMPANY', onboardingCompleted: true, subscriptionStatus: 'ACTIVE', subscriptionTier: 'PRO' },
    create: {
      email: 'empresa@demo.influnext.com.br',
      passwordHash,
      role: 'COMPANY',
      onboardingCompleted: true,
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: 'PRO',
    }
  });
  console.log(`✅ Usuário empresa: ${companyUser.email}`);

  const companyProfile = await prisma.companyProfile.upsert({
    where: { userId: companyUser.id },
    update: {
      logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop',
    },
    create: {
      userId: companyUser.id,
      companyName: 'Marca Premium Ltda',
      taxId: '00.000.000/0001-91',
      city: 'São Paulo',
      state: 'SP',
      segment: 'Fashion',
      employeeCount: '51-200',
      campaignBudget: 'R$ 50k - R$ 200k',
      logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop',
    }
  });
  console.log(`✅ Perfil empresa: ${companyProfile.companyName}`);

  // ── 3. Contrato Demo (COMPLETED) — gera saldo na Wallet ───────────────────
  const existingContract = await prisma.contract.findFirst({
    where: {
      influencerId: influencerProfile.id,
      companyId: companyProfile.id,
      escrowStatus: 'COMPLETED'
    }
  });

  if (!existingContract) {
    const contract = await prisma.contract.create({
      data: {
        influencerId: influencerProfile.id,
        companyId: companyProfile.id,
        title: 'Campanha Summer Collection 2026',
        briefing: 'Criação de 3 Reels + 5 Stories promovendo a coleção de verão. Foco em engajamento e vendas.',
        budget: 5000,
        platformFee: 750,   // 15% plataforma
        netAmount: 4250,    // 85% líquido para o influencer
        escrowStatus: 'COMPLETED',
        deliverables: {
          create: [
            { type: 'REELS', deadline: new Date('2026-04-15'), status: 'APPROVED', proofUrl: 'https://instagram.com' },
            { type: 'STORIES', deadline: new Date('2026-04-20'), status: 'APPROVED', proofUrl: 'https://instagram.com' },
          ]
        }
      }
    });
    console.log(`✅ Contrato demo criado: "${contract.title}" — R$ ${contract.netAmount} disponível na Wallet`);
  } else {
    console.log(`ℹ️  Contrato demo já existe, pulando criação.`);
  }

  // ── 4. Plataformas Sociais Simuladas (Para ativar os Relatórios) ────────────────
  console.log('🌱 [SEED] Gerando plataformas sociais simuladas...');
  await prisma.socialPlatform.deleteMany({ where: { influencerId: influencerProfile.id } });
  await prisma.socialPlatform.createMany({
    data: [
      {
        influencerId: influencerProfile.id,
        platformName: 'INSTAGRAM',
        platformId: 'ig_demo_123',
        username: 'demo.influencer',
        followersCount: 120000,
        accessToken: 'dummy_token'
      },
      {
        influencerId: influencerProfile.id,
        platformName: 'TIKTOK',
        platformId: 'tt_demo_123',
        username: 'demo.influencer',
        followersCount: 250000,
        accessToken: 'dummy_token'
      }
    ]
  });
  console.log('✅ Plataformas sociais (Instagram e TikTok) conectadas!');

  // ── 5. Análise de IA e Recomendações (Para ativar a Área de Trabalho) ───────────
  console.log('🌱 [SEED] Gerando análise de IA do Vincenzo...');
  await prisma.aIAnalysis.deleteMany({ where: { influencerId: influencerProfile.id } });
  
  const recommendations = {
    trends: [
      { music: "Summer Vibe (Speed Up)", videoType: "Transição de Looks", duration: "12s" },
      { music: "Lofi Chill Beats", videoType: "Bastidores e Preparação", duration: "24s" }
    ],
    suggestedTasks: [
      { title: "Gravar Reels Coleção Verão", description: "Destacar as peças em linho usando o gancho de 3s da IA.", daysFromNow: 1 },
      { title: "Postar Story Espontâneo", description: "Fazer stories mostrando bastidores da rotina sem intenção de venda.", daysFromNow: 2 }
    ],
    videoInspirations: [
      { title: "3 Looks Minimalistas no Calor", hook: "Se você ainda usa roupas escuras no verão, pare agora.", whyItWorks: "O gancho gera quebra de padrão visual e retém o público nos primeiros 3 segundos.", platform: "REELS" }
    ],
    trendingNow: {
      audios: ["Summer Vibe (Speed Up)", "Lofi Chill Beats"],
      topics: ["Moda Verão", "Look Minimalista", "Vlog de Rotina"]
    }
  };

  await prisma.aIAnalysis.create({
    data: {
      influencerId: influencerProfile.id,
      analysisText: `Vincenzo aqui, Alexsandro. Foco no caixa, temos trabalho hoje.
Sua taxa de engajamento está em 4.8% com curva ascendente, mas lembre-se: recebidos não pagam boletos. 
O contrato ativo da 'Campanha Summer Collection 2026' com a Marca Premium Ltda tem R$ 4.250,00 líquidos retidos em garantia (Escrow) segura aqui na InfluNext. O dinheiro já está depositado de forma 100% garantida pela marca, dependendo apenas da gravação e validação dos entregáveis (Reels e Stories) para cair na sua carteira.
Para hoje, ordenei 3 ações práticas: grave o Reels da coleção focando em transição rápida de looks, crie um story espontâneo de bastidores no estúdio para humanizar seu público, e verifique o áudio viral 'Summer Vibe (Speed Up)' que está decolando nas tendências locais. Mãos à obra.`,
      recommendations: JSON.stringify(recommendations)
    }
  });
  console.log('✅ Análise neural da IA gravada!');

  // ── 6. Vídeos do Trend Vault (Vídeos de Referência no Sidebar) ──────────────────
  console.log('🌱 [SEED] Gerando referências visuais do Trend Vault...');
  await prisma.trendReference.deleteMany({ where: { influencerId: influencerProfile.id } });
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 20);

  await prisma.trendReference.createMany({
    data: [
      {
        influencerId: influencerProfile.id,
        title: "Review de Tech Minimalista",
        thumbnail: "/influencers/brazilian_influencer_2_1778513129863.png",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        niche: "TECNOLOGIA, MINIMALISTA",
        expiresAt
      },
      {
        influencerId: influencerProfile.id,
        title: "Dicas de Moda Verão",
        thumbnail: "/influencers/brazilian_influencer_3_1778513143227.png",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        niche: "MODA, TENDÊNCIA",
        expiresAt
      }
    ]
  });
  console.log('✅ Vídeos de referência do Trend Vault populados!');

  // ── 7a. RateCards (Catálogo de Serviços) ──────────────────────────────────────
  console.log('🌱 [SEED] Gerando catálogo de serviços (RateCards)...');
  await prisma.rateCard.deleteMany({ where: { influencerId: influencerProfile.id } });
  await prisma.rateCard.createMany({
    data: [
      {
        influencerId: influencerProfile.id,
        serviceName: "Combo Fashion Post (1x Reels + 3x Stories)",
        price: 1500.00,
        currency: "BRL",
        description: "Combo ideal para lançamento de coleções. Inclui Reels completo mostrando os produtos no corpo e 3 sequências de Stories para engajamento e CTA direto de vendas."
      },
      {
        influencerId: influencerProfile.id,
        serviceName: "1x Reels de Provador",
        price: 900.00,
        currency: "BRL",
        description: "Gravação de Reels dinâmico com transições ágeis exibindo até 4 looks selecionados da marca com áudio viral em alta."
      },
      {
        influencerId: influencerProfile.id,
        serviceName: "Sequência de Stories Patrocinados (3 telas)",
        price: 500.00,
        currency: "BRL",
        description: "Inserção de links diretos para o e-commerce, stickers de interação e cupom de desconto exclusivo."
      }
    ]
  });
  console.log('✅ Catálogo de serviços populado!');

  // ── 7b. Missão Diária (No perfil do influenciador) ──────────────────────────────
  await prisma.influencerProfile.update({
    where: { id: influencerProfile.id },
    data: {
      dailyMission: 'Publicar 2 Stories mostrando os bastidores do seu estúdio de gravação.',
      missionCompleted: false
    }
  });
  console.log('✅ Missão diária atribuída ao perfil do influenciador!');

  // ── 7c. Contratos Simulados (Demo Contracts) ───────────────────────────────────
  console.log('🌱 [SEED] Gerando contratos simulados...');
  const today = new Date();
  await prisma.deliverable.deleteMany({
    where: {
      contract: {
        OR: [
          { influencerId: influencerProfile.id },
          { companyId: companyProfile.id }
        ]
      }
    }
  });

  await prisma.contract.deleteMany({
    where: {
      OR: [
        { influencerId: influencerProfile.id },
        { companyId: companyProfile.id }
      ]
    }
  });

  const contract1 = await prisma.contract.create({
    data: {
      companyId: companyProfile.id,
      influencerId: influencerProfile.id,
      title: "Campanha Summer Collection 2026",
      briefing: "Campanha focada na linha de linho premium da Coleção de Verão. O criador deve produzir 1 Reels mostrando 3 looks diferentes de linho e marcar a conta da marca.",
      aiScript: "Gancho: '3 looks de linho da Zara que parecem caros mas custaram pouco...' transições com whoosh e call to action no final.",
      budget: 5000.00,
      platformFee: 750.00,
      netAmount: 4250.00,
      escrowStatus: "COMPLETED",
      contractType: "SPOT",
      companySigned: true,
      influencerSigned: true,
      deliverables: {
        create: [
          {
            type: "1x Reels de Provador",
            deadline: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
            status: "COMPLETED",
            proofUrl: "https://www.instagram.com/reel/C_summer_collection_linho"
          }
        ]
      }
    }
  });

  const contract2 = await prisma.contract.create({
    data: {
      companyId: companyProfile.id,
      influencerId: influencerProfile.id,
      title: "Branding Audiovisual outono 2026",
      briefing: "Apresentação estética e minimalista do vestuário de outono da marca, focando em alta fidelidade visual.",
      aiScript: "Vídeo focado em paleta de cores terrosas e transições suaves com música ambiente.",
      budget: 5000.00,
      platformFee: 750.00,
      netAmount: 4250.00,
      escrowStatus: "IN_PROGRESS",
      contractType: "SPOT",
      companySigned: true,
      influencerSigned: true,
      deliverables: {
        create: [
          {
            type: "1x Reels Conceitual",
            deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // daqui a 5 dias
            status: "PENDING"
          }
        ]
      }
    }
  });

  // Contrato 3: Aguardando Assinatura da Empresa (DRAFT)
  const contract3 = await prisma.contract.create({
    data: {
      companyId: companyProfile.id,
      influencerId: influencerProfile.id,
      title: "Cápsula Primavera 2026",
      briefing: "Campanha de lançamento da Coleção Primavera. O criador assinou e aguarda assinatura corporativa.",
      aiScript: "Sequência de stories de transição focados na nova coleção florida.",
      budget: 3500.00,
      platformFee: 525.00,
      netAmount: 2975.00,
      escrowStatus: "DRAFT",
      contractType: "SPOT",
      companySigned: false,
      influencerSigned: true,
      deliverables: {
        create: [
          {
            type: "3x Instagram Stories",
            deadline: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
            status: "PENDING"
          }
        ]
      }
    }
  });

  // Contrato 4: Entregável em Análise (UNDER_REVIEW) - Alimenta Fila de Ação Necessária
  const contract4 = await prisma.contract.create({
    data: {
      companyId: companyProfile.id,
      influencerId: influencerProfile.id,
      title: "Parceria Inverno 2026",
      briefing: "Divulgação do casaco corta-vento impermeável da marca.",
      aiScript: "Vídeo sob chuva testando a tecnologia do produto em 15 segundos.",
      budget: 4500.00,
      platformFee: 675.00,
      netAmount: 3825.00,
      escrowStatus: "IN_PROGRESS",
      contractType: "SPOT",
      companySigned: true,
      influencerSigned: true,
      deliverables: {
        create: [
          {
            type: "1x Vídeo Teste de Impermeabilidade",
            deadline: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
            status: "UNDER_REVIEW",
            proofUrl: "https://instagram.com/p/C_inverno_impermeavel"
          }
        ]
      }
    }
  });

  console.log('✅ Contratos e Deliverables simulados gerados (incluindo testes de assinatura e fila de revisão)!');

  // ── 8. Recebidos Simulados (Para a central de recebidos/envios) ─────────────────
  console.log('🌱 [SEED] Gerando recebidos simulados...');
  await prisma.recebido.deleteMany({
    where: {
      OR: [
        { influencerId: influencerProfile.id },
        { companyId: companyProfile.id }
      ]
    }
  });

  await prisma.recebido.createMany({
    data: [
      {
        companyId: companyProfile.id,
        influencerId: influencerProfile.id,
        title: "Kit Fragrância de Verão 2026",
        description: "Envio de amostras de fragrâncias e difusores para a campanha Summer Collection.",
        status: "SHIPPED",
        trackingCode: "LG123456789BR",
        shippingCarrier: "Loggi",
        sentAt: new Date('2026-06-12T14:00:00.000Z')
      },
      {
        companyId: companyProfile.id,
        influencerId: influencerProfile.id,
        title: "Press Kit Roupas Premium Linho",
        description: "Envio das roupas de linho que serão vestidas na produção de Reels.",
        status: "RECEIVED",
        trackingCode: "PX987654321BR",
        shippingCarrier: "Correios",
        sentAt: new Date('2026-06-10T10:00:00.000Z'),
        receivedAt: new Date('2026-06-14T16:30:00.000Z')
      }
    ]
  });
  console.log('✅ Módulos de Recebidos e Envios com dados simulados!');

  // ── 8b. Histórico de Métricas (MetricSnapshot) ──────────────────────────────────
  console.log('🌱 [SEED] Gerando histórico de métricas...');
  await prisma.metricSnapshot.deleteMany({ where: { influencerId: influencerProfile.id } });
  
  const metricSnapshots = [];
  const baseDate = new Date();
  for (let i = 29; i >= 0; i--) {
    const capturedAt = new Date(baseDate);
    capturedAt.setDate(baseDate.getDate() - i);
    // Followers grow slightly day-by-day from 365,000 to 370,000
    const followers = 365000 + Math.round((370000 - 365000) * (30 - i) / 30);
    metricSnapshots.push({
      influencerId: influencerProfile.id,
      provider: 'INSTAGRAM',
      followers,
      engagementRate: 4.8,
      reachLast30Days: 150000,
      avgViews: 45000,
      capturedAt,
      integrityHash: 'dummy_hash_' + i
    });
  }
  await prisma.metricSnapshot.createMany({ data: metricSnapshots });
  console.log('✅ Histórico de métricas (MetricSnapshot) populado!');

  // ── 8c. Tarefas da IA no Calendário ──────────────────────────────────────────────
  console.log('🌱 [SEED] Gerando tarefas iniciais no calendário...');
  await prisma.task.deleteMany({ where: { influencerId: influencerProfile.id } });
  
  today.setTime(new Date().getTime());
  const day1 = new Date(today);
  day1.setDate(today.getDate() + 1);
  day1.setHours(12, 0, 0, 0); // 12:00
  
  const day2 = new Date(today);
  day2.setDate(today.getDate() + 2);
  day2.setHours(15, 0, 0, 0); // 15:00

  const day3 = new Date(today);
  day3.setDate(today.getDate() + 5);
  day3.setHours(18, 0, 0, 0); // 18:00

  await prisma.task.createMany({
    data: [
      {
        influencerId: influencerProfile.id,
        title: "Gravar Reels Coleção Verão",
        description: "Destacar as peças em linho usando o gancho de 3s da IA.",
        scheduledDate: day1,
        fromAI: true,
        isDone: true,
        performanceMultiplier: 1.4,
        proofUrl: "https://www.instagram.com/reel/C_summer_collection_linho"
      },
      {
        influencerId: influencerProfile.id,
        title: "Postar Story Espontâneo",
        description: "Fazer stories mostrando bastidores da rotina sem intenção de venda.",
        scheduledDate: day2,
        fromAI: true,
        isDone: true,
        performanceMultiplier: 1.2,
        proofUrl: "https://www.instagram.com/p/C_story_espontaneo_bastidores"
      },
      {
        influencerId: influencerProfile.id,
        title: "Reunião de Co-working com Marca Premium",
        description: "Alinhar diretrizes do briefing da campanha Summer Collection.",
        scheduledDate: day3,
        fromAI: false,
        isDone: false
      }
    ]
  });
  console.log('✅ Tarefas do calendário inicializadas!');

  // ── 9. Chamados de Suporte Simulados (Para a Central de Ajuda) ──────────────────
  console.log('🌱 [SEED] Gerando chamados de suporte do Assistente...');
  await prisma.supportTicket.deleteMany({ where: { userId: influencerUser.id } });
  await prisma.supportTicket.createMany({
    data: [
      {
        userId: influencerUser.id,
        subject: "Erro ao sincronizar métricas do Instagram",
        message: "Tentei conectar minha conta comercial da Zara para a campanha mas deu erro 403 da Meta.",
        status: "OPEN",
        category: "BUG"
      },
      {
        userId: influencerUser.id,
        subject: "Sugestão: Integração direta com YouTube Shorts",
        message: "Seria incrível se a IA pudesse ler métricas de Shorts para gerar roteiros também.",
        status: "CLOSED",
        category: "FEATURE"
      }
    ]
  });
  console.log('✅ Chamados de suporte populados!');

  // ── 10. Resumo ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('🎯 SEED CONCLUÍDO — Logins para a apresentação:');
  console.log('─'.repeat(60));
  console.log(`📱 Influenciador : influencer@demo.influnext.com.br`);
  console.log(`🔑 Senha         : ${DEMO_PASSWORD}`);
  console.log(`💰 Saldo Wallet  : R$ 4.250,00 disponível\n`);
  console.log(`🏢 Empresa       : empresa@demo.influnext.com.br`);
  console.log(`🔑 Senha         : ${DEMO_PASSWORD}`);
  console.log('─'.repeat(60));

  console.log('ℹ️  Admin        : alexsandrojunior144@gmail.com (criado no boot do servidor)');
  console.log('─'.repeat(60) + '\n');

  await prisma.$disconnect();
}

if (require.main === module) {
  seedDemo().catch((e) => {
    console.error('❌ Erro no seed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
}
