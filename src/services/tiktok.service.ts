import axios from 'axios';
import { prisma } from '../lib/prisma';

export class TiktokService {
  private static readonly API_URL = 'https://open.tiktokapis.com/v2';
  
  /**
   * Obtém um token de acesso de longa duração trocando um código de autorização.
   */
  static async exchangeCodeForToken(code: string, redirectUri: string) {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      throw new Error('Chaves da API do TikTok não configuradas no .env');
    }

    try {
      const form = new URLSearchParams();
      form.append('client_key', clientKey);
      form.append('client_secret', clientSecret);
      form.append('grant_type', 'authorization_code');
      form.append('code', code);
      form.append('redirect_uri', redirectUri);

      const res = await axios.post(`${this.API_URL}/oauth/token/`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return {
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
        expiresIn: res.data.expires_in,
        platformId: res.data.open_id
      };
    } catch (error: any) {
      console.error('[TIKTOK SERVICE] Erro ao trocar token:', error.response?.data || error.message);
      throw new Error('Falha na autenticação com TikTok');
    }
  }

  /**
   * Puxa informações básicas e métricas do perfil.
   */
  static async fetchProfileData(accessToken: string) {
    try {
      const res = await axios.get(`${this.API_URL}/user/info/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          fields: 'open_id,display_name,avatar_url,follower_count'
        }
      });
      
      return res.data.data.user;
    } catch (error: any) {
      console.error('[TIKTOK SERVICE] Erro ao buscar perfil:', error.response?.data || error.message);
      throw new Error('Falha ao obter dados do perfil do TikTok');
    }
  }
}
