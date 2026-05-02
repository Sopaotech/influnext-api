import { prisma } from '../lib/prisma';

const POSSIBLE_MISSIONS = [
  "Postar 1 Story de bastidores",
  "Comentar em 5 posts do seu nicho",
  "Analisar 1 trend no Workspace",
  "Atualizar o Media Kit",
  "Responder 3 direct messages pendentes",
  "Planejar 1 Reels de alto impacto",
  "Verificar métricas de alcance semanal",
  "Interagir com um seguidor fiel",
  "Estudar 1 referência do Trend Vault",
  "Gravar um gancho matador para seu vídeo"
];

export class MissionService {
  /**
   * Atribui uma nova missão diária se necessário
   */
  static async assignDailyMission(influencerId: string) {
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId }
    });

    if (!influencer) return null;

    const now = new Date();
    const lastUpdate = influencer.lastMissionUpdate ? new Date(influencer.lastMissionUpdate) : new Date(0);
    
    // Se passaram mais de 24h ou nunca teve missão
    const isMoreThan24h = now.getTime() - lastUpdate.getTime() > 24 * 60 * 60 * 1000;

    if (isMoreThan24h || !influencer.dailyMission) {
      const randomIndex = Math.floor(Math.random() * POSSIBLE_MISSIONS.length);
      const newMission = POSSIBLE_MISSIONS[randomIndex];

      return await prisma.influencerProfile.update({
        where: { id: influencerId },
        data: {
          dailyMission: newMission,
          missionCompleted: false,
          lastMissionUpdate: now
        }
      });
    }

    return influencer;
  }

  /**
   * Marca a missão como concluída e bonifica o InfluScore
   */
  static async completeMission(influencerId: string) {
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId }
    });

    if (!influencer || influencer.missionCompleted) return influencer;

    return await prisma.influencerProfile.update({
      where: { id: influencerId },
      data: {
        missionCompleted: true,
        influScore: { increment: 5 }
      }
    });
  }
}
