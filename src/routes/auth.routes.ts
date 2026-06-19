// Build Version: 2.0.1 - Fix Sync
import { Router } from 'express';
import { signup, login, verify2FA, setup2FA, confirm2FASetup, completeProfile, socialLogin } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { ipSignupLimiter } from '../middlewares/security.middleware';

const router = Router();

router.post('/signup', ipSignupLimiter, signup);
router.post('/login', login); 
router.post('/social-login', socialLogin); 
router.post('/2fa/verify', verify2FA);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/confirm', authenticate, confirm2FASetup);
router.post('/complete-profile', authenticate, completeProfile);

export default router;