import { Router } from 'express';
import { getAuthUrls, handleInstagramCallback, handleTikTokCallback, getConnectedPlatforms } from '../controllers/integration.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Listar plataformas conectadas
router.get('/connected', authenticate, getConnectedPlatforms);

// Obter URLs de autorização
router.get('/urls', authenticate, getAuthUrls);

// Callbacks (públicos, chamados pelas redes sociais)
router.get('/instagram/callback', handleInstagramCallback);
router.get('/tiktok/callback', handleTikTokCallback);

export default router;