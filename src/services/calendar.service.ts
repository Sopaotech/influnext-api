import { google } from 'googleapis';
import { prisma } from '../lib/prisma';

export class CalendarService {
  /**
   * Sincroniza uma tarefa com o Google Calendar do usuário.
   */
  static async syncTaskToCalendar(userId: string, task: { title: string, description: string | null, scheduledDate: Date | null }) {
    try {
      if (!task.scheduledDate) return;

      // Buscar tokens do Google (assumindo que salvamos na tabela SocialPlatform com platformName "GOOGLE")
      const googlePlatform = await prisma.socialPlatform.findUnique({
        where: { 
          influencerId_platformName: {
            influencerId: await this.getInfluencerId(userId),
            platformName: 'GOOGLE'
          }
        }
      });

      if (!googlePlatform || !googlePlatform.accessToken) {
        console.log(`[CALENDAR] Usuário ${userId} não tem Google conectado.`);
        return;
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: googlePlatform.accessToken,
        refresh_token: googlePlatform.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: `InfluNext: ${task.title}`,
        description: task.description || 'Tarefa gerada pelo InfluNext AI',
        start: {
          dateTime: task.scheduledDate.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: new Date(task.scheduledDate.getTime() + 60 * 60 * 1000).toISOString(), // +1h
          timeZone: 'America/Sao_Paulo',
        },
      };

      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      console.log(`[CALENDAR] Evento criado: ${task.title}`);
    } catch (error) {
      console.error('[CALENDAR] Erro ao sincronizar:', error);
    }
  }

  private static async getInfluencerId(userId: string): Promise<string> {
    const profile = await prisma.influencerProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Perfil não encontrado.");
    return profile.id;
  }
}
