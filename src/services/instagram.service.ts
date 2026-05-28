import axios from 'axios';
import { prisma } from '../lib/prisma';

export class InstagramService {
  private static readonly API_URL = 'https://graph.instagram.com';
  
  /**
   * Obtém um token de acesso de longa duração trocando um código de curta duração.
   */
  static async exchangeCodeForToken(code: string, redirectUri: string) {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Chaves da API do Instagram não configuradas no .env');
    }

    try {
      // Passo 1: Trocar código pelo Token curto (Facebook Oauth Endpoint)
      const form = new URLSearchParams();
      form.append('client_id', clientId);
      form.append('client_secret', clientSecret);
      form.append('grant_type', 'authorization_code');
      form.append('redirect_uri', redirectUri);
      form.append('code', code);

      const shortRes = await axios.post('https://api.instagram.com/oauth/access_token', form);
      const shortToken = shortRes.data.access_token;
      const userId = shortRes.data.user_id;

      // Passo 2: Trocar Token Curto por Token Longo (60 dias)
      const longRes = await axios.get(`${this.API_URL}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token: shortToken
        }
      });

      return {
        accessToken: longRes.data.access_token,
        expiresIn: longRes.data.expires_in,
        platformId: userId.toString()
      };
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao trocar token:', error.response?.data || error.message);
      throw new Error('Falha na autenticação com Instagram');
    }
  }

  /**
   * Puxa informações básicas e insights de um perfil usando um Token Longo.
   */
  static async fetchProfileData(accessToken: string) {
    try {
      // Usando fields do Instagram Basic Display / Graph API
      const res = await axios.get(`${this.API_URL}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });
      
      return res.data;
    } catch (error: any) {
      console.error('[INSTAGRAM SERVICE] Erro ao buscar perfil:', error.response?.data || error.message);
      throw new Error('Falha ao obter dados do perfil do Instagram');
    }
  }
}
