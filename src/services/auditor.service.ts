import { PrismaClient } from '@prisma/client';
import { generateIntegrityHash } from '../utils/audit';
import { ScoringService } from './scoring.service';

const prisma = new PrismaClient();

export class AuditorService {
  /**
   * Simula a busca de métricas na Meta Graph API, salva no banco com hash de
   * integridade e recalcula o InfluScore ao final.
   */
  static async syncInstagramMetrics(influencerId: string, _platformId: string) {
    const capturedData = {
      followers:       12500,
      engagementRate:  3.4,
      reachLast30Days: 45000,
      avgViews:        8500,
    };

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
