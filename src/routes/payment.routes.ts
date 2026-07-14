import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Rota protegida para criar a sessão de checkout de contrato (Escrow)
router.post('/create-order', authenticate, PaymentController.createContractCheckoutSession);

// Rota protegida para criar sessão de checkout de mensalidade (Assinaturas)
router.post('/create-subscription', authenticate, PaymentController.createCheckoutSession);

// Rotas protegidas para onboarding e status do Stripe Connect
router.post('/connect/onboard', authenticate, PaymentController.onboardConnectAccount);
router.get('/connect/status', authenticate, PaymentController.getConnectAccountStatus);

// Rota pública para receber o webhook da Stripe
router.post('/webhook', PaymentController.webhook);

export default router;
