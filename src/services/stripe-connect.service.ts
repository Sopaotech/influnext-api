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

  /**
   * Transfere fundos do saldo principal da plataforma para a conta conectada do influenciador.
   * Utilizado no momento da liberação do Escrow.
   * 
   * @param accountId ID da conta Stripe Connect do influenciador
   * @param amount Em Reais (será convertido para centavos)
   * @param description Descrição que aparecerá no extrato do influenciador
   * @param sourceTransaction (Opcional) ID do PaymentIntent original para amarrar a transferência
   */
  static async transferToConnectedAccount(accountId: string, amount: number, description: string, sourceTransaction?: string) {
    if (!stripe) {
      console.warn(`[STRIPE CONNECT] MODO SIMULADO: Transferência de R$ ${amount} para a conta ${accountId} simulada com sucesso.`);
      return { id: `simulated_transfer_${Date.now()}` };
    }

    try {
      const amountInCents = Math.round(amount * 100);
      
      const transferParams: any = {
        amount: amountInCents,
        currency: 'brl',
        destination: accountId,
        description: description,
      };

      if (sourceTransaction && sourceTransaction.startsWith('pi_')) {
        transferParams.source_transaction = sourceTransaction;
      }

      const transfer = await stripe.transfers.create(transferParams);
      
      console.log(`[STRIPE CONNECT] ✅ Transferência de R$ ${amount.toFixed(2)} enviada para a conta ${accountId} (Transfer ID: ${transfer.id})`);
      return transfer;
    } catch (error: any) {
      console.error(`[STRIPE CONNECT] ❌ Erro ao transferir fundos para ${accountId}:`, error);
      throw new Error(`Erro ao liberar pagamento via Stripe: ${error.message}`);
    }
  }
}
