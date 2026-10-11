import { Router } from 'express';
import { getPublicProfile, createInstantCheckout } from '../controllers/public.controller';
import { sanitizeContactData } from '../middlewares/contact-sanitizer.middleware';
import { developmentOrTestOnly } from '../middlewares/environment.middleware';

const router = Router();

// Endpoint público para contratação instantânea em Escrow via Mídia Kit (com proteção Anti-Bypass)
router.post('/instant-checkout', developmentOrTestOnly, sanitizeContactData, createInstantCheckout);

// Endpoint público para consulta de Media Kit Digital
router.get('/:handle', getPublicProfile);


export default router;

