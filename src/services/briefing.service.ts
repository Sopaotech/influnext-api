import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma';

export class BriefingService {
  static async generateSmartScript(influencerId: string, companyBriefing: string) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key ausente.");

      const influencer = await prisma.influencerProfile.findUnique({
        where: { id: influencerId },
        include: { 
          rateCards: true,
          metricsHistory: { take: 1, orderBy: { capturedAt: 'desc' } }
        }
      });

      if (!influencer) throw new Error("Influenciador não encontrado.");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const metrics = influencer.metricsHistory[0];
      
      const prompt = `Você é um Diretor de Criação de Marketing de Influência especializado em ROI.
      
      INFLUENCIADOR:
      - Handle: @${influencer.handle}
      - Nicho: ${influencer.niche}
      - Bio: ${influencer.bio || 'N/A'}
      - Engajamento: ${metrics?.engagementRate || 0}%
      
      BRIEFING DA MARCA:
      "${companyBriefing}"
      
      TAREFA:
      1. Crie um ROTEIRO (Script) otimizado para este influenciador específico.
      2. O roteiro deve ter: Gancho (Hook), Meio e Chamada para Ação (CTA).
      3. Sugira o MELHOR HORÁRIO de postagem para o público dele.
      4. Dê 2 dicas técnicas (ex: iluminação, tom de voz, edição) para garantir que a marca fique feliz com o resultado.

      Mantenha o roteiro fiel ao estilo do influenciador (use a bio dele como base).
      Responda em Markdown.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('[BRIEFING SERVICE] Erro:', error);
      return "Erro ao gerar roteiro inteligente. O influencer deve seguir as instruções básicas da marca.";
    }
  }
}
