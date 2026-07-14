import { Router } from 'express';
import { getPublicProfile } from '../controllers/public.controller';

const router = Router();

// Endpoint público para consulta de Media Kit Digital
router.get('/:handle', getPublicProfile);

export default router;
