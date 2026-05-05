import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import Stripe from 'stripe';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export class PaymentController {
  /**
   * POST /v1/payments/create-checkout-session
   * Cria uma sessão de checkout para assinatura do plano PRO
   */
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { planId } = req.body;

      if (!planId) return res.status(400).json({ error: 'planId é obrigatório' });

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.externalId) {
        return res.status(404).json({ error: 'Plano não encontrado ou sem ID da Stripe' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

      // Garante que o usuário tem um Customer ID na Stripe
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id }
        });
        stripeCustomerId = customer.id;
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId }
        });
      }

      // Cria a sessão de checkout
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.externalId, // O externalId deve ser o Price ID da Stripe
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/subscription`,
        metadata: {
          userId: user.id,
          planId: plan.id
        }
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error('[STRIPE] Erro ao criar checkout session:', error);
      return res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
  }

  /**
   * POST /v1/payments/create-contract-checkout
   * Cria uma sessão de checkout para pagamento de contrato (Escrow)
   */
  static async createContractCheckoutSession(req: Request, res: Response) {
    try {
      const { contractId } = req.body;

      if (!contractId) return res.status(400).json({ error: 'contractId é obrigatório' });

      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { company: { include: { user: true } } }
      });

      if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

      // Valor em centavos
      const amount = Math.round(contract.budget * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'pix'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: `Contrato: ${contract.title}`,
                description: `Pagamento em Escrow para InfluNext`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${contractId}?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/contracts/${contractId}/pay`,
        metadata: {
          contractId: contract.id,
          type: 'contract_escrow'
        }
      });

      // Atualizar contrato com o ID da sessão
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          externalTxId: session.id,
          escrowStatus: 'PENDING_PAYMENT'
        }
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error('[STRIPE] Erro ao criar contract checkout session:', error);
      return res.status(500).json({ error: 'Erro ao gerar pagamento' });
    }
  }

  /**
   * POST /v1/payments/create-payment-intent
   * Cria um PaymentIntent para contratos (Escrow)
   */
  static async createPaymentIntent(req: Request, res: Response) {
    try {
      const { contractId } = req.body;

      if (!contractId) return res.status(400).json({ error: 'contractId é obrigatório' });

      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { company: { include: { user: true } } }
      });

      if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

      // Valor em centavos
      const amount = Math.round(contract.budget * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
        payment_method_types: ['card', 'pix'],
        metadata: {
          contractId: contract.id,
          type: 'contract_escrow'
        },
        description: `Pagamento de Escrow: ${contract.title}`
      });

      // Atualizar contrato com o ID da transação externa
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          externalTxId: paymentIntent.id,
          escrowStatus: 'PENDING_PAYMENT'
        }
      });

      return res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      });
    } catch (error) {
      console.error('[STRIPE] Erro ao criar PaymentIntent:', error);
      return res.status(500).json({ error: 'Erro ao gerar pagamento' });
    }
  }

  /**
   * POST /v1/payments/webhook
   * Handler de eventos da Stripe
   */
  static async webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      // É necessário o raw body para validar a assinatura
      // No Express, isso geralmente requer um middleware específico (express.raw)
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error(`[STRIPE WEBHOOK] ❌ Erro de assinatura: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      console.log(`[STRIPE WEBHOOK] Evento recebido: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === 'subscription') {
            const userId = session.metadata?.userId;
            const planId = session.metadata?.planId;
            const externalSubscriptionId = session.subscription as string;

            if (userId && planId) {
              await prisma.subscription.create({
                data: {
                  userId,
                  planId,
                  externalId: externalSubscriptionId,
                  status: 'active',
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Aproximado, o ideal é ler do subscription.updated
                }
              });

              await prisma.user.update({
                where: { id: userId },
                data: { subscriptionStatus: 'ACTIVE' }
              });
              console.log(`[STRIPE] ✅ Assinatura ativada para usuário ${userId}`);
            }
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const intent = event.data.object as Stripe.PaymentIntent;
          const contractId = intent.metadata.contractId;

          if (contractId) {
            await prisma.contract.update({
              where: { id: contractId },
              data: { escrowStatus: 'IN_PROGRESS' }
            });
            console.log(`[STRIPE] ✅ Contrato ${contractId} pago. Escrow IN_PROGRESS.`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const dbSub = await prisma.subscription.findUnique({
            where: { externalId: subscription.id }
          });

          if (dbSub) {
            await prisma.user.update({
              where: { id: dbSub.userId },
              data: { subscriptionStatus: 'INACTIVE' }
            });
            await prisma.subscription.update({
              where: { id: dbSub.id },
              data: { status: 'canceled' }
            });
            console.log(`[STRIPE] ⚠️ Assinatura ${subscription.id} cancelada.`);
          }
          break;
        }

        // Adicionar outros casos conforme necessário (past_due, invoice.paid, etc)
      }

      return res.json({ received: true });
    } catch (error) {
      console.error('[STRIPE WEBHOOK] Erro ao processar evento:', error);
      return res.status(500).json({ error: 'Erro interno no webhook' });
    }
  }
}
