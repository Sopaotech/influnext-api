import { prisma } from './prisma';
import bcrypt from 'bcrypt';

/**
 * Função para garantir que o administrador principal tenha acesso.
 * Chamada durante a inicialização do servidor.
 */
export async function ensureAdminExists() {
  const adminEmail = 'alexsandrojunior144@gmail.com';
  const adminPassword = 'Juninho1440@';

  try {
    console.log(`[ADMIN-INIT] Verificando acesso para: ${adminEmail}`);

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: 'ADMIN',
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE',
      },
      create: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE',
      },
    });

    console.log(`[ADMIN-INIT] ✅ Administrador pronto: ${user.email} (ID: ${user.id})`);

    // ─────────────────────────────────────────────────────────────────────────
    // INICIALIZAÇÃO DE USUÁRIOS DEMO (Para apresentação de investidores)
    // ─────────────────────────────────────────────────────────────────────────
    const demoPassword = 'Demo@2026!';
    const demoHash = await bcrypt.hash(demoPassword, 12);

    // 1. Influenciador Demo
    const influencerUser = await prisma.user.upsert({
      where: { email: 'influencer@demo.influnext.com.br' },
      update: { passwordHash: demoHash, role: 'INFLUENCER', onboardingCompleted: true, subscriptionStatus: 'ACTIVE' },
      create: {
        email: 'influencer@demo.influnext.com.br',
        passwordHash: demoHash,
        role: 'INFLUENCER',
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE',
      }
    });

    // Garantir que não haja outro perfil com o mesmo handle (único) antes de upsertar
    const duplicateProfile = await prisma.influencerProfile.findFirst({
      where: {
        handle: 'demo.influencer',
        userId: { not: influencerUser.id }
      }
    });

    if (duplicateProfile) {
      await prisma.socialPlatform.deleteMany({ where: { influencerId: duplicateProfile.id } });
      await prisma.task.deleteMany({ where: { influencerId: duplicateProfile.id } });
      await prisma.metricSnapshot.deleteMany({ where: { influencerId: duplicateProfile.id } });
      await prisma.trendReference.deleteMany({ where: { influencerId: duplicateProfile.id } });
      await prisma.aIAnalysis.deleteMany({ where: { influencerId: duplicateProfile.id } });
      await prisma.rateCard.deleteMany({ where: { influencerId: duplicateProfile.id } });

      const duplicateContracts = await prisma.contract.findMany({
        where: { influencerId: duplicateProfile.id }
      });
      const contractIds = duplicateContracts.map(c => c.id);
      if (contractIds.length > 0) {
        await prisma.deliverable.deleteMany({
          where: { contractId: { in: contractIds } }
        });
        await prisma.contract.deleteMany({
          where: { id: { in: contractIds } }
        });
      }

      await prisma.influencerProfile.delete({
        where: { id: duplicateProfile.id }
      });
    }

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

    // 2. Empresa Demo
    const companyUser = await prisma.user.upsert({
      where: { email: 'empresa@demo.influnext.com.br' },
      update: { passwordHash: demoHash, role: 'COMPANY', onboardingCompleted: true, subscriptionStatus: 'ACTIVE' },
      create: {
        email: 'empresa@demo.influnext.com.br',
        passwordHash: demoHash,
        role: 'COMPANY',
        onboardingCompleted: true,
        subscriptionStatus: 'ACTIVE',
      }
    });

    // Garantir que não haja outro perfil com o mesmo taxId (único) antes de upsertar
    const duplicateCompany = await prisma.companyProfile.findFirst({
      where: {
        taxId: '00.000.000/0001-91',
        userId: { not: companyUser.id }
      }
    });

    if (duplicateCompany) {
      await prisma.rateCard.deleteMany({ where: { companyId: duplicateCompany.id } });

      const duplicateContracts = await prisma.contract.findMany({
        where: { companyId: duplicateCompany.id }
      });
      const contractIds = duplicateContracts.map(c => c.id);
      if (contractIds.length > 0) {
        await prisma.deliverable.deleteMany({
          where: { contractId: { in: contractIds } }
        });
        await prisma.contract.deleteMany({
          where: { id: { in: contractIds } }
        });
      }

      await prisma.companyProfile.delete({
        where: { id: duplicateCompany.id }
      });
    }

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

    // 3. Contrato Demo (COMPLETED) — gera saldo na Wallet de R$ 4.250
    const existingContract = await prisma.contract.findFirst({
      where: {
        influencerId: influencerProfile.id,
        companyId: companyProfile.id,
        escrowStatus: 'COMPLETED'
      }
    });

    if (!existingContract) {
      await prisma.contract.create({
        data: {
          influencerId: influencerProfile.id,
          companyId: companyProfile.id,
          title: 'Campanha Summer Collection 2026',
          briefing: 'Criação de 3 Reels + 5 Stories promovendo a coleção de verão. Foco em engajamento e vendas.',
          budget: 5000,
          platformFee: 750,
          netAmount: 4250,
          escrowStatus: 'COMPLETED',
          deliverables: {
            create: [
              { type: 'REELS', deadline: new Date('2026-04-15'), status: 'APPROVED', proofUrl: 'https://instagram.com' },
              { type: 'STORIES', deadline: new Date('2026-04-20'), status: 'APPROVED', proofUrl: 'https://instagram.com' },
            ]
          }
        }
      });
      console.log(`[ADMIN-INIT] ✅ Contrato Demo criado para Wallet (Saldo R$ 4.250)`);
    }

    console.log(`[ADMIN-INIT] ✅ Usuários Demo prontos: influencer@demo / empresa@demo`);

  } catch (error) {
    console.error('[ADMIN-INIT] ❌ Erro ao configurar contas iniciais:', error);
  }
}
