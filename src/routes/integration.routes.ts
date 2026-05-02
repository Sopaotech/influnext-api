import { Router } from 'express';
import { connectInstagram } from '../controllers/integration.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Só entra aqui quem tem o Token (o crachá que você pegou no Login)
router.post('/instagram', authenticate, connectInstagram);

export default router;