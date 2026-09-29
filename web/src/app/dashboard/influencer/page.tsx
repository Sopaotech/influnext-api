"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Share2, 
  Flame, 
  DollarSign, 
  Building2, 
  Zap, 
  Mic, 
  ExternalLink, 
  Lock, 
  Eye, 
  Trophy, 
  ArrowUpRight, 
  BarChart3, 
  Check, 
  Radio, 
  MousePointerClick, 
  Activity, 
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { ContractLegalModal, ContractLegalData } from '@/components/ContractLegalModal';
import type { InfluencerDashboardResponse } from '@/lib/api';
import { formatAvailableCount, getInstagramNoDataMessage, hasPersistedScore, NO_DATA_LABEL } from '@/lib/creator-dashboard-truth';

interface Task {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  scheduledDate: string;
  rewardXP?: number;
  contractValue?: number;
}

interface RateCardItem {
  price: number;
  serviceName: string;
  description?: string;
}

interface ContractSummary extends ContractLegalData {
  company?: { companyName: string; user?: { email?: string } };
}

interface InfluencerDashboardData extends Partial<Omit<InfluencerDashboardResponse, 'profile' | 'kpis'>> {
  profile?: {
    id?: string;
    handle?: string;
    niche?: string;
    profileImageUrl?: string;
    influScore?: number | null;
    scoreClass?: string | null;
    dailyMission?: string;
    missionCompleted?: boolean;
    profileProgress?: number;
  };
  kpis?: {
    influScore?: number | null;
    scoreClass?: string | null;
    escrowBalance?: number | null;
    totalEarned?: number | null;
    activeContractsCount?: number;
    pendingMissionsCount?: number;
    latestFollowers?: number | null;
    latestEngagement?: number | null;
    latestReach?: number | null;
    avgViews?: number | null;
  };
  contracts?: ContractSummary[];
  tasks?: Task[];
  rateCard?: RateCardItem[];
  analysis?: { insight?: string };
}

export default function InfluencerDashboard() {
  const [data, setData] = useState<InfluencerDashboardData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  

  // Estado para a Minuta Jurídica Oficial
  const [selectedLegalContract, setSelectedLegalContract] = useState<ContractLegalData | null>(null);
  const [isSigningContract, setIsSigningContract] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, tasksRes, rateRes] = await Promise.all([
        api.get<InfluencerDashboardData>('/dashboard/influencer').catch(() => ({ data: {} })),
        api.get<Task[]>('/influencers/tasks').catch(() => ({ data: [] })),
        api.get<RateCardItem[]>('/influencers/rate-card').catch(() => ({ data: [] }))
      ]);

      const dashboardData = dashRes.data || {};

      setData({
        ...dashboardData,
        tasks: tasksRes.data.length > 0 ? tasksRes.data : dashboardData.tasks || [],
        rateCard: rateRes.data.length > 0 ? rateRes.data : dashboardData.rateCard || []
      });

      setTasks(tasksRes.data.length > 0 ? tasksRes.data : dashboardData.tasks || []);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Erro ao carregar dados do dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyMediaKit = () => {
    const handle = data?.profile?.handle;
    if (!handle) return;
    const cleanHandle = handle.replace('@', '');
    const url = `${window.location.origin}/p/${cleanHandle}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do Mídia Kit copiado!', {
      description: 'Pronto para enviar às marcas ou colar na bio do Instagram.'
    });
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isDone: !currentStatus } : t));
    try {
      await api.patch(`/influencers/tasks/${taskId}`, { isDone: !currentStatus });
      if (!currentStatus) {
        toast.success('🔥 Missão Concluída! Fogo de Sequência mantido!');
      }
    } catch {
      // Ignora se for mock
    }
  };

  const handleSignFromModal = async () => {
    if (!selectedLegalContract) return;
    setIsSigningContract(true);
    try {
      await api.post(`/contracts/${selectedLegalContract.id}/accept`);
      toast.success('Contrato assinado eletronicamente sob a MP 2.200-2/01!');
      setSelectedLegalContract(null);
      fetchDashboardData();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao assinar o contrato.');
    } finally {
      setIsSigningContract(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-white min-h-screen animate-pulse">
        <div className="h-20 bg-slate-100 rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-3xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-slate-100 rounded-3xl border border-slate-200" />
          <div className="lg:col-span-5 h-96 bg-slate-100 rounded-3xl border border-slate-200" />
        </div>
      </div>
    );
  }

  // KPIs
  const escrowBalance = data?.kpis?.escrowBalance ?? null;
  const influScore = hasPersistedScore(data?.kpis?.influScore) ? data.kpis.influScore : null;
  const scoreClass = influScore ? data?.kpis?.scoreClass : null;
  const activeContractsCount = data?.contracts?.length ?? 0;
  const creatorHandle = data?.profile?.handle ? (data.profile.handle.startsWith('@') ? data.profile.handle : `@${data.profile.handle}`) : null;

  // Propostas de contratos
  const incomingProposals = data?.contracts || [];
  // Rate cards are rendered only when returned by the API.
  const rateCards = data?.rateCard || [];

  const completedTasksCount = tasks.filter(t => t.isDone).length;
  const metricsHistory = data?.metricsHistory || [];
  const maxReach = Math.max(...metricsHistory.map((snapshot) => snapshot.reachLast30Days || 0), 0);
  const instagramNoDataMessage = getInstagramNoDataMessage(
    data?.instagramSync?.instagramConnectionStatus,
    data?.instagramSync?.instagramOperationalSyncStatus,
  );

  const activeDataset = {
    title: 'Histórico de alcance',
    description: 'Série temporal de snapshots reais disponíveis.',
    totalBadge: metricsHistory.length ? formatAvailableCount(data?.kpis?.latestReach) : NO_DATA_LABEL,
    points: metricsHistory
      .filter((snapshot) => typeof snapshot.reachLast30Days === 'number')
      .slice(0, 6)
      .reverse()
      .map((snapshot) => ({
        month: new Date(snapshot.capturedAt).toLocaleDateString('pt-BR', { month: 'short' }),
        value: snapshot.reachLast30Days || 0,
        display: formatAvailableCount(snapshot.reachLast30Days),
        heightPercent: maxReach ? Math.max(4, ((snapshot.reachLast30Days || 0) / maxReach) * 100) : 0,
        campaigns: undefined,
        isCurrent: false,
      })),
  };
  const activeHoveredData = null;

  return (
    <div className="relative w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">
      {/* Sombreamento Laranja Suave de Fundo (Ambient Light Glow) */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[1100px] h-[380px] bg-gradient-to-b from-orange-500/[0.08] via-amber-500/[0.04] to-transparent blur-[100px] rounded-full -z-0" />
      <div className="pointer-events-none absolute top-[500px] -right-24 w-[450px] h-[450px] bg-orange-400/[0.05] blur-[120px] rounded-full -z-0" />

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR WIDESCREEN - PERFIL, MÍDIA KIT & GANHOS
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-10 p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Perfil do Criador */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-2xl">
                {creatorHandle.replace('@', '').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                {creatorHandle}
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Painel de Performance Financeira, Missões Neurais e Governança de Contratos SafePay.
            </p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-3.5 self-start xl:self-auto flex-wrap">
          <button
            onClick={handleCopyMediaKit}
            className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
          >
            <Share2 className="w-4 h-4 text-orange-600" />
            Copiar Mídia Kit Público
          </button>

          <Link href="/dashboard/influencer/wallet">
            <button className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Sacar Pix Instantâneo
            </button>
          </Link>
        </div>

      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. OS 4 CARDS DE KPIS COM VERDE DE LUCRO & CAMPANHAS ATIVAS
      ══════════════════════════════════════════════════════════════════════ */}
      {instagramNoDataMessage && <p className="relative z-10 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{instagramNoDataMessage}</p>}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card 1: Saldo sob Custódia SafePay */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Valor atual
            </div>
          </div>
          
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Saldo sob Custódia SafePay
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {escrowBalance == null ? NO_DATA_LABEL : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(escrowBalance)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-slate-400" /> Saldo calculado a partir de contratos ativos
            </span>
            <Link 
              href="/dashboard/influencer/wallet" 
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-sm shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1 hover:shadow-orange-500/30"
            >
              Sacar Pix <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: InfluScore de Autoridade */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Pontuação persistida
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              InfluScore de Autoridade
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 tracking-tight">{influScore ?? NO_DATA_LABEL}</span>
              {scoreClass && <span className="text-xs font-bold text-amber-600">Nível {scoreClass}</span>}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Pontuação registrada</span>
              <span className="text-slate-700 font-black">{influScore == null ? NO_DATA_LABEL : `${influScore}/1000 pts`}</span>
            </div>
            {influScore != null && <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full" style={{ width: `${Math.min(100, (influScore / 1000) * 100)}%` }} />
            </div>}
          </div>
        </div>

        {/* Card 3 (REFORMULADO): Campanhas Ativas & Em Andamento */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {activeContractsCount} Em Andamento
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Campanhas Ativas no Momento
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {activeContractsCount} <span className="text-sm font-bold text-slate-400">Projetos</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              Dados de contratos ativos
            </span>
            <Link 
              href="/dashboard/contracts" 
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white border border-orange-200 shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              Ver Campanhas <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 4: Visitas ao Mídia Kit & Match */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Sem dados de visualizações
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Visualizações do Mídia Kit
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {NO_DATA_LABEL}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{incomingProposals.length} propostas</span>
            <button 
              onClick={handleCopyMediaKit} 
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              Compartilhar <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. SEÇÃO PRINCIPAL WIDESCREEN: MISSÕES & OPORTUNIDADES COM VERDE
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda (7 cols): Missões Diárias & Cronograma de Entregáveis */}
        <div className="xl:col-span-7 p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-black text-slate-950">
                  Missões Diárias & Entregáveis de Campanhas
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Cumpra as tarefas dentro do prazo para manter sua sequência e receber o SafePay.
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" /> {completedTasksCount}/{tasks.length} Concluídas
            </span>
          </div>

          {/* Lista de Missões */}
          <div className="space-y-3.5">
            {tasks.map(task => (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id, task.isDone)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  task.isDone
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                  <div className={`transition-colors shrink-0 mt-0.5 sm:mt-0 ${
                    task.isDone ? 'text-emerald-600' : 'text-slate-300 group-hover:text-orange-500'
                  }`}>
                    {task.isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </div>
                  <div className="truncate text-left space-y-0.5">
                    <p className={`font-black text-sm truncate ${
                      task.isDone ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 font-medium truncate">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* Tags de Recompensa */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {task.contractValue && task.contractValue > 0 ? (
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.contractValue)}
                    </span>
                  ) : null}
                  <span className="text-[11px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-xl border border-orange-200 flex items-center gap-1">
                    {task.rewardXP != null && <><Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> +{task.rewardXP} XP</>}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Coluna Direita (5 cols): Propostas de Marcas & IA Career Manager */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Propostas de Marcas Recebidas */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Propostas de Marcas
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Contratos e propostas registrados na plataforma.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200">
                {incomingProposals.length} Registros
              </span>
            </div>

            <div className="space-y-4">
              {incomingProposals.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Ainda não há contratos ou propostas.</p>}
              {incomingProposals.map(contract => (
                <div 
                  key={contract.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-orange-300 hover:shadow-md transition-all space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                        {contract.company?.companyName?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
                          {contract.company?.companyName || 'Empresa não identificada'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {contract.title}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Valor do contrato</span>
                      <span className="text-base font-black text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.netAmount ?? contract.budget)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> SafePay Escrow
                    </span>

                    <button 
                      onClick={() => setSelectedLegalContract(contract as unknown as ContractLegalData)}
                      className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver Minuta & Assinar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Career Manager */}
          <div className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-white border border-orange-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block">
                    Conselheiro Neural
                  </span>
                  <h4 className="text-sm font-black text-slate-900">
                    InfluIA Estratégica
                  </h4>
                </div>
              </div>
              <Link href="/dashboard/workspace">
                <span className="text-xs font-black text-orange-600 hover:underline flex items-center gap-1">
                  Abrir Chat <ExternalLink className="w-3 h-3" />
                </span>
              </Link>
            </div>

            <p className="text-xs leading-relaxed text-slate-700 font-medium italic">
              {data?.analysis?.insight || 'Nenhuma análise disponível no momento.'}
            </p>
          </div>

        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. GRÁFICO INTERATIVO PRO ANALYTICS (ÁREA DE ALTA PERFORMANCE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-10 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-8">
        
        {/* Header do Gráfico com Filtros Interativos */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black text-slate-950">
                {activeDataset.title}
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {activeDataset.description}
            </p>
          </div>

        </div>

        {/* Top Summary Bar do Gráfico */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-orange-50/40 to-transparent border border-emerald-200/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 font-black text-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Acumulado no Período</span>
              <div className="text-2xl font-black text-slate-950">{activeDataset.totalBadge}</div>
            </div>
          </div>

        </div>

        {/* Visual do Gráfico Interativo com Barras & Curva SVG */}
          {activeDataset.points.length === 0 && <p className="py-16 text-center text-sm text-slate-500">Ainda não há histórico suficiente.</p>}
          <div className="relative pt-8 pb-4">
          
          {/* Eixo de Grid Horizontal */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-slate-200 w-full" />
          </div>

          {/* Gráfico de Colunas Interativas com Tooltips no Hover */}
          <div className="relative grid grid-cols-6 gap-3 md:gap-8 items-end h-64 z-10">
            {activeDataset.points.map((pt, idx) => {
              const isHovered = false;
              const isCurrent = pt.isCurrent;

              return (
                <div 
                  key={idx}
                  className="flex flex-col items-center gap-3 h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip Dinâmico */}
                  <div className={`transition-all duration-300 text-center ${
                    isHovered ? 'scale-110 -translate-y-1' : 'opacity-80'
                  }`}>
                    <span className="text-[11px] md:text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-md block whitespace-nowrap">
                      {pt.display}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-0.5">
                      Alcance registrado
                    </span>
                  </div>

                  {/* Barra com Gradiente e Efeito Glow */}
                  <div 
                    className={`w-full max-w-[64px] rounded-2xl transition-all duration-500 group-hover:scale-105 relative overflow-hidden ${
                      isCurrent
                        ? 'bg-gradient-to-t from-orange-600 via-amber-500 to-orange-400 shadow-xl shadow-orange-500/30'
                        : isHovered
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-lg shadow-emerald-500/20'
                        : 'bg-gradient-to-t from-emerald-500/80 to-emerald-400/60'
                    }`}
                    style={{ height: `${pt.heightPercent}%` }}
                  >
                    {/* Brilho interno */}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Rótulo do Mês */}
                  <span className={`text-xs font-black uppercase tracking-wider transition-colors ${
                    isCurrent ? 'text-orange-600' : isHovered ? 'text-slate-950 font-black' : 'text-slate-500'
                  }`}>
                    {pt.month}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. VITRINE DE PACOTES DE PREÇOS (RATE CARD PACKAGES)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-950">
                Tabela de Preços & Pacotes de Publicidade (Rate Card)
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Valores oficiais que as marcas visualizam e contratam diretamente no seu Mídia Kit.
            </p>
          </div>

          <Link href="/dashboard/settings">
            <button className="px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all active:scale-95">
              Editar Pacotes →
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {rateCards.map((rate, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-[2rem] border border-slate-200 bg-slate-50/60 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">Valor Oficial</span>
                  <span className="text-lg font-black text-slate-950">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rate.price)}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {rate.serviceName}
              </h4>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {rate.description}
              </p>

            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. MODAL DA MINUTA JURÍDICA OFICIAL & ASSINATURA ELETRÔNICA
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedLegalContract && (
        <ContractLegalModal
          isOpen={!!selectedLegalContract}
          onClose={() => setSelectedLegalContract(null)}
          contract={selectedLegalContract}
          canSign={selectedLegalContract.escrowStatus === 'DRAFT'}
          onSign={handleSignFromModal}
          isSigning={isSigningContract}
        />
      )}

    </div>
  );
}
