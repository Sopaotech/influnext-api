import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// ─── Mercado Pago (PIX Dinâmico, Cartão e Assinaturas) ───────────────────────
router.post('/mercadopago/pix', authenticate, PaymentController.createMercadoPagoPix);
router.post('/mercadopago/preference', authenticate, PaymentController.createMercadoPagoPreference);
router.post('/mercadopago/subscription', authenticate, PaymentController.createMercadoPagoSubscription);
router.get('/mercadopago/status/:paymentId', authenticate, PaymentController.checkMercadoPagoStatus);
router.patch('/pix-key', authenticate, PaymentController.updatePixKey);

// ─── Stripe (Legado / Backup) ───────────────────────────────────────────────
router.post('/create-order', authenticate, PaymentController.createContractCheckoutSession);
router.post('/create-subscription', authenticate, PaymentController.createCheckoutSession);
router.post('/connect/onboard', authenticate, PaymentController.onboardConnectAccount);
router.get('/connect/status', authenticate, PaymentController.getConnectAccountStatus);
router.post('/webhook', PaymentController.webhook);

export default router;

