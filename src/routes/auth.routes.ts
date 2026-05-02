import { Router } from 'express';
import { signup, login, verify2FA, setup2FA, confirm2FASetup } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login); 
router.post('/2fa/verify', verify2FA);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/confirm', authenticate, confirm2FASetup);

export default router;