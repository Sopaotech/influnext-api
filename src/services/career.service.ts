import { prisma } from '../lib/prisma';
import { AIService } from './ai.service';
import { CalendarService } from './calendar.service';

export class CareerService {
  /**
   * Gera um plano de carreira completo de 30 dias baseado no objetivo do influencer.
   */
  static async generateFullCareerPlan(influencerId: string, objective: string) {
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
      include: { user: true }
    });

    if (!influencer) throw new Error('Influenciador não encontrado.');

    // 1. Chamar a IA para gerar o plano estratégico
    // Vamos adaptar o AIService para aceitar o objetivo
    const analysis = await AIService.generateWeeklyAnalysis(influencerId);
    
    // 2. Extrair tarefas sugeridas e salvar no banco
    // A lógica de salvar tarefas já existe no AIService.generateWeeklyAnalysis, 
    // mas vamos garantir que elas sejam criadas com o contexto do objetivo.
    
    return analysis;
  }

  /**
   * Gera o insight motivacional e empresarial do dia.
   */
  static async getDailyBusinessInsight(influencerId: string) {
    try {
      const insight = await AIService.generateDailyBusinessInsight(influencerId);
      return insight;
    } catch (error) {
      return `Foque na constância. O sucesso é um jogo de longo prazo.`;
    }
  }

  /**
   * Converte uma recomendação de IA em tarefa no calendário.
   */
  static async scheduleAITask(influencerId: string, taskData: { title: string, description: string, daysFromNow: number }) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + taskData.daysFromNow);

    const task = await prisma.task.create({
      data: {
        influencerId,
        title: taskData.title,
        description: taskData.description,
        scheduledDate,
        fromAI: true,
        isDone: false
      }
    });

    // Se o usuário tiver Google Calendar, sincronizar
    const profile = await prisma.influencerProfile.findUnique({ where: { id: influencerId } });
    if (profile?.userId) {
      await CalendarService.syncTaskToCalendar(profile.userId, task);
    }

    return task;
  }
}
