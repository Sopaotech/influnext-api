import { Router } from 'express';
import { getAdminStats, getGrowthStrategy, listAllUsers, grantProAccess } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// Endpoint ultra-protegido: Apenas quem tiver o Role ADMIN pode acessar
router.get('/stats', authenticate, authorize([UserRole.ADMIN]), getAdminStats);
router.get('/growth-strategy', authenticate, authorize([UserRole.ADMIN]), getGrowthStrategy);
router.get('/users', authenticate, authorize([UserRole.ADMIN]), listAllUsers);
router.post('/users/grant-pro', authenticate, authorize([UserRole.ADMIN]), grantProAccess);

export default router;
