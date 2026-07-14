import { Router } from 'express';
import { SocialAuthController } from '../controllers/auth.social.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint para pegar as URLs de autorização
router.get('/urls', authenticate, SocialAuthController.getAuthUrls);

// Endpoint público para pegar as URLs de autorização de registro
router.get('/public-urls', SocialAuthController.getPublicAuthUrls);

// Endpoint de callback (chamado pelas redes sociais)
router.get('/callback/:platform', SocialAuthController.handleCallback);

export default router;
