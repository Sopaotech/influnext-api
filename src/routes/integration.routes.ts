import { Router } from 'express';
import { 
  getAuthUrls, 
  handleInstagramCallback, 
  handleTikTokCallback, 
  getConnectedPlatforms, 
  syncPlatformMetrics,
  simulateInstagramConnection,
  triggerTokenRenewalDebug
} from '../controllers/integration.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// Listar plataformas conectadas
router.get('/connected', authenticate, getConnectedPlatforms);

// Obter URLs de autorização
router.get('/urls', authenticate, getAuthUrls);

// Sincronizar métricas de todas as plataformas (on-demand)
router.post('/sync-metrics', authenticate, syncPlatformMetrics);

// Simulação de conexão (ex: Instagram/TikTok)
router.post('/simulate', authenticate, simulateInstagramConnection);

// Execução manual da renovação de tokens (Apenas Admin)
router.post('/refresh-tokens-debug', authenticate, authorize([UserRole.ADMIN]), triggerTokenRenewalDebug);

// Callbacks (públicos, chamados pelas redes sociais)
router.get('/instagram/callback', handleInstagramCallback);
router.get('/tiktok/callback', handleTikTokCallback);

export default router;