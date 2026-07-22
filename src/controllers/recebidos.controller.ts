import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';



const createRecebidoSchema = z.object({
  influencerId:    z.string().min(1, 'Influenciador obrigatório.'),
  title:           z.string().min(1, 'Título obrigatório.').max(255),
  description:     z.string().optional(),
  trackingCode:    z.string().optional(),
  shippingCarrier: z.string().optional(),
});

const updateRecebidoStatusSchema = z.object({
  status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED', 'RECEIVED', 'REJECTED']),
});

const updateShippingProfileSchema = z.object({
  shippingAddress: z.string().optional(),
  poBox:           z.string().optional(),
  shareAddress:    z.boolean(),
});

export const createRecebido = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const company = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!company) {
      res.status(403).json({ error: 'Apenas empresas podem enviar recebidos.' });
      return;
    }

    const parsed = createRecebidoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { influencerId, title, description, trackingCode, shippingCarrier } = parsed.data;

    const influencer = await prisma.influencerProfile.findUnique({ where: { id: influencerId } });
    if (!influencer) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    const recebido = await prisma.recebido.create({
      data: {
        companyId: company.id,
        influencerId,
        title,
        description,
        trackingCode,
        shippingCarrier,
        status: trackingCode ? 'SHIPPED' : 'PENDING',
        sentAt: trackingCode ? new Date() : undefined,
      },
    });

    res.status(201).json(recebido);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar recebido.' });
  }
};

export const getInfluencerRecebidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(200).json([]);
      return;
    }

    const recebidos = await prisma.recebido.findMany({
      where: { influencerId: influencer.id },
      include: {
        company: {
          select: {
            companyName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(recebidos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar recebidos.' });
  }
};

export const getCompanyRecebidos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const company = await prisma.companyProfile.findUnique({ where: { userId } });
    if (!company) {
      res.status(200).json([]);
      return;
    }

    const recebidos = await prisma.recebido.findMany({
      where: { companyId: company.id },
      include: {
        influencer: {
          select: {
            handle: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(recebidos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar recebidos.' });
  }
};

export const updateRecebidoStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const parsed = updateRecebidoStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Status inválido.' });
      return;
    }

    const { status } = parsed.data;

    const recebido = await prisma.recebido.findUnique({ where: { id } });
    if (!recebido) {
      res.status(404).json({ error: 'Recebido não encontrado.' });
      return;
    }

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    const company = await prisma.companyProfile.findUnique({ where: { userId } });

    if (
      (!influencer || influencer.id !== recebido.influencerId) &&
      (!company || company.id !== recebido.companyId)
    ) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    const updated = await prisma.recebido.update({
      where: { id },
      data: {
        status,
        receivedAt: status === 'RECEIVED' ? new Date() : undefined,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar recebido.' });
  }
};

export const updateShippingProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    const parsed = updateShippingProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { shippingAddress, poBox, shareAddress } = parsed.data;

    const updated = await prisma.influencerProfile.update({
      where: { id: influencer.id },
      data: {
        shippingAddress,
        poBox,
        shareAddress,
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar endereço.' });
  }
};
