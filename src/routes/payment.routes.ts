import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Rota protegida para criar a intenção de pagamento
router.post('/create-order', authenticate, PaymentController.createOrder);

// Rota pública para receber o webhook do Pagar.me
router.post('/webhook', PaymentController.webhook);

export default router;
