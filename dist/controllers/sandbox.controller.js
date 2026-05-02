"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateFullCycle = void 0;
const prisma_1 = require("../lib/prisma");
const simulateFullCycle = async (req, res) => {
    try {
        // 1. Localizar ou criar usuários de teste
        const company = await prisma_1.prisma.companyProfile.findFirst();
        const influencer = await prisma_1.prisma.influencerProfile.findFirst();
        if (!company || !influencer) {
            res.status(400).json({ error: "Necessário rodar o seed primeiro para ter perfis de teste." });
            return;
        }
        const budget = 5000.00;
        const platformFee = budget * 0.10; // R$ 500,00 de lucro
        const netAmount = budget - platformFee;
        // Executa ciclo atômico de simulação
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Criação
            const contract = await tx.contract.create({
                data: {
                    companyId: company.id,
                    influencerId: influencer.id,
                    title: `Simulação Automática #${Math.floor(Math.random() * 1000)}`,
                    budget,
                    platformFee,
                    netAmount,
                    escrowStatus: 'COMPLETED', // Simula já concluído para impacto imediato no faturamento
                    deliverables: {
                        create: [
                            { type: 'POST', status: 'APPROVED', deadline: new Date() }
                        ]
                    }
                }
            });
            return contract;
        });
        res.json({
            message: "Ciclo de simulação concluído com sucesso!",
            impact: {
                gmvAdded: budget,
                revenueAdded: platformFee,
                contractId: result.id
            }
        });
    }
    catch (error) {
        console.error('[SANDBOX] Erro na simulação:', error);
        res.status(500).json({ error: "Falha ao executar simulação." });
    }
};
exports.simulateFullCycle = simulateFullCycle;
