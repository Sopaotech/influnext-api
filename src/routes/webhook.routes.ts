import { Router } from 'express';
import { handlePagarmeWebhook } from '../controllers/webhook.controller';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

// Endpoints públicos de webhooks chamados externamente pelos gateways
router.post('/pagarme', handlePagarmeWebhook);
router.post('/stripe', PaymentController.webhook);

export default router;

