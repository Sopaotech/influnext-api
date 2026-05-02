import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Rota protegida para criar a intenção de pagamento
router.post('/create-order', authMiddleware, PaymentController.createOrder);

// Rota pública para receber o webhook do Pagar.me
router.post('/webhook', PaymentController.webhook);

export default router;
