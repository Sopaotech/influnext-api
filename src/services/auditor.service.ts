import { prisma } from '../lib/prisma';
import { generateIntegrityHash } from '../utils/audit';
import { ScoringService } from './scoring.service';

export class AuditorService {
  /**
   * Sincroniza métricas de qualquer plataforma social e persiste snapshot com hash SHA-256.
   * Recalcula o InfluScore automaticamente.
   */
  static async syncMetrics(
    influencerId: string, 
    provider: 'INSTAGRAM' | 'TIKTOK' | 'META_GRAPH_API' | string,
    capturedData: { followers: number; engagementRate: number; reachLast30Days: number; avgViews: number }
  ) {
    const metrics = {
      influencerId,
      provider,
      ...capturedData,
    };

    const integrityHash = generateIntegrityHash(metrics);

    const snapshot = await prisma.metricSnapshot.create({
      data: { ...metrics, integrityHash, capturedAt: new Date() },
    });

    // Recalcula o InfluScore após cada sync (não bloqueia a resposta)
    Promise.resolve(ScoringService.calculateAndPersist(influencerId)).catch((err) =>
      console.error(`[AUDITOR] Erro ao recalcular InfluScore para ${influencerId}:`, err)
    );

    return snapshot;
  }

  /**
   * Alias de compatibilidade para Instagram
   */
  static async syncInstagramMetrics(
    influencerId: string, 
    capturedData: { followers: number; engagementRate: number; reachLast30Days: number; avgViews: number }
  ) {
    return this.syncMetrics(influencerId, 'META_GRAPH_API', capturedData);
  }
}
