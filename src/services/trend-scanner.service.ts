export interface TrendingData {
  trendingAudios: string[];
  trendingTopics: string[];
}

export class TrendScannerService {
  /**
   * Simula o escaneamento de tendências em tempo real de plataformas como TikTok, Instagram e Spotify.
   * No futuro, isso pode se conectar a APIs como Apify ou TikAPI.
   */
  static async scanRealTimeTrends(): Promise<TrendingData> {
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      trendingAudios: [
        "Espresso - Sabrina Carpenter (🔥 98%)",
        "Million Dollar Baby - Tommy Richman (🔥 95%)",
        "Not Like Us - Kendrick Lamar (🔥 92%)",
        "Birds of a Feather - Billie Eilish (🔥 89%)"
      ],
      trendingTopics: [
        "Get Ready With Me Minimalista (Clean Girl Aesthetic)",
        "Dicas de produtividade 'Workaholic' (Estilo de vida focado)",
        "ASMR de unboxing de luxo",
        "Desafio de treino: 30 dias de mobilidade"
      ]
    };
  }
}
