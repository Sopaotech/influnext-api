import { Router } from 'express';
import { createContract, confirmPayment, getMyContracts, getContractById } from '../controllers/contract.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types/roles';

const router = Router();

router.post('/', authenticate, createContract);
router.get('/', authenticate, getMyContracts);
router.get('/:id', authenticate, getContractById);

// Confirmação manual de pagamento: ADMIN ou COMPANY
router.post('/:id/pay', authenticate, authorize([UserRole.ADMIN, UserRole.COMPANY]), confirmPayment);

export default router;
