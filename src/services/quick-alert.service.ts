import { prisma } from '../lib/prisma';
import { addNotificationJob } from '../queues/notification.queue';
import axios from 'axios';

export interface AlertPayload {
  recipientUserId: string;
  type: 'CONTRACT_OFFER' | 'ESCROW_CONFIRMED' | 'DELIVERABLE_SUBMITTED' | 'PAYMENT_RELEASED' | 'DISPUTE_OPENED' | 'SYSTEM';
  title: string;
  message: string;
  contractId?: string;
  metadata?: Record<string, any>;
}

export class QuickAlertService {
  /**
   * Dispara alerta em múltiplos canais (Banco de Dados + Push FCM + Webhook/WhatsApp)
   */
  static async dispatch(payload: AlertPayload): Promise<boolean> {
    const { recipientUserId, type, message, contractId, metadata } = payload;

    try {
      // 1. Persistência no Banco de Dados para a central in-app
      await prisma.notification.create({
        data: {
          userId: recipientUserId,
          message,
          type
        }
      });

      // 2. Fila assíncrona de Push Notification (FCM)
      await addNotificationJob(recipientUserId, message, type);

      // 3. Integração com Webhook de Alertas / WhatsApp Gateway
      const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || process.env.ALERTS_WEBHOOK_URL;
      if (webhookUrl) {
        axios.post(webhookUrl, {
          userId: recipientUserId,
          type,
          message,
          contractId,
          timestamp: new Date().toISOString(),
          metadata
        }, { timeout: 3000 }).catch(err => {
          console.warn('[QUICK_ALERT] Falha ao despachar webhook externo:', err.message);
        });
      } else {
        console.log(`[QUICK_ALERT] ⚡ Alerta disparado para ${recipientUserId} [${type}]: ${message}`);
      }

      return true;
    } catch (err: any) {
      console.error(`[QUICK_ALERT ERROR] Falha ao disparar alerta para ${recipientUserId}:`, err.message);
      return false;
    }
  }

  /**
   * Alerta de nova oferta / contratação direta
   */
  static async notifyNewOffer(params: {
    recipientUserId: string;
    campaignTitle: string;
    brandName: string;
    budget: number;
    contractId: string;
  }) {
    return this.dispatch({
      recipientUserId: params.recipientUserId,
      type: 'CONTRACT_OFFER',
      title: '🎯 Nova Proposta Recebida!',
      message: `🎯 Nova contratação de ${params.brandName}: "${params.campaignTitle}" (Cachê: R$ ${params.budget.toFixed(2)}).`,
      contractId: params.contractId,
      metadata: { budget: params.budget, brandName: params.brandName }
    });
  }

  /**
   * Alerta de depósito em Escrow confirmado
   */
  static async notifyEscrowConfirmed(params: {
    recipientUserId: string;
    contractTitle: string;
    netAmount: number;
    contractId: string;
  }) {
    return this.dispatch({
      recipientUserId: params.recipientUserId,
      type: 'ESCROW_CONFIRMED',
      title: '🛡️ Pagamento em Custódia Confirmado!',
      message: `✅ O pagamento do contrato "${params.contractTitle}" foi retido com segurança no Escrow. Pode iniciar a produção! Valor líquido: R$ ${params.netAmount.toFixed(2)}.`,
      contractId: params.contractId,
      metadata: { netAmount: params.netAmount }
    });
  }

  /**
   * Alerta de entregável postado / em revisão
   */
  static async notifyDeliverableSubmitted(params: {
    recipientUserId: string;
    contractTitle: string;
    creatorHandle: string;
    contractId: string;
  }) {
    return this.dispatch({
      recipientUserId: params.recipientUserId,
      type: 'DELIVERABLE_SUBMITTED',
      title: '🚀 Conteúdo Enviado para Revisão!',
      message: `🚀 @${params.creatorHandle} enviou os comprovantes de entrega da campanha "${params.contractTitle}". Revise o conteúdo para liberar os fundos!`,
      contractId: params.contractId,
      metadata: { creatorHandle: params.creatorHandle }
    });
  }

  /**
   * Alerta de pagamento liberado do Escrow
   */
  static async notifyPaymentReleased(params: {
    recipientUserId: string;
    contractTitle: string;
    netAmount: number;
    contractId: string;
  }) {
    return this.dispatch({
      recipientUserId: params.recipientUserId,
      type: 'PAYMENT_RELEASED',
      title: '💰 Pagamento Liberado!',
      message: `💰 O pagamento de R$ ${params.netAmount.toFixed(2)} referente ao contrato "${params.contractTitle}" foi liberado com sucesso para sua carteira!`,
      contractId: params.contractId,
      metadata: { netAmount: params.netAmount }
    });
  }
}
