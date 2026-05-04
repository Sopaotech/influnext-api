import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(3, 'O assunto é obrigatório.'),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.'),
  category: z.enum(['BUG', 'SUPPORT', 'FEATURE']),
});

export const createTicket = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subject, message, category } = createTicketSchema.parse(req.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
        category,
        status: 'OPEN'
      }
    });

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyTickets = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTicketsAdmin = async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
       res.status(403).json({ error: 'Acesso negado' });
       return;
    }
    const tickets = await prisma.supportTicket.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
