import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentController {
  // Simula a criação de um pedido no Pagar.me com Split
  static async createOrder(req: Request, res: Response) {
    try {
      const { contractId, method } = req.body;
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { company: true, influencer: true }
      });

      if (!contract) return res.status(404).json({ error: 'Contrato não encontrado' });

      // Simulação de chamada ao Pagar.me
      const amount = contract.amount;
      const platformFee = amount * 0.10;
      const influencerAmount = amount * 0.90;

      // Mock da Resposta do Pagar.me
      const mockPagarmeResponse = {
        id: `or_${Math.random().toString(36).substring(7)}`,
        status: 'pending',
        qr_code: '00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915INFLUNEXT SA6009SAO PAULO62070503***6304',
        qr_code_url: 'https://api.pagar.me/core/v5/orders/qr_code_mock',
        split: {
          platform: platformFee,
          influencer: influencerAmount,
          influencer_recipient_id: 're_mock123'
        }
      };

      return res.json(mockPagarmeResponse);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao gerar pagamento' });
    }
  }

  // Recebe o Webhook do Pagar.me
  static async webhook(req: Request, res: Response) {
    try {
      const event = req.body;

      if (event.type === 'order.paid') {
        const contractId = event.data.metadata?.contractId; // O ideal é passar no metadata
        if (contractId) {
          await prisma.contract.update({
            where: { id: contractId },
            data: { status: 'IN_PROGRESS' } // Dinheiro em Escrow pending_release
          });

          console.log(`[Webhook] Contrato ${contractId} pago! Split garantido.`);
          // Plim Notification lógica aqui...
        }
      }

      return res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook erro:', error);
      return res.status(400).send('Webhook Error');
    }
  }
}
