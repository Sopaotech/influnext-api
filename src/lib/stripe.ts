import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY não configurada. Funcionalidades de pagamento estarão indisponíveis.');
}

export const stripe = secretKey 
  ? new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any,
      appInfo: {
        name: 'InfluNext Platform',
        version: '1.0.0',
      },
    })
  : null;
