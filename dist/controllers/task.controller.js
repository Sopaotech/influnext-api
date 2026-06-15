"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.toggleTask = exports.getTelemetryResults = exports.completeTaskWithProof = exports.processAICommand = exports.createAITasks = exports.getMyTasks = exports.createTask = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const post_analyzer_queue_1 = require("../queues/post-analyzer.queue");
const calendar_service_1 = require("../services/calendar.service");
const prisma = new client_1.PrismaClient();
// ─── Schemas ──────────────────────────────────────────────────────────────────
const createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Título obrigatório.').max(255),
    scheduledDate: zod_1.z.string().optional(),
});
const aiTaskSuggestionSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    daysFromNow: zod_1.z.number(),
});
const createAITasksSchema = zod_1.z.array(aiTaskSuggestionSchema);
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
        // Sincronizar com Google Calendar (Background)
        if (task.scheduledDate) {
            calendar_service_1.CalendarService.syncTaskToCalendar(userId, {
                title: task.title,
                description: task.description,
                scheduledDate: task.scheduledDate
            });
        }
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
            res.status(200).json([]);
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
const createAITasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const parsed = createAITasksSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Dados de tarefas inválidos.' });
            return;
        }
        const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(404).json({ error: 'Perfil não encontrado.' });
            return;
        }
        const suggestions = parsed.data;
        const createdTasks = [];
        for (const suggestion of suggestions) {
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + suggestion.daysFromNow);
            scheduledDate.setHours(0, 0, 0, 0);
            // Regra de Ouro: Evitar duplicados no mesmo dia
            const existing = await prisma.task.findFirst({
                where: {
                    influencerId: influencer.id,
                    title: suggestion.title,
                    scheduledDate: {
                        gte: scheduledDate,
                        lt: new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000)
                    }
                }
            });
            if (!existing) {
                const task = await prisma.task.create({
                    data: {
                        influencerId: influencer.id,
                        title: suggestion.title,
                        description: suggestion.description,
                        scheduledDate: scheduledDate,
                        fromAI: true,
                    }
                });
                // Sincronizar com Google Calendar (Background)
                calendar_service_1.CalendarService.syncTaskToCalendar(userId, {
                    title: task.title,
                    description: task.description,
                    scheduledDate: task.scheduledDate
                });
                createdTasks.push(task);
            }
        }
        res.status(201).json({
            message: `${createdTasks.length} tarefas sincronizadas com sucesso!`,
            tasks: createdTasks
        });
    }
    catch (error) {
        console.error('[TASK CONTROLLER] Erro ao criar tarefas de IA:', error);
        res.status(500).json({ error: 'Erro ao processar plano de ação.' });
    }
};
exports.createAITasks = createAITasks;
const processAICommand = async (req, res) => {
    try {
        const userId = req.user.id;
        const { command } = req.body;
        if (!command) {
            res.status(400).json({ error: 'Comando não enviado.' });
            return;
        }
        const { AIService } = await Promise.resolve().then(() => __importStar(require('../services/ai.service')));
        const intent = await AIService.parseNaturalCommand(command);
        if (intent.action === 'CREATE_TASK' && intent.data) {
            const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
            if (!influencer) {
                res.status(404).json({ error: 'Influenciador não encontrado.' });
                return;
            }
            const task = await prisma.task.create({
                data: {
                    influencerId: influencer.id,
                    title: intent.data.title,
                    scheduledDate: new Date(intent.data.scheduledDate),
                    fromAI: true
                }
            });
            res.status(201).json({ message: 'Tarefa agendada com sucesso!', task });
            return;
        }
        res.status(422).json({ error: 'Não consegui entender esse comando estrategicamente. Tente algo como "Marcar reunião para amanhã".' });
    }
    catch (error) {
        console.error('[TASK AI COMMAND ERROR]:', error);
        res.status(500).json({ error: 'Erro ao processar comando de IA.' });
    }
};
exports.processAICommand = processAICommand;
const completeTaskWithProof = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { proofUrl } = req.body;
        if (!proofUrl) {
            res.status(400).json({ error: 'URL de prova obrigatória.' });
            return;
        }
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                isDone: true,
                proofUrl
            }
        });
        // Se veio da IA, agenda análise de ROI
        if (task.fromAI) {
            await (0, post_analyzer_queue_1.addPostAnalysisJob)(task.id, proofUrl);
        }
        res.status(200).json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao concluir tarefa.' });
    }
};
exports.completeTaskWithProof = completeTaskWithProof;
const getTelemetryResults = async (req, res) => {
    try {
        const userId = req.user.id;
        const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
        if (!influencer) {
            res.status(200).json([]);
            return;
        }
        const results = await prisma.task.findMany({
            where: {
                influencerId: influencer.id,
                fromAI: true,
                performanceMultiplier: { not: null }
            },
            orderBy: { scheduledDate: 'desc' },
            take: 3
        });
        res.status(200).json(results);
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao buscar telemetria.' });
    }
};
exports.getTelemetryResults = getTelemetryResults;
const toggleTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            res.status(404).json({ error: 'Tarefa não encontrada.' });
            return;
        }
        const updated = await prisma.task.update({
            where: { id: taskId },
            data: { isDone: !task.isDone }
        });
        res.status(200).json(updated);
    }
    catch (error) {
        res.status(550).json({ error: 'Erro ao alternar status da tarefa.' });
    }
};
exports.toggleTask = toggleTask;
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        await prisma.task.delete({ where: { id: taskId } });
        res.status(200).json({ message: 'Tarefa excluída com sucesso.' });
    }
    catch (error) {
        res.status(550).json({ error: 'Erro ao excluir tarefa.' });
    }
};
exports.deleteTask = deleteTask;
