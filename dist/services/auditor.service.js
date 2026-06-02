"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditorService = void 0;
const client_1 = require("@prisma/client");
const audit_1 = require("../utils/audit");
const scoring_service_1 = require("./scoring.service");
const prisma = new client_1.PrismaClient();
class AuditorService {
    /**
     * Sincroniza métricas via Graph API e persiste no banco de dados.
     * Garante a integridade dos dados via Hash e recalcula o InfluScore.
     */
    static async syncInstagramMetrics(influencerId, capturedData) {
        const metrics = {
            influencerId,
            provider: 'META_GRAPH_API',
            ...capturedData,
        };
        const integrityHash = (0, audit_1.generateIntegrityHash)(metrics);
        const snapshot = await prisma.metricSnapshot.create({
            data: { ...metrics, integrityHash, capturedAt: new Date() },
        });
        // Recalcula o InfluScore após cada sync (não bloqueia a resposta)
        scoring_service_1.ScoringService.calculateAndPersist(influencerId).catch((err) => console.error('[AUDITOR] Erro ao recalcular InfluScore:', err));
        return snapshot;
    }
}
exports.AuditorService = AuditorService;
