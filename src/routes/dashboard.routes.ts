import { Router } from 'express';
import { getInfluencerDashboard, getCompanyDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/influencer', authenticate, getInfluencerDashboard);
router.get('/company', authenticate, getCompanyDashboard);

export default router;
