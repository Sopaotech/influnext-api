import { Router } from 'express';
import { runAnalysis, getHistory, getAnalysisById } from '../controllers/marketing-intelligence.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

// Todas as rotas exigem autenticação e perfil de empresa
router.use(authenticate);
router.use(authorize(['COMPANY']));

// POST   /marketing-intelligence/run        → Executa nova análise
// GET    /marketing-intelligence/history    → Histórico paginado
// GET    /marketing-intelligence/:id        → Análise completa por ID
router.post('/run', runAnalysis);
router.get('/history', getHistory);
router.get('/:id', getAnalysisById);

export default router;
