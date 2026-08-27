import { Router } from 'express';
import { handlePagarmeWebhook, handleMercadoPagoWebhook } from '../controllers/webhook.controller';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

// Endpoints públicos de webhooks chamados externamente pelos gateways
router.post('/mercadopago', handleMercadoPagoWebhook);
router.post('/pagarme', handlePagarmeWebhook);
router.post('/stripe', PaymentController.webhook);

export default router;


