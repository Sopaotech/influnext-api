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
