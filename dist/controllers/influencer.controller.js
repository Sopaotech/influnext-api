"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchInfluencers = void 0;
const prisma_1 = require("../lib/prisma");
const searchInfluencers = async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || q.length < 2) {
            res.json([]);
            return;
        }
        const influencers = await prisma_1.prisma.influencerProfile.findMany({
            where: {
                handle: {
                    contains: q
                }
            },
            select: {
                id: true,
                handle: true,
                verifiedMetrics: true
            },
            take: 10
        });
        res.json(influencers);
    }
    catch (error) {
        console.error('[INFLUENCER] Erro na busca:', error);
        res.status(500).json({ error: "Erro ao buscar influenciadores." });
    }
};
exports.searchInfluencers = searchInfluencers;
