import { Router } from 'express';
import { getPublicProfile, createInstantCheckout } from '../controllers/public.controller';
import { sanitizeContactData } from '../middlewares/contact-sanitizer.middleware';

const router = Router();

// Endpoint público para contratação instantânea em Escrow via Mídia Kit (com proteção Anti-Bypass)
router.post('/instant-checkout', sanitizeContactData, createInstantCheckout);

// Endpoint público para consulta de Media Kit Digital
router.get('/:handle', getPublicProfile);


export default router;

