import { Router } from 'express';
import { createContract, confirmPayment, getMyContracts, getContractById, updateContractScript, cancelAndRefundContract, releasePayment } from '../controllers/contract.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { UserRole } from '../types/roles';
import { contractBudgetGuard } from '../middlewares/security.middleware';

const router = Router();

router.post('/', authenticate, contractBudgetGuard, createContract);
router.get('/', authenticate, getMyContracts);
router.get('/:id', authenticate, getContractById);
router.patch('/:id/script', authenticate, updateContractScript);

// Liberação de pagamento: ADMIN ou COMPANY
router.patch('/:id/release', authenticate, authorize([UserRole.ADMIN, UserRole.COMPANY]), releasePayment);

// Confirmação manual de pagamento: ADMIN ou COMPANY
router.post('/:id/pay', authenticate, authorize([UserRole.ADMIN, UserRole.COMPANY]), confirmPayment);

// Cancelamento de contrato e estorno: ADMIN ou COMPANY
router.post('/:id/cancel', authenticate, authorize([UserRole.ADMIN, UserRole.COMPANY]), cancelAndRefundContract);

export default router;
