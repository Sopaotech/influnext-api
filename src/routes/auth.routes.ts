// Build Version: 2.0.1 - Fix Sync
import { Router } from 'express';
import { signup, login, verify2FA, setup2FA, confirm2FASetup, completeProfile, forceAdminAccess } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/signup', signup);
router.post('/login', login); 
router.post('/force-admin', forceAdminAccess);
router.post('/2fa/verify', verify2FA);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/confirm', authenticate, confirm2FASetup);
router.post('/complete-profile', authenticate, completeProfile);

export default router;