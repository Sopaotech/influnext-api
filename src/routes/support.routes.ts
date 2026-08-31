import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createTicket, getMyTickets, getAllTicketsAdmin, updateTicketStatus } from '../controllers/support.controller';

const router = Router();

router.post('/', authenticate, createTicket);
router.get('/my', authenticate, getMyTickets);
router.get('/admin', authenticate, getAllTicketsAdmin);
router.patch('/admin/:id/status', authenticate, updateTicketStatus);

export default router;
