import { Router } from 'express';
import {
  createRecebido,
  getInfluencerRecebidos,
  getCompanyRecebidos,
  updateRecebidoStatus,
  updateShippingProfile
} from '../controllers/recebidos.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createRecebido);
router.get('/influencer', authenticate, getInfluencerRecebidos);
router.get('/company', authenticate, getCompanyRecebidos);
router.patch('/:id/status', authenticate, updateRecebidoStatus);
router.patch('/shipping', authenticate, updateShippingProfile);

export default router;
