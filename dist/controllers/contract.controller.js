"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmPayment = exports.createContract = void 0;
const roles_1 = require("../types/roles");
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const notification_queue_1 = require("../queues/notification.queue");
// ─── Schemas ──────────────────────────────────────────────────────────────────
const deliverableSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'O título do entregável é obrigatório.'),
    type: zod_1.z.string().min(1, 'O tipo do entregável é obrigatório.'),
    dueDate: zod_1.z.string().min(1, 'A data do entregável é obrigatória.'),
    // deadline como alias para compatibilidade com o schema Prisma
    deadline: zod_1.z.string().optional(),
});
const createContractSchema = zod_1.z.object({
    influencerId: zod_1.z.string().uuid('ID do influenciador inválido.'),
    title: zod_1.z.string().min(1, 'O título é obrigatório.'),
    budget: zod_1.z.coerce.number().positive('O budget deve ser um número positivo.'),
    deliverables: zod_1.z.array(deliverableSchema).min(1, 'Pelo menos um entregável é obrigatório.'),
});
// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLATFORM_TAKE_RATE = 0.10; // 10% de comissão
// ─── Controllers ──────────────────────────────────────────────────────────────
const createContract = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        if (userRole !== roles_1.UserRole.COMPANY) {
            res.status(403).json({ error: "Apenas empresas podem criar contratos." });
            return;
        }
        const parsed = createContractSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { influencerId, title, budget, deliverables } = parsed.data;
        // ─── Cálculo do Take Rate (10%) ─────────────────────────────────────────
        const platformFee = budget * PLATFORM_TAKE_RATE;
        const netAmount = budget - platformFee;
        // ────────────────────────────────────────────────────────────────────────
        const company = await prisma_1.prisma.companyProfile.findUnique({ where: { userId } });
        if (!company) {
            res.status(403).json({ error: "Perfil de empresa não encontrado." });
            return;
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const contract = await tx.contract.create({
                data: {
                    companyId: company.id,
                    influencerId,
                    title,
                    budget,
                    platformFee,
                    netAmount,
                    escrowStatus: 'DRAFT',
                    deliverables: {
                        create: deliverables.map((d) => ({
                            title: d.title,
                            type: d.type,
                            deadline: new Date(d.dueDate || d.deadline || new Date()),
                            status: 'PENDING'
                        }))
                    }
                },
                include: { deliverables: true }
            });
            const influencer = await tx.influencerProfile.findUnique({ where: { id: influencerId } });
            if (influencer) {
                await tx.notification.create({
                    data: {
                        userId: influencer.userId,
                        message: `Nova proposta de contrato: "${title}" (Valor Líquido: $${netAmount.toFixed(2)})`,
                        type: 'CONTRACT_OFFER'
                    }
                });
            }
            return { contract, influencerUserId: influencer?.userId };
        });
        if (result.influencerUserId) {
            await (0, notification_queue_1.addNotificationJob)(result.influencerUserId, `Nova proposta de contrato: "${title}" (Valor líquido para você: $${netAmount.toFixed(2)})`, 'CONTRACT_OFFER');
        }
        res.status(201).json(result.contract);
    }
    catch (error) {
        console.error('[CONTRACT] Erro na transação do contrato:', error);
        res.status(500).json({ error: "Erro ao criar contrato." });
    }
};
exports.createContract = createContract;
// ─── Confirmação Manual de Pagamento (Mock Escrow) ────────────────────────────
const confirmPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { id } = req.params;
        // Apenas ADMIN ou a COMPANY dona do contrato podem confirmar
        if (userRole === roles_1.UserRole.INFLUENCER) {
            res.status(403).json({ error: "Influenciadores não podem confirmar pagamentos." });
            return;
        }
        const contract = await prisma_1.prisma.contract.findUnique({
            where: { id },
            include: { company: true, influencer: true }
        });
        if (!contract) {
            res.status(404).json({ error: "Contrato não encontrado." });
            return;
        }
        // Garantir que apenas o ADMIN ou a própria Company dona confirme
        if (userRole === roles_1.UserRole.COMPANY) {
            const company = await prisma_1.prisma.companyProfile.findUnique({ where: { userId } });
            if (!company || company.id !== contract.companyId) {
                res.status(403).json({ error: "Você não é o dono deste contrato." });
                return;
            }
        }
        if (contract.escrowStatus !== 'DRAFT') {
            res.status(409).json({ error: `Contrato já está no status: ${contract.escrowStatus}. Apenas contratos DRAFT podem ser ativados.` });
            return;
        }
        // Atualiza status via transação atômica
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            const updatedContract = await tx.contract.update({
                where: { id },
                data: { escrowStatus: 'IN_PROGRESS' }
            });
            await tx.notification.create({
                data: {
                    userId: contract.influencer.userId,
                    message: `✅ Depósito em Escrow confirmado para o contrato: "${contract.title}". Pode iniciar a produção!`,
                    type: 'ESCROW_CONFIRMED'
                }
            });
            return updatedContract;
        });
        // Dispara job de notificação assíncrono
        await (0, notification_queue_1.addNotificationJob)(contract.influencer.userId, `💰 Seu pagamento foi confirmado! Pode iniciar a produção de: "${contract.title}". Valor líquido: $${Number(contract.netAmount).toFixed(2)}`, 'ESCROW_CONFIRMED');
        res.json({
            message: "Escrow confirmado. Influenciador notificado para iniciar a produção.",
            contract: updated
        });
    }
    catch (error) {
        console.error('[CONTRACT] Erro ao confirmar pagamento:', error);
        res.status(500).json({ error: "Erro ao confirmar o pagamento." });
    }
};
exports.confirmPayment = confirmPayment;
