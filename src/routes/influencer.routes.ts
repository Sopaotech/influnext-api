import { Router } from 'express';
import { searchInfluencers, updateProfile, getMyMission, completeMission } from '../controllers/influencer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Busca pública (usada pelo Marketplace — autenticados via token)
router.get('/search', authenticate, searchInfluencers);

// Rotas protegidas
router.patch('/profile', authenticate, updateProfile);
router.get('/mission', authenticate, getMyMission);
router.post('/mission/complete', authenticate, completeMission);

export default router;
