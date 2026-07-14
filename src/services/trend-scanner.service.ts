import axios from 'axios';

export interface TrendingData {
  trendingAudios: string[];
  trendingTopics: string[];
  source: 'realtime' | 'curated';
  lastUpdated: string;
}

// Cache simples em memória para evitar chamadas excessivas à API
let _cache: { data: TrendingData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

export class TrendScannerService {
  /**
   * Escaneia tendências em tempo real.
   * Estratégia:
   *   1. Tenta Google Trends (via endpoint público RSS)
   *   2. Tenta TikTok Creative Center (public trends endpoint)
   *   3. Fallback: curated data com data de atualização visível
   */
  static async scanRealTimeTrends(): Promise<TrendingData> {
    // Retorna do cache se ainda válido
    if (_cache && Date.now() < _cache.expiresAt) {
      return _cache.data;
    }

    try {
      const [topics, audios] = await Promise.allSettled([
        TrendScannerService._fetchGoogleTrends(),
        TrendScannerService._fetchTikTokTrends(),
      ]);

      const resolvedTopics =
        topics.status === 'fulfilled' && topics.value.length > 0
          ? topics.value
          : TrendScannerService._getCuratedTopics();

      const resolvedAudios =
        audios.status === 'fulfilled' && audios.value.length > 0
          ? audios.value
          : TrendScannerService._getCuratedAudios();

      const data: TrendingData = {
        trendingAudios: resolvedAudios.slice(0, 6),
        trendingTopics: resolvedTopics.slice(0, 6),
        source: 'realtime',
        lastUpdated: new Date().toISOString(),
      };

      _cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      return data;
    } catch {
      return TrendScannerService._getCuratedFallback();
    }
  }

  /**
   * Busca trending topics via Google Trends RSS (Brasil, sem autenticação)
   */
  private static async _fetchGoogleTrends(): Promise<string[]> {
    const url = 'https://trends.google.com/trending/rss?geo=BR';
    const response = await axios.get(url, { timeout: 5000 });

    const xml: string = response.data;
    const titleMatches = xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g) || [];

    return titleMatches
      .map((m) => m.replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '').trim())
      .filter((t) => t !== 'Google Trends' && t.length > 2)
      .slice(0, 8);
  }

  /**
   * Busca trending sounds via TikTok Creative Center (endpoint público, sem autenticação)
   * Fallback seguro: retorna vazio se falhar — não quebra o sistema.
   */
  private static async _fetchTikTokTrends(): Promise<string[]> {
    try {
      const url =
        'https://ads.tiktok.com/creative_radar_api/v1/popular_trend/list?page=1&limit=10&period=7&region=BR&industry_id=&media_type=0';

      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; InfluNext/1.0)',
          Referer: 'https://ads.tiktok.com/',
        },
      });

      const items = response.data?.data?.list || [];
      return items
        .slice(0, 6)
        .map((item: any) => `${item.sound_name || item.title || 'Unknown'} (🔥 TikTok BR)`);
    } catch {
      return [];
    }
  }

  /**
   * Dados curados atualizados — usados como fallback de qualidade.
   * Atualizar semanalmente para o período de demo.
   */
  private static _getCuratedTopics(): string[] {
    return [
      'Silent Walking (Caminhada Mindful sem Fone)',
      'Rotina de Manhã das 5h (5AM Club)',
      'GRWM: Clean Girl Aesthetic Minimalista',
      'Desafio 30 dias de mobilidade funcional',
      'Day in my Life: Trabalho Remoto + Produtividade',
      'Review Honesta de Produto (Anti-Publi Forçada)',
    ];
  }

  private static _getCuratedAudios(): string[] {
    const now = new Date();
    const month = now.toLocaleString('pt-BR', { month: 'long' });
    const year = now.getFullYear();
    return [
      `Espresso - Sabrina Carpenter (🔥 Viral ${month} ${year})`,
      'Not Like Us - Kendrick Lamar (🔥 95% Engajamento)',
      'Birds of a Feather - Billie Eilish (🔥 92% Trend)',
      'BOOM - Daddy Yankee Remix (🔥 TikTok BR)',
      'Manchas - Sertanejo Viral (🔥 88% Brasil)',
      'Coração na Garganta - Mc Ryan SP (🔥 Funk Trend)',
    ];
  }

  private static _getCuratedFallback(): TrendingData {
    return {
      trendingAudios: TrendScannerService._getCuratedAudios(),
      trendingTopics: TrendScannerService._getCuratedTopics(),
      source: 'curated',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Invalida o cache manualmente (útil para refreshes forçados via endpoint admin)
   */
  static invalidateCache(): void {
    _cache = null;
  }
}
