import { Request, Response } from 'express';
import { UserRole } from '../types/roles';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { addNotificationJob } from '../queues/notification.queue';

const submitSchema = z.object({
  proofUrl: z.string().url('O link da prova deve ser uma URL válida do Instagram ou TikTok.'),
});

export const submitWork = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    // RBAC: Garante que apenas influenciadores usem essa funcionalidade
    if (userRole !== UserRole.INFLUENCER) {
      res.status(403).json({ error: 'Apenas influenciadores podem submeter entregáveis.' });
      return;
    }

    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { proofUrl } = parsed.data;

    // 1. Verificação de Propriedade (ReBAC)
    // Buscamos o entregável e garantimos que ele pertence ao contrato onde o userId logado é o influenciador
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        contract: {
          influencer: { userId }
        }
      },
      include: { 
        contract: { 
          select: { 
            id: true,
            title: true, 
            company: { select: { userId: true } } 
          } 
        } 
      }
    });

    if (!deliverable) {
      res.status(403).json({ error: 'Acesso negado. Você não tem permissão para submeter este entregável ou ele não existe.' });
      return;
    }

    // Regra Final: O sistema deve impedir a submissão se o entregável já estiver com status 'APPROVED'
    if (deliverable.status === 'APPROVED') {
      res.status(400).json({ error: 'Este entregável já foi aprovado e não pode ser re-submetido.' });
      return;
    }

    const [updatedDeliverable] = await prisma.$transaction([
      prisma.deliverable.update({
        where: { id },
        data: { 
          status: 'UNDER_REVIEW',
          proofUrl 
        }
      }),
      prisma.notification.create({
        data: {
          userId: deliverable.contract.company.userId,
          message: `Nova entrega para revisão no contrato: ${deliverable.contract.title}`,
          type: 'SUBMISSION_REVIEW'
        }
      })
    ]);

    await addNotificationJob(
      deliverable.contract.company.userId,
      `Nova entrega para revisão no contrato: ${deliverable.contract.title}`,
      'SUBMISSION_REVIEW'
    );

    res.status(200).json({ message: 'Entrega submetida com sucesso!', deliverable: updatedDeliverable });
  } catch (error) {
    console.error('[DELIVERABLE] Erro na submissão:', error);
    res.status(500).json({ error: 'Erro interno ao submeter entrega. Verifique se os dados são válidos.' });
  }
};

export const approveWork = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // 1. ReBAC: Validar se a Empresa logada é a dona do contrato deste deliverable
    const deliverable = await prisma.deliverable.findFirst({
      where: {
        id,
        contract: { company: { userId } }
      },
      include: { 
        contract: { 
          include: { 
            deliverables: true,
            influencer: { select: { userId: true } } 
          } 
        } 
      }
    });

    if (!deliverable) {
      res.status(403).json({ error: "Acesso negado." });
      return;
    }
    if (deliverable.status !== 'UNDER_REVIEW') {
      res.status(400).json({ error: "Apenas entregas em revisão podem ser aprovadas." });
      return;
    }

    // 2. Transação Atômica de Aprovação e Verificação de Conclusão
    await prisma.$transaction(async (tx) => {
      // Aprovar o entregável atual
      await tx.deliverable.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      // Verificar se todos os entregáveis deste contrato já foram aprovados
      const allApproved = deliverable.contract.deliverables.every(
        d => d.id === id ? true : d.status === 'APPROVED'
      );

      if (allApproved) {
        await tx.contract.update({
          where: { id: deliverable.contractId },
          data: { escrowStatus: 'COMPLETED' }
        });
      }

      await tx.notification.create({
        data: {
          userId: deliverable.contract.influencer.userId,
          message: `Sua entrega no contrato "${deliverable.contract.title}" foi aprovada! Pagamento Liberado.`,
          type: 'PAYMENT_RELEASED'
        }
      });
    });

    await addNotificationJob(
      deliverable.contract.influencer.userId,
      `Sua entrega no contrato "${deliverable.contract.title}" foi aprovada! Pagamento Liberado.`,
      'PAYMENT_RELEASED'
    );

    res.status(200).json({ message: "Entrega aprovada com sucesso!" });
  } catch (error) {
    console.error('[DELIVERABLE] Erro na aprovação:', error);
    res.status(500).json({ error: "Erro ao aprovar entrega." });
  }
};

export const rejectWork = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body; // Motivo do ajuste

    if (!reason) {
      res.status(400).json({ error: "O motivo do ajuste é obrigatório." });
      return;
    }

    const deliverable = await prisma.deliverable.findFirst({
      where: { id, contract: { company: { userId } } },
      include: { contract: { include: { influencer: { select: { userId: true } } } } }
    });

    if (!deliverable) {
      res.status(403).json({ error: "Acesso negado." });
      return;
    }

    await prisma.$transaction([
      prisma.deliverable.update({
        where: { id },
        data: { status: 'PENDING', proofUrl: null } // Volta para pendente
      }),
      prisma.notification.create({
        data: {
          userId: deliverable.contract.influencer.userId,
          message: `Ajuste solicitado no contrato "${deliverable.contract.title}": ${reason}`,
          type: 'REVISION_REQUESTED'
        }
      })
    ]);

    await addNotificationJob(
      deliverable.contract.influencer.userId,
      `Ajuste solicitado no contrato "${deliverable.contract.title}": ${reason}`,
      'REVISION_REQUESTED'
    );

    res.status(200).json({ message: "Solicitação de ajuste enviada." });
  } catch (error) {
    console.error('[DELIVERABLE] Erro na rejeição:', error);
    res.status(500).json({ error: "Erro ao processar rejeição." });
  }
};
