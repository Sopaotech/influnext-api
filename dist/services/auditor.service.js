"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditorService = void 0;
const client_1 = require("@prisma/client");
const audit_1 = require("../utils/audit");
const scoring_service_1 = require("./scoring.service");
const prisma = new client_1.PrismaClient();
class AuditorService {
    /**
     * Simula a busca de métricas na Meta Graph API, salva no banco com hash de
     * integridade e recalcula o InfluScore ao final.
     */
    static async syncInstagramMetrics(influencerId, _platformId) {
        const capturedData = {
            followers: 12500,
            engagementRate: 3.4,
            reachLast30Days: 45000,
            avgViews: 8500,
        };
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
