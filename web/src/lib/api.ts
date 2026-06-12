import axios from 'axios';
import Cookies from 'js-cookie';

// Centralização da URL da API com Auto-Detecção
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
let baseApiUrl = envApiUrl;

if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isLocalhost) {
    // Se não for localhost (ex: cloudflare pages preview, etc), usa a API de produção
    baseApiUrl = envApiUrl || 'https://api.influnext.com.br/v1';
  } else if (!baseApiUrl) {
    // Se for local e não houver env, usa o padrão local
    baseApiUrl = 'http://localhost:4000/v1';
  }
} else if (!baseApiUrl) {
  baseApiUrl = 'http://localhost:4000/v1';
}

// Garantir que a URL termine com /v1
if (baseApiUrl && !baseApiUrl.endsWith('/v1')) {
  baseApiUrl = baseApiUrl.endsWith('/') ? `${baseApiUrl}v1` : `${baseApiUrl}/v1`;
}

const API_URL = baseApiUrl;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar o Token em todas as requisições
api.interceptors.request.use((config) => {
  const token = Cookies.get('influnext_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros e logs de diagnóstico
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Diagnóstico de erro de rede (Ex: API fora do ar, CORS, DNS)
    if (!error.response) {
      console.error('❌ [NETWORK ERROR]: Nenhuma resposta do servidor.');
      console.error('Verifique:', {
        url: error.config?.url,
        method: error.config?.method,
        baseUrl: error.config?.baseURL,
        shield: 'Se estiver usando Brave, desative o Shield para testar.',
        cors: 'Verifique se o domínio do front está no ALLOWED_ORIGINS do backend.'
      });
    }

    if (error.response?.status === 401) {
      Cookies.remove('influnext_token');
      Cookies.remove('influnext_role');
      
      // Evitar loop infinito se já estivermos na página de login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Interfaces de Dados ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: 'INFLUENCER' | 'COMPANY' | 'ADMIN';
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  status?: string; // Para o fluxo de 2FA
  tempToken?: string;
}

export interface MetricSnapshot {
  followers: number;
  engagementRate: number;
  reachLast30Days: number;
  avgViews: number;
}

export interface DashboardData {
  id: string;
  userId: string;
  handle: string;
  influScore: number;
  scoreClass: string;
  metricsHistory: MetricSnapshot[];
  tasks: Array<{ id: string; title: string; dueDate: string }>;
  contracts: Array<{ id: string; title: string; budget: number; escrowStatus: string }>;
}

export interface CompanyDashboardResponse {
  stats: {
    totalInvested: number;
    activeContracts: number;
    pendingReviews: number;
  };
  contracts: Array<{
    id: string;
    title: string;
    budget: number;
    escrowStatus: string;
    influencer: { handle: string };
  }>;
}

export interface GlobalStats {
  gmv: number;
  totalUsers: number;
  activeContracts: number;
  pendingDisputes: number;
  totalContracts: number;
}

export interface InfluencerSearchItem {
  id: string;
  handle: string;
  verifiedMetrics: boolean;
  niche?: string;
  influScore?: number;
}

// ─── Métodos de API ───────────────────────────────────────────────────────────

export const confirmContractPayment = (id: string) => api.post(`/contracts/${id}/pay`);
export const approveDeliverable = (id: string) => api.patch(`/deliverables/${id}/approve`);
export const rejectDeliverable = (id: string, reason: string) => api.patch(`/deliverables/${id}/reject`, { reason });
export const searchInfluencers = (q: string) => {
  const cleanQ = q.startsWith('@') ? q.slice(1) : q;
  return api.get(`/influencers/search?q=${cleanQ}`);
};
export const createContract = (data: any) => api.post('/contracts', data);
export const getAdminStats = () => api.get<GlobalStats>('/admin/stats');
export const updateContractScript = (id: string, aiScript: string) => api.patch(`/contracts/${id}/script`, { aiScript });
