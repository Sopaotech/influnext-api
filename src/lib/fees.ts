/**
 * ─── InfluNext — Configuração de Taxas (Fonte Única de Verdade) ───────────────
 *
 * MODELO DE NEGÓCIOS APROVADO (julho/2026):
 * - Conta FREE:    15% de taxa sobre o budget do contrato (creator recebe 85%)
 * - Conta PREMIUM: 7% de taxa sobre o budget do contrato (creator recebe 93%)
 *   - Creator Premium: R$ 59,90/mês
 *   - Company Premium: R$ 120,00/mês
 *
 * A taxa é calculada sobre o budget acordado.
 * O valor pago pela empresa no checkout = budget + platformFee.
 * O creator recebe o netAmount = budget - platformFee.
 *
 * Qualquer alteração de taxa DEVE ser feita aqui — nunca em controllers individuais.
 */

/** Taxa de escrow para contas FREE (15%) */
export const ESCROW_FEE_FREE = 0.15;

/** Taxa de escrow para contas PREMIUM/PRO/MASTER/ENTERPRISE (7%) */
export const ESCROW_FEE_PREMIUM = 0.07;

/**
 * Retorna a taxa de escrow correta com base no tier de assinatura do creator.
 * @param tier - subscriptionTier do creator ('FREE' | 'PRO' | 'MASTER' | 'ENTERPRISE')
 */
export function getEscrowFeeRate(tier: string | null | undefined): number {
  switch (tier) {
    case 'PRO':
    case 'MASTER':
    case 'ENTERPRISE':
      return ESCROW_FEE_PREMIUM; // 7%
    default:
      return ESCROW_FEE_FREE; // 15% para FREE e qualquer valor não reconhecido
  }
}

/**
 * Retorna a taxa de escrow com base no subscriptionTier do COMPANY (brand).
 * Brands Premium também recebem 7%.
 */
export function getEscrowFeeRateBrand(tier: string | null | undefined): number {
  return getEscrowFeeRate(tier);
}

/**
 * Calcula os valores do contrato a partir do budget e tier.
 * @returns { successFeeRate, platformFee, netAmount, totalChargedToCompany }
 */
export function calcContractFees(budget: number, creatorTier: string | null | undefined) {
  const successFeeRate = getEscrowFeeRate(creatorTier);
  const platformFee = budget * successFeeRate;
  const netAmount = budget - platformFee; // O que o creator recebe
  const totalChargedToCompany = budget + platformFee; // Budget + taxa por cima
  return { successFeeRate, platformFee, netAmount, totalChargedToCompany };
}

/**
 * Limites de contratos ativos para conta FREE.
 * Contas com assinatura ativa não têm limite.
 */
export const FREE_BRAND_ACTIVE_CONTRACT_LIMIT = 3;
export const FREE_INFLUENCER_PLATFORM_LIMIT = 1; // Apenas 1 plataforma social no FREE

// ─── Penalidades por Atraso de Entrega (Late Delivery SLA) ───────────────────
/**
 * MODELO DE PENALIDADE APROVADO (julho/2026):
 * - 5% do netAmount do creator por dia de atraso
 * - Teto máximo: 50% do netAmount (proteção contra penalidade excessiva)
 * - O valor penalizado é revertido como crédito à empresa contratante
 */

/** Taxa de penalidade por dia de atraso (5% do netAmount) */
export const LATE_PENALTY_RATE_PER_DAY = 0.05;

/** Teto máximo da penalidade: 50% do netAmount */
export const LATE_PENALTY_MAX_RATE = 0.50;

/** Penalidade fixa de InfluScore por dia de atraso (sem justificativa aceita) */
export const LATE_PENALTY_INFLUSCORE_PER_DAY = 50;

/**
 * Calcula a penalidade financeira por atraso de entrega de um entregável.
 *
 * @param netAmount - Valor líquido que o creator receberia sem penalidade (R$)
 * @param deadline  - Data limite acordada para a entrega
 * @param submittedAt - Data real de submissão (default: agora)
 * @returns { daysLate, penaltyRate, penaltyAmount, adjustedNetAmount }
 *
 * @example
 * // Creator atrasou 3 dias em uma entrega de R$ 1.000 líquidos
 * calcLatePenalty(1000, new Date('2026-07-01'), new Date('2026-07-04'))
 * // → { daysLate: 3, penaltyRate: 0.15, penaltyAmount: 150, adjustedNetAmount: 850 }
 */
export function calcLatePenalty(
  netAmount: number,
  deadline: Date,
  submittedAt: Date = new Date()
): {
  daysLate: number;
  penaltyRate: number;
  penaltyAmount: number;
  adjustedNetAmount: number;
  isLate: boolean;
} {
  const msPerDay = 24 * 60 * 60 * 1000;
  const rawDiff = submittedAt.getTime() - deadline.getTime();
  const daysLate = rawDiff > 0 ? Math.ceil(rawDiff / msPerDay) : 0;

  if (daysLate === 0) {
    return { daysLate: 0, penaltyRate: 0, penaltyAmount: 0, adjustedNetAmount: netAmount, isLate: false };
  }

  // Calcula a taxa com teto de 50%
  const rawRate = LATE_PENALTY_RATE_PER_DAY * daysLate;
  const penaltyRate = Math.min(rawRate, LATE_PENALTY_MAX_RATE);
  const penaltyAmount = parseFloat((netAmount * penaltyRate).toFixed(2));
  const adjustedNetAmount = parseFloat((netAmount - penaltyAmount).toFixed(2));

  return { daysLate, penaltyRate, penaltyAmount, adjustedNetAmount, isLate: true };
}
