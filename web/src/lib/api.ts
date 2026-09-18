import axios from 'axios';
import { clearBrowserAuthState } from './auth-browser';

// Centralização da URL da API com Auto-Detecção
const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
let baseApiUrl = envApiUrl;

if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '10.0.2.2';
  
  if (!isLocalhost) {
    // Se não for localhost (ex: cloudflare pages preview, etc), usa a API de produção
    baseApiUrl = envApiUrl || 'https://api.influnext.com.br/v1';
  } else if (!baseApiUrl) {
    // Se for local e não houver env, usa o padrão local correspondente ao host (se for emulador Android usa 10.0.2.2)
    baseApiUrl = hostname === '10.0.2.2' ? 'http://10.0.2.2:4000/v1' : 'http://localhost:4000/v1';
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
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The browser session is an HttpOnly cookie sent automatically by Axios.
api.interceptors.request.use((config) => {
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
      console.error(`❌ [401 UNAUTHORIZED]: A requisição para ${error.config?.url} falhou com 401.`);
      
      clearBrowserAuthState();
      
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
  user: User;
  status?: string; // Para o fluxo de 2FA
  tempToken?: string;
}

export interface MetricSnapshot {
  followers: number;
  engagementRate: number;
  reachLast30Days: number;
  avgViews: number;
  capturedAt?: string;
  integrityHash?: string;
}

export type InstagramFreshnessStatus =
  | 'fresh'
  | 'stale'
  | 'unavailable'
  | 'pending'
  | 'syncing'
  | 'retry_scheduled'
  | 'reconnect_required';

export type InstagramSyncAction = 'none' | 'wait' | 'retry_later' | 'reconnect' | 'connect';

export interface InstagramFreshness {
  status: InstagramFreshnessStatus;
  lastSnapshotAt: string | null;
  lastSyncSuccessAt: string | null;
  lastSyncAttemptAt: string | null;
  nextSyncRetryAt: string | null;
  isVerifiedSnapshot: boolean;
  isStale: boolean;
  staleAfterHours: number;
  collectionWindowDays: number | null;
  sampleSize: number | null;
  metricsSource: 'instagram_api_snapshot' | 'unavailable';
  syncAction: InstagramSyncAction;
  syncMessageKey: string;
}

export interface InstagramSync {
  instagramConnectionStatus: 'connected' | 'not_connected';
  instagramSyncStatus: 'connected_with_snapshot' | 'connected_without_snapshot' | 'not_connected';
  instagramOperationalSyncStatus:
    | 'not_connected'
    | 'never_synced'
    | 'sync_pending'
    | 'syncing'
    | 'synced'
    | 'partial'
    | 'no_recent_media'
    | 'failed_retryable'
    | 'failed_reconnect_required'
    | 'disabled';
  hasVerifiedSnapshot: boolean;
  lastSnapshotAt: string | null;
  lastSyncAttemptAt: string | null;
  lastSyncSuccessAt: string | null;
  lastSyncFailureAt: string | null;
  syncFailureCount: number;
  nextSyncRetryAt: string | null;
  metricsSource: 'snapshot' | 'unavailable';
  syncWarning: string | null;
}

export interface InstagramMetricCollection {
  scope: 'recent_media_sample_30d' | 'unknown' | 'unavailable';
  isPartial: boolean | null;
  sampledMediaCount: number | null;
  unavailableInsightCount: number | null;
  reachDefinition: string | null;
  warning: string | null;
}

export interface InstagramDataContracts {
  instagramFreshness: InstagramFreshness;
  instagramSync: InstagramSync;
  instagramMetricCollection: InstagramMetricCollection;
}

export interface InfluencerDashboardResponse extends InstagramDataContracts {
  profile: {
    id: string;
    handle: string;
    niche: string | null;
    profileImageUrl: string | null;
    influScore: number;
    scoreClass: string;
    verifiedMetrics: boolean;
  };
  kpis: {
    latestFollowers: number | null;
    latestEngagement: number | null;
    latestReach: number;
    avgViews: number;
  };
  metricsHistory: MetricSnapshot[];
}

export interface PublicProfileResponse extends InstagramDataContracts {
  id: string;
  handle: string;
  profileImageUrl: string | null;
  influScore: number;
  scoreClass: string;
  verifiedMetrics: boolean;
  niche: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  rateCards: Array<{
    id: string;
    serviceName: string;
    price: number;
    description: string | null;
  }>;
  metricsHistory: MetricSnapshot[];
  platforms: Array<{
    platformName: string;
    platformId: string;
  }>;
  avgROI: number;
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
    influencerId: string;
    influencer: { handle: string; metricsHistory?: MetricSnapshot[] };
  }>;
  recommendedTalents?: Array<{
    id: string;
    handle: string;
    niche: string;
    influScore: number;
    scoreClass: string;
    growth: string;
    reputation: string;
    pitch: string;
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

export interface CreateContractData {
  influencerId: string;
  title: string;
  budget: number;
  deadlineDays?: number;
  briefing: string;
  [key: string]: unknown;
}

// ─── Métodos de API ───────────────────────────────────────────────────────────

export const confirmContractPayment = (id: string) => api.post(`/contracts/${id}/pay`);
export const approveDeliverable = (id: string) => api.patch(`/deliverables/${id}/approve`);
export const rejectDeliverable = (id: string, reason: string) => api.patch(`/deliverables/${id}/reject`, { reason });
export const searchInfluencers = (q: string) => {
  const cleanQ = q.startsWith('@') ? q.slice(1) : q;
  return api.get(`/influencers/search?q=${cleanQ}`);
};
export const createContract = (data: CreateContractData) => api.post('/contracts', data);
export const getAdminStats = () => api.get<GlobalStats>('/admin/stats');
export const updateContractScript = (id: string, aiScript: string) => api.patch(`/contracts/${id}/script`, { aiScript });
