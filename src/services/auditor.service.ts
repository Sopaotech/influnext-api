import { prisma } from '../lib/prisma';
import { generateIntegrityHash } from '../utils/audit';
import { ScoringService } from './scoring.service';

export class AuditorService {
  /**
   * Sincroniza métricas via Graph API e persiste no banco de dados.
   * Garante a integridade dos dados via Hash e recalcula o InfluScore.
   */
  static async syncInstagramMetrics(influencerId: string, capturedData: { followers: number; engagementRate: number; reachLast30Days: number; avgViews: number }) {
    const metrics = {
      influencerId,
      provider: 'META_GRAPH_API',
      ...capturedData,
    };

    const integrityHash = generateIntegrityHash(metrics);

    const snapshot = await prisma.metricSnapshot.create({
      data: { ...metrics, integrityHash, capturedAt: new Date() },
    });

    // Recalcula o InfluScore após cada sync (não bloqueia a resposta)
    ScoringService.calculateAndPersist(influencerId).catch((err) =>
      console.error('[AUDITOR] Erro ao recalcular InfluScore:', err)
    );

    return snapshot;
  }
}
