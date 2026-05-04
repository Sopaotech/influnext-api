import { Router } from 'express';
import { getAdminStats, getGrowthStrategy } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// Endpoint ultra-protegido: Apenas quem tiver o Role ADMIN pode acessar
router.get('/stats', authenticate, authorize([UserRole.ADMIN]), getAdminStats);
router.get('/growth-strategy', authenticate, authorize([UserRole.ADMIN]), getGrowthStrategy);

export default router;
