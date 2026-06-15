import { Request, Response } from 'express';
import { UserRole } from '../types/roles';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { addNotificationJob } from '../queues/notification.queue';
import { BriefingService } from '../services/briefing.service';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const deliverableSchema = z.object({
  title: z.string().min(3, 'O título do entregável é obrigatório.'),
  type: z.string().min(1, 'O tipo do entregável é obrigatório.'),
  dueDate: z.string().min(1, 'A data do entregável é obrigatória.'),
  // deadline como alias para compatibilidade com o schema Prisma
  deadline: z.string().optional(),
});

const createContractSchema = z.object({
  influencerId: z.string().uuid('ID do influenciador inválido.'),
  title: z.string().min(1, 'O título é obrigatório.'),
  briefing: z.string().min(10, 'O briefing deve ter pelo menos 10 caracteres.').optional(),
  budget: z.coerce.number().positive('O budget deve ser um número positivo.'),
  deliverables: z.array(deliverableSchema).min(1, 'Pelo menos um entregável é obrigatório.'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_TAKE_RATE = 0.10; // 10% de comissão

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole !== UserRole.COMPANY) {
      res.status(403).json({ error: "Apenas empresas podem criar contratos." });
      return;
    }

    const company = await prisma.companyProfile.findUnique({ 
      where: { userId },
      include: { user: { select: { subscriptionTier: true, subscriptionStatus: true } } }
    });

    if (!company) {
      res.status(403).json({ error: "Perfil de empresa não encontrado." });
      return;
    }

    // Enforce 3 active contracts limit for Free brands
    const brandTier = company.user?.subscriptionTier || 'FREE';
    const brandStatus = company.user?.subscriptionStatus || 'INACTIVE';
    const isBrandFree = !(brandTier === 'ENTERPRISE' && brandStatus === 'ACTIVE');

    if (isBrandFree) {
      const activeContractsCount = await prisma.contract.count({
        where: {
          companyId: company.id,
          escrowStatus: { in: ['PENDING_PAYMENT', 'IN_PROGRESS', 'UNDER_REVIEW'] }
        }
      });

      if (activeContractsCount >= 3) {
        res.status(403).json({ 
          error: "limit_reached",
          message: "Você atingiu o limite máximo de 3 contratos ativos em andamento no plano gratuito. Para criar contratos ilimitados e ter taxa de intermediação de Escrow zerada (0%), faça o upgrade do seu perfil para o plano Agency! 🚀" 
        });
        return;
      }
    }

    const parsed = createContractSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { influencerId, title, budget, deliverables, briefing } = parsed.data;

    // ─── Geração de Roteiro IA (O Cérebro) ──────────────────────────────────
    let aiScript = null;
    if (briefing) {
      aiScript = await BriefingService.generateSmartScript(influencerId, briefing);
    }
    // ────────────────────────────────────────────────────────────────────────

    // Buscar o plano do influenciador contratado para definir a taxa dinâmica
    const influencerProfile = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
      include: { user: { select: { subscriptionTier: true } } }
    });

    if (!influencerProfile) {
      res.status(404).json({ error: "Perfil de influenciador não encontrado." });
      return;
    }

    const tier = influencerProfile.user?.subscriptionTier || 'FREE';
    let successFeeRate = 0.15;
    if (tier === 'PRO') {
      successFeeRate = 0.10;
    } else if (tier === 'MASTER') {
      successFeeRate = 0.05;
    } else if (tier === 'ENTERPRISE') {
      successFeeRate = 0.00;
    }

    // ─── Cálculo do Take Rate Dinâmico ──────────────────────────────────────
    const platformFee = budget * successFeeRate;
    const netAmount   = budget - platformFee;
    // ────────────────────────────────────────────────────────────────────────

    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          companyId: company.id,
          influencerId,
          title,
          briefing,
          aiScript,
          budget,
          platformFee,
          netAmount,
          successFeeRate,
          escrowStatus: 'DRAFT',
          deliverables: {
            create: deliverables.map((d) => ({
              title: d.title,
              type: d.type,
              deadline: new Date(d.dueDate || d.deadline || new Date()),
              status: 'PENDING'
            }))
          }
        },
        include: { deliverables: true }
      });

      const influencer = await tx.influencerProfile.findUnique({ where: { id: influencerId } });
      if (influencer) {
        await tx.notification.create({
          data: {
            userId: influencer.userId,
            message: `Nova proposta de contrato: "${title}" (Valor Líquido: $${netAmount.toFixed(2)})`,
            type: 'CONTRACT_OFFER'
          }
        });
      }

      return { contract, influencerUserId: influencer?.userId };
    });

    if (result.influencerUserId) {
      await addNotificationJob(
        result.influencerUserId,
        `Nova proposta de contrato: "${title}" (Valor líquido para você: $${netAmount.toFixed(2)})`,
        'CONTRACT_OFFER'
      );
    }

    res.status(201).json(result.contract);
  } catch (error) {
    console.error('[CONTRACT] Erro na transação do contrato:', error);
    res.status(500).json({ error: "Erro ao criar contrato." });
  }
};

// ─── Confirmação Manual de Pagamento (Mock Escrow) ────────────────────────────

export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId   = req.user!.id;
    const userRole = req.user!.role;
    const { id }   = req.params;

    // Apenas ADMIN ou a COMPANY dona do contrato podem confirmar
    if (userRole === UserRole.INFLUENCER) {
      res.status(403).json({ error: "Influenciadores não podem confirmar pagamentos." });
      return;
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { company: true, influencer: true }
    });

    if (!contract) {
      res.status(404).json({ error: "Contrato não encontrado." });
      return;
    }

    // Garantir que apenas o ADMIN ou a própria Company dona confirme
    if (userRole === UserRole.COMPANY) {
      const company = await prisma.companyProfile.findUnique({ where: { userId } });
      if (!company || company.id !== contract.companyId) {
        res.status(403).json({ error: "Você não é o dono deste contrato." });
        return;
      }
    }

    if (contract.escrowStatus !== 'DRAFT') {
      res.status(409).json({ error: `Contrato já está no status: ${contract.escrowStatus}. Apenas contratos DRAFT podem ser ativados.` });
      return;
    }

    // Atualiza status via transação atômica
    const updated = await prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id },
        data: { escrowStatus: 'IN_PROGRESS' }
      });

      await tx.notification.create({
        data: {
          userId: contract.influencer.userId,
          message: `✅ Depósito em Escrow confirmado para o contrato: "${contract.title}". Pode iniciar a produção!`,
          type: 'ESCROW_CONFIRMED'
        }
      });

      return updatedContract;
    });

    // Dispara job de notificação assíncrono
    await addNotificationJob(
      contract.influencer.userId,
      `💰 Seu pagamento foi confirmado! Pode iniciar a produção de: "${contract.title}". Valor líquido: $${Number(contract.netAmount).toFixed(2)}`,
      'ESCROW_CONFIRMED'
    );

    res.json({ 
      message: "Escrow confirmado. Influenciador notificado para iniciar a produção.",
      contract: updated 
    });
  } catch (error) {
    console.error('[CONTRACT] Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: "Erro ao confirmar o pagamento." });
  }
};

export const releasePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      res.status(400).json({ error: "Idempotency-Key é obrigatória." });
      return;
    }

    if (userRole !== UserRole.COMPANY && userRole !== UserRole.ADMIN) {
      res.status(403).json({ error: "Apenas empresas ou admins podem liberar pagamentos." });
      return;
    }

    const contract = await prisma.contract.findUnique({ where: { id } });

    if (!contract) {
      res.status(404).json({ error: "Contrato não encontrado." });
      return;
    }

    if (userRole === UserRole.COMPANY) {
      const company = await prisma.companyProfile.findUnique({ where: { userId } });
      if (!company || company.id !== contract.companyId) {
        res.status(403).json({ error: "Você não tem permissão para liberar pagamentos deste contrato." });
        return;
      }
    }

    if (contract.escrowStatus !== 'UNDER_REVIEW' && contract.escrowStatus !== 'IN_PROGRESS') {
      res.status(400).json({ error: "Contrato não está pronto para liberação." });
      return;
    }

    if (contract.releaseTxId === idempotencyKey || contract.idempotencyKey === idempotencyKey) {
      res.status(409).json({ error: "Pagamento já foi liberado ou processado com esta chave." });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.updateMany({
        where: { id, releaseTxId: null },
        data: {
          escrowStatus: 'COMPLETED',
          releaseTxId: idempotencyKey,
          idempotencyKey
        }
      });

      if (updatedContract.count === 0) {
        throw new Error("Conflito: Transação já processada ou estado inválido.");
      }

      return tx.contract.findUnique({ where: { id } });
    });

    res.json({ message: "Pagamento liberado com sucesso.", contract: updated });
  } catch (error: any) {
    console.error('[CONTRACT] Erro ao liberar pagamento:', error);
    if (error.message.includes('Conflito')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erro ao liberar o pagamento." });
    }
  }
};

export const getMyContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let contracts;

    if (userRole === UserRole.INFLUENCER) {
      const profile = await prisma.influencerProfile.findUnique({ where: { userId } });
      if (!profile) {
        res.status(404).json({ error: "Perfil não encontrado." });
        return;
      }
      contracts = await prisma.contract.findMany({
        where: { influencerId: profile.id },
        include: { company: true, deliverables: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === UserRole.COMPANY) {
      const profile = await prisma.companyProfile.findUnique({ where: { userId } });
      if (!profile) {
        res.status(404).json({ error: "Perfil não encontrado." });
        return;
      }
      contracts = await prisma.contract.findMany({
        where: { companyId: profile.id },
        include: { influencer: true, deliverables: true },
        orderBy: { createdAt: 'desc' }
      });
    } else if (userRole === UserRole.ADMIN) {
      contracts = await prisma.contract.findMany({
        include: { influencer: true, company: true, deliverables: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(contracts);
  } catch (error) {
    console.error('[CONTRACT] Erro ao buscar contratos:', error);
    res.status(500).json({ error: "Erro ao buscar contratos." });
  }
};

export const getContractById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        influencer: true,
        company: true,
        deliverables: true
      }
    });

    if (!contract) {
      res.status(404).json({ error: "Contrato não encontrado." });
      return;
    }

    // Validação de permissão de visualização
    if (userRole === UserRole.COMPANY) {
      const company = await prisma.companyProfile.findUnique({ where: { userId } });
      if (!company || contract.companyId !== company.id) {
        res.status(403).json({ error: "Você não tem permissão para visualizar este contrato." });
        return;
      }
    } else if (userRole === UserRole.INFLUENCER) {
      const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
      if (!influencer || contract.influencerId !== influencer.id) {
        res.status(403).json({ error: "Você não tem permissão para visualizar este contrato." });
        return;
      }
    }

    res.json(contract);
  } catch (error) {
    console.error('[CONTRACT] Erro ao buscar contrato por ID:', error);
    res.status(500).json({ error: "Erro ao buscar contrato." });
  }
};

export const updateContractScript = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { aiScript } = req.body;

    if (!aiScript) {
      res.status(400).json({ error: "O roteiro ou opinião não pode estar vazio." });
      return;
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { influencer: true, company: true }
    });

    if (!contract) {
      res.status(404).json({ error: "Contrato não encontrado." });
      return;
    }

    let hasAccess = false;
    if (userRole === UserRole.INFLUENCER) {
      const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
      if (influencer && contract.influencerId === influencer.id) {
        hasAccess = true;
      }
    } else if (userRole === UserRole.COMPANY) {
      const company = await prisma.companyProfile.findUnique({ where: { userId } });
      if (company && contract.companyId === company.id) {
        hasAccess = true;
      }
    } else if (userRole === UserRole.ADMIN) {
      hasAccess = true;
    }

    if (!hasAccess) {
      res.status(403).json({ error: "Você não tem permissão para alterar este contrato." });
      return;
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: { aiScript }
    });

    res.json({
      message: "Roteiro/Opinião atualizado com sucesso!",
      contract: updated
    });
  } catch (error) {
    console.error('[CONTRACT] Erro ao atualizar roteiro:', error);
    res.status(500).json({ error: "Erro ao atualizar roteiro." });
  }
};

export const cancelAndRefundContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    // Apenas ADMIN ou a COMPANY dona do contrato podem cancelar
    if (userRole !== UserRole.COMPANY && userRole !== UserRole.ADMIN) {
      res.status(403).json({ error: "Apenas empresas ou admins podem cancelar contratos." });
      return;
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { company: true, influencer: { include: { user: true } } }
    });

    if (!contract) {
      res.status(404).json({ error: "Contrato não encontrado." });
      return;
    }

    if (userRole === UserRole.COMPANY) {
      const company = await prisma.companyProfile.findUnique({ where: { userId } });
      if (!company || company.id !== contract.companyId) {
        res.status(403).json({ error: "Você não tem permissão para cancelar este contrato." });
        return;
      }
    }

    // Apenas contratos PENDING_PAYMENT ou IN_PROGRESS ou DRAFT podem ser cancelados
    if (contract.escrowStatus !== 'PENDING_PAYMENT' && contract.escrowStatus !== 'IN_PROGRESS' && contract.escrowStatus !== 'DRAFT') {
      res.status(400).json({ error: `Contrato no status ${contract.escrowStatus} não pode ser cancelado.` });
      return;
    }

    const previousStatus = contract.escrowStatus;

    // Se o status for IN_PROGRESS, significa que o pagamento já foi capturado (está em Escrow)
    if (previousStatus === 'IN_PROGRESS' && contract.externalTxId) {
      const { stripe } = await import('../lib/stripe');
      if (!stripe) {
        res.status(500).json({ error: "Serviço de pagamentos da Stripe não está configurado." });
        return;
      }

      try {
        let paymentIntentId = contract.externalTxId;
        if (paymentIntentId.startsWith('cs_')) {
          const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
          if (session.payment_intent) {
            paymentIntentId = typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent.id;
          } else {
            throw new Error("Não foi possível encontrar a transação de pagamento associada a esta sessão.");
          }
        }

        // Recuperar o PaymentIntent para saber o valor exato pago (garantindo tratar 5% do plano gratuito vs 0% do Agency)
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const amountPaidInCents = paymentIntent.amount;
        const refundAmountInCents = Math.round(amountPaidInCents * 0.96);
        const refundAmount = refundAmountInCents / 100;
        const stripeFee = (amountPaidInCents - refundAmountInCents) / 100;

        // Criar estorno na Stripe
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: refundAmountInCents,
        });
        console.log(`[STRIPE] ✅ Estorno de R$ ${refundAmount.toFixed(2)} processado para o contrato ${id}. Taxa retida: R$ ${stripeFee.toFixed(2)}`);
      } catch (stripeErr: any) {
        console.error('[STRIPE REFUND ERROR]:', stripeErr);
        res.status(500).json({ error: `Erro ao processar estorno na Stripe: ${stripeErr.message || stripeErr}` });
        return;
      }
    }

    // Atualiza o status do contrato para CANCELED
    const updated = await prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: { id },
        data: { escrowStatus: 'CANCELED' }
      });

      // Notificar o influenciador
      await tx.notification.create({
        data: {
          userId: contract.influencer.userId,
          message: `⚠️ O contrato "${contract.title}" foi cancelado pela marca parceira e o reembolso foi solicitado.`,
          type: 'CONTRACT_CANCELED'
        }
      });

      return updatedContract;
    });

    // Enviar notificação assíncrona
    await addNotificationJob(
      contract.influencer.userId,
      `⚠️ O contrato "${contract.title}" foi cancelado pela marca parceira.`,
      'CONTRACT_CANCELED'
    );

    res.json({
      message: "Contrato cancelado com sucesso. O reembolso foi processado para a marca deduzindo as taxas do Stripe.",
      contract: updated
    });
  } catch (error) {
    console.error('[CONTRACT CANCEL] Erro ao cancelar contrato:', error);
    res.status(500).json({ error: "Erro ao cancelar o contrato." });
  }
};
