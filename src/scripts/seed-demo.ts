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

async function seedDemo() {
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
    update: {},
    create: {
      userId: companyUser.id,
      companyName: 'Marca Premium Ltda',
      taxId: '00.000.000/0001-91',
      city: 'São Paulo',
      state: 'SP',
      segment: 'Fashion',
      employeeCount: '51-200',
      campaignBudget: 'R$ 50k - R$ 200k',
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

  // ── 4. Resumo ──────────────────────────────────────────────────────────────
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

seedDemo().catch((e) => {
  console.error('❌ Erro no seed:', e);
  prisma.$disconnect();
  process.exit(1);
});
