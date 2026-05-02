import { Router } from 'express';
import { updateProfile, getMyMission, completeMission } from '../controllers/influencer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.patch('/profile', authenticate, updateProfile);
router.get('/mission', authenticate, getMyMission);
router.post('/mission/complete', authenticate, completeMission);

export default router;
