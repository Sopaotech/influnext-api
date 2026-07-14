import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';

export class StripeConnectService {
  /**
   * Cria uma conta Stripe Express para o usuário (influenciador) e gera o link de onboarding.
   */
  static async createExpressAccount(userId: string, email: string, redirectUrl: string) {
    if (!stripe) {
      throw new Error('Serviço de pagamentos da Stripe não configurado.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    let accountId = user.stripeConnectAccountId;

    // Se o usuário ainda não possui conta Stripe Connect, criamos uma Express
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'BR',
        email: email,
        capabilities: {
          transfers: { requested: true }
        },
        business_type: 'individual',
        metadata: { userId }
      });

      accountId = account.id;

      await prisma.user.update({
        where: { id: userId },
        data: { stripeConnectAccountId: accountId }
      });
    }

    // Criar o link da conta para onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${redirectUrl}?connect=refresh`,
      return_url: `${redirectUrl}?connect=success`,
      type: 'account_onboarding'
    });

    return {
      accountId,
      url: accountLink.url
    };
  }

  /**
   * Recupera o status atual da conta Express conectada.
   */
  static async getAccountStatus(accountId: string) {
    if (!stripe) {
      throw new Error('Serviço de pagamentos da Stripe não configurado.');
    }

    const account = await stripe.accounts.retrieve(accountId);

    return {
      id: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements
    };
  }
}
