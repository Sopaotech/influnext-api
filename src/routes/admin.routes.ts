import { Router } from 'express';
import { getGlobalStats } from '../controllers/admin.controller';
import { simulateFullCycle } from '../controllers/sandbox.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// Endpoint ultra-protegido: Apenas quem tiver o Role ADMIN pode acessar
router.get('/stats', authenticate, authorize([UserRole.ADMIN]), getGlobalStats);
router.post('/sandbox/simulate', authenticate, authorize([UserRole.ADMIN]), simulateFullCycle);

export default router;
