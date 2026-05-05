import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY não configurada. Pagamentos desativados.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
  appInfo: {
    name: 'InfluNext Platform',
    version: '1.0.0',
  },
});
