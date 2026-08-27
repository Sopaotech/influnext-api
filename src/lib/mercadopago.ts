import { MercadoPagoConfig, Payment, Preference, PreApproval } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

if (!accessToken) {
  console.warn('[MERCADO PAGO] ⚠️ MERCADOPAGO_ACCESS_TOKEN não está definido nas variáveis de ambiente.');
}

export const mpClient = new MercadoPagoConfig({
  accessToken: accessToken,
  options: {
    timeout: 10000,
  }
});

export const mpPayment = new Payment(mpClient);
export const mpPreference = new Preference(mpClient);
export const mpPreApproval = new PreApproval(mpClient);
