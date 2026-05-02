"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTasks = exports.createTask = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// ─── Schemas ──────────────────────────────────────────────────────────────────
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Título obrigatório.').max(255),
    scheduledDate: zod_1.z.string().datetime({ message: 'Data inválida. Use ISO 8601.' }).optional(),
});
// ─── Controllers ──────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
    try {
        // req.user é garantido pelo middleware `authenticate` — sem cast `any`.
        const userId = req.user.id;
        const parsed = createTaskSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
            return;
        }
        const { title, scheduledDate } = parsed.data;
        const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
            return;
        }
        const task = await prisma.task.create({
            data: {
                influencerId: influencer.id,
                title,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
            },
        });
        res.status(201).json(task);
    }
    catch {
        res.status(500).json({ error: 'Erro ao criar tarefa.' });
    }
};
exports.createTask = createTask;
const getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
            return;
        }
        const tasks = await prisma.task.findMany({
            where: { influencerId: influencer.id },
            orderBy: { scheduledDate: 'asc' },
        });
        res.status(200).json(tasks);
    }
    catch {
        res.status(500).json({ error: 'Erro ao buscar tarefas.' });
    }
};
exports.getMyTasks = getMyTasks;
