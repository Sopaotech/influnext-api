import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

const isValidKey = secretKey && secretKey !== 'sk_test_sua_chave_secreta_stripe' && !secretKey.includes('**********');

if (!isValidKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY inválida ou de teste. Funcionalidades de pagamento rodarão em modo simulado.');
}

export const stripe = isValidKey 
  ? new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any,
      appInfo: {
        name: 'InfluNext Platform',
        version: '1.0.0',
      },
    })
  : null;
