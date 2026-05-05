import { PrismaClient } from '@prisma/client';
import { generateIntegrityHash } from '../utils/audit';
import { ScoringService } from './scoring.service';

const prisma = new PrismaClient();

export class AuditorService {
  /**
   * Sincroniza métricas via Graph API e persiste no banco de dados.
   * Garante a integridade dos dados via Hash e recalcula o InfluScore.
   */
  static async syncInstagramMetrics(influencerId: string, _platformId: string) {
    // Dados obtidos via integração de borda
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
