import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { addPostAnalysisJob } from '../queues/post-analyzer.queue';

const prisma = new PrismaClient();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createTaskSchema = z.object({
  title:         z.string().min(1, 'Título obrigatório.').max(255),
  scheduledDate: z.string().datetime({ message: 'Data inválida. Use ISO 8601.' }).optional(),
});

const aiTaskSuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  daysFromNow: z.number(),
});

const createAITasksSchema = z.array(aiTaskSuggestionSchema);

// ─── Controllers ──────────────────────────────────────────────────────────────

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user é garantido pelo middleware `authenticate` — sem cast `any`.
    const userId = req.user!.id;

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
        influencerId:  influencer.id,
        title,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      },
    });

    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
};

export const getMyTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!influencer) {
      res.status(404).json({ error: 'Perfil de influenciador não encontrado.' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where:   { influencerId: influencer.id },
      orderBy: { scheduledDate: 'asc' },
    });

    res.status(200).json(tasks);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar tarefas.' });
  }
};

export const createAITasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
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
        createdTasks.push(task);
      }
    }

    res.status(201).json({ 
      message: `${createdTasks.length} tarefas sincronizadas com sucesso!`,
      tasks: createdTasks 
    });
  } catch (error) {
    console.error('[TASK CONTROLLER] Erro ao criar tarefas de IA:', error);
    res.status(500).json({ error: 'Erro ao processar plano de ação.' });
  }
};

export const completeTaskWithProof = async (req: Request, res: Response): Promise<void> => {
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
      await addPostAnalysisJob(task.id, proofUrl);
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao concluir tarefa.' });
  }
};

export const getTelemetryResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const influencer = await prisma.influencerProfile.findUnique({ where: { userId } });
    
    if (!influencer) {
      res.status(404).json({ error: 'Perfil não encontrado.' });
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
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar telemetria.' });
  }
};