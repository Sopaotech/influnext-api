import { Router } from 'express';
import { searchInfluencers, updateProfile, getMyMission, completeMission, getRateCard, updateRateCard } from '../controllers/influencer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Busca pública (usada pelo Marketplace — autenticados via token)
router.get('/search', authenticate, searchInfluencers);

// Rotas protegidas
router.patch('/profile', authenticate, updateProfile);
router.get('/mission', authenticate, getMyMission);
router.post('/mission/complete', authenticate, completeMission);

// Tabela de Preços (Rate Card)
router.get('/rate-card', authenticate, getRateCard);
router.post('/rate-card', authenticate, updateRateCard);

export default router;
