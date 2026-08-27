import { MercadoPagoService } from '../src/services/mercadopago.service';
import { prisma } from '../src/lib/prisma';
import { QuickAlertService } from '../src/services/quick-alert.service';
import { mpPayment, mpPreference, mpPreApproval } from '../src/lib/mercadopago';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    contract: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
    influencerProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    }
  }
}));

jest.mock('../src/lib/mercadopago', () => ({
  mpPayment: {
    create: jest.fn(),
    get: jest.fn(),
  },
  mpPreference: {
    create: jest.fn(),
  },
  mpPreApproval: {
    create: jest.fn(),
  }
}));

jest.mock('../src/services/quick-alert.service', () => ({
  QuickAlertService: {
    notifyEscrowConfirmed: jest.fn().mockResolvedValue(true)
  }
}));

describe('MercadoPagoService (Integração Oficial de Pagamentos)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar cobrança PIX com taxa correta (7% para Premium) e salvar QR Code', async () => {
    (prisma.contract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract-1',
      title: 'Campanha Tech 2026',
      budget: 1000,
      successFeeRate: 0.07,
      influencerSigned: true,
      company: { companyName: 'TechCorp', user: { email: 'empresa@tech.com' } },
      influencer: { user: { id: 'user-inf-1' } }
    });

    (mpPayment.create as jest.Mock).mockResolvedValue({
      id: 99887766,
      date_of_expiration: '2026-08-27T10:00:00Z',
      point_of_interaction: {
        transaction_data: {
          qr_code: '00020126580014br.gov.bcb.pix...',
          qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAA...',
          ticket_url: 'https://www.mercadopago.com.br/payments/99887766/ticket'
        }
      }
    });

    (prisma.contract.update as jest.Mock).mockResolvedValue({});

    const result = await MercadoPagoService.createContractPix('contract-1', 'empresa@tech.com');

    expect(result.paymentId).toBe('99887766');
    expect(result.totalAmount).toBe(1070); // 1000 + 7%
    expect(result.feeAmount).toBe(70);
    expect(result.qrCode).toContain('00020126580014br.gov.bcb.pix');

    expect(mpPayment.create).toHaveBeenCalledWith({
      body: expect.objectContaining({
        transaction_amount: 1070,
        payment_method_id: 'pix',
        metadata: expect.objectContaining({
          contract_id: 'contract-1',
          type: 'contract_escrow'
        })
      })
    });

    expect(prisma.contract.update).toHaveBeenCalledWith({
      where: { id: 'contract-1' },
      data: expect.objectContaining({
        mpPaymentId: '99887766',
        escrowStatus: 'PENDING_PAYMENT'
      })
    });
  });

  it('deve processar pagamento aprovado, ativar Escrow IN_PROGRESS e disparar alerta', async () => {
    (mpPayment.get as jest.Mock).mockResolvedValue({
      id: 99887766,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 1070,
      metadata: {
        contract_id: 'contract-1'
      }
    });

    (prisma.contract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract-1',
      title: 'Campanha Tech 2026',
      budget: 1000,
      netAmount: 1000,
      escrowStatus: 'PENDING_PAYMENT',
      influencer: { userId: 'user-inf-1' }
    });

    (prisma.contract.update as jest.Mock).mockResolvedValue({});

    const result = await MercadoPagoService.handlePaymentApproved('99887766');

    expect(result.approved).toBe(true);
    expect(result.processed).toBe(true);

    expect(prisma.contract.update).toHaveBeenCalledWith({
      where: { id: 'contract-1' },
      data: {
        escrowStatus: 'IN_PROGRESS',
        externalTxId: '99887766'
      }
    });

    expect(QuickAlertService.notifyEscrowConfirmed).toHaveBeenCalledWith({
      recipientUserId: 'user-inf-1',
      contractTitle: 'Campanha Tech 2026',
      netAmount: 1000,
      contractId: 'contract-1'
    });
  });

  it('deve gerar preferência de checkout para cartão de crédito', async () => {
    (prisma.contract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract-2',
      title: 'Campanha Moda',
      budget: 2000,
      successFeeRate: 0.15,
      influencerSigned: true,
      company: { companyName: 'ModaCorp', user: { email: 'moda@corp.com' } },
      influencer: { user: { id: 'user-inf-2' } }
    });

    (mpPreference.create as jest.Mock).mockResolvedValue({
      id: 'pref-123456',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123456',
      sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-123456'
    });

    const result = await MercadoPagoService.createContractPreference('contract-2', 'moda@corp.com');

    expect(result.preferenceId).toBe('pref-123456');
    expect(result.totalAmount).toBe(2300); // 2000 + 15% (300)
    expect(result.initPoint).toContain('pref_id=pref-123456');
  });

  it('deve gerar assinatura recorrente de plano SaaS (Creator Premium R$ 59,90)', async () => {
    (prisma.plan.findUnique as jest.Mock).mockResolvedValue({
      id: 'plan-pro',
      name: 'Creator Premium',
      price: 59.90
    });

    (mpPreApproval.create as jest.Mock).mockResolvedValue({
      id: 'sub-mp-7788',
      init_point: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=sub-mp-7788'
    });

    const result = await MercadoPagoService.createSubscription('user-1', 'plan-pro', 'creator@email.com');

    expect(result.preapprovalId).toBe('sub-mp-7788');
    expect(mpPreApproval.create).toHaveBeenCalledWith({
      body: expect.objectContaining({
        reason: 'InfluNext - Assinatura Creator Premium',
        auto_recurring: expect.objectContaining({
          transaction_amount: 59.90,
          currency_id: 'BRL'
        }),
        payer_email: 'creator@email.com'
      })
    });
  });
});
