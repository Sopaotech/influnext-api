import axios from 'axios';

export class TikTokService {
  private static readonly TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

  /**
   * Renova um token de acesso expirado do TikTok usando o refreshToken.
   */
  static async refreshAccessToken(refreshToken: string) {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      throw new Error('Chaves da API do TikTok não configuradas no .env');
    }

    try {
      const res = await axios.post(
        this.TOKEN_URL,
        new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, expires_in, refresh_token, open_id } = res.data;

      if (!access_token) {
        throw new Error(res.data.error_description || 'Erro desconhecido ao renovar token do TikTok');
      }

      return {
        accessToken: access_token,
        expiresIn: expires_in || 86400,
        refreshToken: refresh_token || refreshToken, // se não retornar um novo, mantém o atual
        openId: open_id
      };
    } catch (error: any) {
      console.error('[TIKTOK SERVICE] Erro ao renovar token:', error.response?.data || error.message);
      throw new Error('Falha ao renovar token do TikTok');
    }
  }
}
