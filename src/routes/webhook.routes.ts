import { Router } from 'express';
import { handlePagarmeWebhook } from '../controllers/webhook.controller';

const router = Router();

// Endpoint sem authMiddleware pois é chamado externamente pelo gateway
router.post('/pagarme', handlePagarmeWebhook);

export default router;
