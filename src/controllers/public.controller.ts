import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import { calcContractFees } from '../lib/fees';
import crypto from 'crypto';

const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://influnext.com.br';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { handle } = req.params;

    // A restrição `select` age como barreira contra Sensitive Data Exposure
    const profile = await prisma.influencerProfile.findUnique({
      where: { handle },
      select: {
        id: true,
        handle: true,
        profileImageUrl: true,
        influScore: true,
        scoreClass: true,
        verifiedMetrics: true,
        niche: true,
        // Hiper-Localismo: exibido no perfil público
        city: true,
        state: true,
        bio: true,
        // Tabela de preços (Rate Cards)
        rateCards: {
          select: {
            id: true,
            serviceName: true,
            price: true,
            description: true
          }
        },
        // Buscamos apenas o último snapshot de métricas auditadas
        metricsHistory: {
          take: 1,
          orderBy: { capturedAt: 'desc' },
          select: {
            followers: true,
            engagementRate: true,
            reachLast30Days: true,
            avgViews: true,
            capturedAt: true,
            integrityHash: true
          }
        },
        // Buscamos as redes conectadas para mostrar os ícones, sem vazar AccessTokens
        platforms: {
          select: { platformName: true, platformId: true }
        },
        // Buscamos as provas de ROI (Tasks da IA concluídas com performance medida)
        tasks: {
          where: {
            fromAI: true,
            isDone: true,
            performanceMultiplier: { not: null }
          },
          orderBy: { scheduledDate: 'desc' },
          take: 5,
          select: {
            title: true,
            proofUrl: true,
            performanceMultiplier: true
          }
        }
      }
    });

    if (!profile) {
      res.status(404).json({ error: "Influenciador não encontrado ou perfil privado." });
      return;
    }

    // Calcula a média de ROI
    const avgROI = profile.tasks.length > 0
      ? profile.tasks.reduce((acc, t) => acc + (t.performanceMultiplier || 1), 0) / profile.tasks.length
      : 1.0;

    res.status(200).json({
      ...profile,
      avgROI: Number(avgROI.toFixed(2))
    });
  } catch (error) {
    console.error('[PUBLIC] Erro ao carregar Media Kit:', error);
    res.status(500).json({ error: "Erro ao carregar Media Kit." });
  }
};

/**
 * POST /v1/p/instant-checkout
 * Permite contratação direta via checkout instantâneo no Mídia Kit Público
 */
export const createInstantCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { handle, rateCardId, brandEmail, brandName, campaignTitle, briefing } = req.body;

    if (!handle || !brandEmail || !campaignTitle) {
      res.status(400).json({ error: "Parâmetros obrigatórios: handle, brandEmail, campaignTitle." });
      return;
    }

    const influencer = await prisma.influencerProfile.findUnique({
      where: { handle },
      include: { 
        rateCards: true,
        user: { select: { subscriptionTier: true } }
      }
    });

    if (!influencer) {
      res.status(404).json({ error: "Influenciador não encontrado." });
      return;
    }

    let serviceName = "Campanha Personalizada";
    let budget = 500; // Valor base padrão caso não venha rateCardId

    if (rateCardId) {
      const rateCard = influencer.rateCards.find(rc => rc.id === rateCardId);
      if (rateCard) {
        serviceName = rateCard.serviceName;
        budget = rateCard.price;
      }
    }

    // Localizar ou criar User + CompanyProfile para a marca contratante
    let brandUser = await prisma.user.findUnique({
      where: { email: brandEmail }
    });

    if (!brandUser) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      brandUser = await prisma.user.create({
        data: {
          email: brandEmail,
          passwordHash: randomPassword,
          role: 'COMPANY',
          onboardingCompleted: true,
          company: {
            create: {
              companyName: brandName || brandEmail.split('@')[0],
              taxId: `GUEST-${Date.now()}`
            }
          }
        }
      });
    }

    let companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: brandUser.id }
    });

    if (!companyProfile) {
      companyProfile = await prisma.companyProfile.create({
        data: {
          userId: brandUser.id,
          companyName: brandName || brandEmail.split('@')[0],
          taxId: `GUEST-${Date.now()}`
        }
      });
    }

    // Taxa baseada no tier do influenciador (FREE=15%, Premium=7%)
    const creatorTier = (influencer as any).user?.subscriptionTier || 'FREE';
    const { successFeeRate: ESCROW_FEE_RATE, platformFee, netAmount, totalChargedToCompany } = calcContractFees(budget, creatorTier);

    const contract = await prisma.contract.create({
      data: {
        companyId: companyProfile.id,
        influencerId: influencer.id,
        title: campaignTitle || `Contratação Direta: ${serviceName}`,
        briefing: briefing || `Contratação direta via Mídia Kit Público por ${brandName || brandEmail}`,
        budget,
        platformFee,
        netAmount,
        successFeeRate: ESCROW_FEE_RATE,
        escrowStatus: 'PENDING_PAYMENT',
        contractType: 'SPOT',
        companySigned: true,
        companyIp: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip || '127.0.0.1',
        deliverables: {
          create: [{
            type: serviceName,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
            status: 'PENDING'
          }]
        }
      }
    });

    // Notificar o influenciador sobre a nova proposta recebida no mídia kit público
    await prisma.notification.create({
      data: {
        userId: influencer.userId,
        message: `🎯 Nova contratação direta pelo Mídia Kit Público: "${campaignTitle}" de ${brandName || brandEmail} (R$ ${budget.toFixed(2)}).`,
        type: 'CONTRACT_OFFER'
      }
    });

    // Se o serviço da Stripe não estiver ativo, fallback gracioso
    if (!stripe) {
      res.status(200).json({
        contractId: contract.id,
        checkoutUrl: `${getFrontendUrl()}/p/${handle}?checkout=simulated&contractId=${contract.id}`
      });
      return;
    }

    const amountInCents = Math.round(totalChargedToCompany * 100);

    const session = await stripe.checkout.sessions.create({
      customer_email: brandEmail,
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Contrato Direto: ${serviceName} (@${influencer.handle})`,
              description: `Garantia de Entrega Escrow Influnext (${campaignTitle}) - Taxa ${Math.round(ESCROW_FEE_RATE * 100)}%`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${getFrontendUrl()}/p/${handle}?checkout=success&contractId=${contract.id}`,
      cancel_url: `${getFrontendUrl()}/p/${handle}?checkout=canceled`,
      metadata: {
        contractId: contract.id,
        type: 'contract_escrow'
      }
    });

    await prisma.contract.update({
      where: { id: contract.id },
      data: { externalTxId: session.id }
    });

    res.status(200).json({
      contractId: contract.id,
      checkoutUrl: session.url
    });

  } catch (error: any) {
    console.error('[INSTANT CHECKOUT] Erro ao processar:', error);
    res.status(500).json({ error: error.message || "Erro ao processar contratação instantânea." });
  }
};

