import { Router } from 'express';
import { submitWork, approveWork, rejectWork } from '../controllers/deliverable.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Usamos PATCH pois estamos fazendo uma atualização parcial do recurso (submissão da url)
router.patch('/:id/submit', authenticate, submitWork);
router.patch('/:id/approve', authenticate, approveWork);
router.patch('/:id/reject', authenticate, rejectWork);

export default router;
