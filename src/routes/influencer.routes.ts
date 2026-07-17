import { Router } from 'express';
import { 
  searchInfluencers, 
  searchCompanies,
  updateProfile, 
  getMyMission, 
  completeMission, 
  getRateCard, 
  updateRateCard,
  getTasks,
  updateTask,
  getDailyInsight,
  createVoiceTask,
  requestWithdraw,
  getBalance,
  seedDemoBalance
} from '../controllers/influencer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Busca pública (usada pelo Marketplace — autenticados via token)
router.get('/search', authenticate, searchInfluencers);
router.get('/companies/search', authenticate, searchCompanies);

// Rotas protegidas de Perfil e Missão (Legado)
router.patch('/profile', authenticate, updateProfile);
router.get('/mission', authenticate, getMyMission);
router.post('/mission/complete', authenticate, completeMission);

// Novas Rotas de Carreira & IA Empresária
router.get('/tasks', authenticate, getTasks);
router.post('/tasks/voice', authenticate, createVoiceTask);
router.patch('/tasks/:id', authenticate, updateTask);
router.get('/daily-insight', authenticate, getDailyInsight);

// Tabela de Preços (Rate Card)
router.get('/rate-card', authenticate, getRateCard);
router.post('/rate-card', authenticate, updateRateCard);

// Carteira & Saque PIX
router.get('/balance', authenticate, getBalance);
router.post('/withdraw', authenticate, requestWithdraw);
router.post('/seed-balance', authenticate, seedDemoBalance);

export default router;

