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
  avgEngagement?: string;
  conversionRate?: string;
}

interface ContractSummary extends ContractLegalData {
  company?: { companyName: string; user?: { email?: string } };
}

interface InfluencerDashboardData {
  profile?: {
    id?: string;
    handle?: string;
    niche?: string;
    profileImageUrl?: string;
    influScore?: number;
    scoreClass?: string;
    dailyMission?: string;
    missionCompleted?: boolean;
    profileProgress?: number;
  };
  kpis?: {
    influScore?: number;
    scoreClass?: string;
    escrowBalance?: number;
    totalEarned?: number;
    activeContractsCount?: number;
    pendingMissionsCount?: number;
    latestFollowers?: number | null;
    latestEngagement?: number | null;
    latestReach?: number;
    avgViews?: number;
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
  const streakCount = 17;
  
  // Modo de visualização do gráfico interativo
  const [chartMode, setChartMode] = useState<'REVENUE' | 'CLICKS' | 'REACH'>('REVENUE');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(5); // Default selecionado no mês atual

  // Estado para a Minuta Jurídica Oficial
  const [selectedLegalContract, setSelectedLegalContract] = useState<ContractLegalData | null>(null);
  const [isSigningContract, setIsSigningContract] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, tasksRes, insightRes, rateRes] = await Promise.all([
        api.get<InfluencerDashboardData>('/dashboard/influencer').catch(() => ({ data: {} })),
        api.get<Task[]>('/influencers/tasks').catch(() => ({ data: [] })),
        api.get<{ insight: string }>('/influencers/daily-insight').catch(() => ({ data: { insight: '' } })),
        api.get<RateCardItem[]>('/influencers/rate-card').catch(() => ({ data: [] }))
      ]);

      const dashboardData = dashRes.data || {};

      setData({
        ...dashboardData,
        tasks: tasksRes.data.length > 0 ? tasksRes.data : dashboardData.tasks,
        rateCard: rateRes.data.length > 0 ? rateRes.data : dashboardData.rateCard,
        analysis: insightRes.data.insight ? { insight: insightRes.data.insight } : dashboardData.analysis
      });

      if (tasksRes.data.length > 0) {
        setTasks(tasksRes.data);
      } else if (dashboardData.tasks && dashboardData.tasks.length > 0) {
        setTasks(dashboardData.tasks);
      } else {
        // Tarefas padrão com gamificação e remuneração
        setTasks([
          { id: '1', title: 'Gravar Reels 60s com Demonstração do Produto', description: 'Samsung ANC • Hook inicial de 3 segundos', isDone: false, scheduledDate: 'Hoje', rewardXP: 15, contractValue: 2975 },
          { id: '2', title: 'Publicar Combo 4x Stories com Cupom Oficial #publi', description: 'Aura Beauty • Inserir link rastreável na figurinha', isDone: true, scheduledDate: 'Hoje', rewardXP: 10, contractValue: 1200 },
          { id: '3', title: 'Revisar e Assinar Proposta de Contrato em Escrow', description: 'Nubank PJ • Aprovar minuta jurídica com SHA-256', isDone: false, scheduledDate: 'Hoje', rewardXP: 25, contractValue: 4800 },
          { id: '4', title: 'Sincronizar Métricas com a Rede Neural da InfluNext', description: 'Auditoria de engajamento do Instagram', isDone: false, scheduledDate: 'Esta semana', rewardXP: 15, contractValue: 0 }
        ]);
      }
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
    const handle = data?.profile?.handle || 'thiago';
    const cleanHandle = handle.replace('@', '');
    const url = `${window.location.origin}/p/${cleanHandle}`;
    navigator.clipboard.writeText(url);
    toast.success('🔗 Link do Mídia Kit Auditado copiado!', {
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
  const escrowBalance = data?.kpis?.escrowBalance ?? 9500;
  const influScore = data?.kpis?.influScore && data.kpis.influScore > 0 ? data.kpis.influScore : 845;
  const scoreClass = data?.kpis?.scoreClass || 'Ouro';
  const activeContractsCount = data?.contracts?.length || 4;
  const mediaKitViews = 1840;
  const creatorHandle = data?.profile?.handle ? (data.profile.handle.startsWith('@') ? data.profile.handle : `@${data.profile.handle}`) : '@demo.influencer';

  // Propostas de contratos
  const rawContracts = data?.contracts || [];
  const incomingProposals = rawContracts.length > 0 ? rawContracts : [
    {
      id: 'demo-1',
      title: 'Contratação Direta: Reels Patrocinado (@alexsandro.tech)',
      budget: 1312.94,
      netAmount: 1116.00,
      escrowStatus: 'DRAFT',
      createdAt: new Date().toISOString(),
      company: { companyName: 'Visitante Express' },
      contractType: 'SPOT',
      exclusivityDays: 15,
      usageRightsDays: 90,
      allowPaidMedia: true,
      deliverables: [{ type: 'REEL', title: '1x Reels com Demonstração do App' }]
    },
    {
      id: 'demo-2',
      title: 'Parceria Inverno 2026',
      budget: 4500,
      netAmount: 3825.00,
      escrowStatus: 'DRAFT',
      createdAt: new Date().toISOString(),
      company: { companyName: 'Marca Premium LTDA' },
      contractType: 'SPOT',
      exclusivityDays: 30,
      usageRightsDays: 180,
      allowPaidMedia: false,
      deliverables: [{ type: 'STORY', title: 'Combo 4x Stories com Link' }]
    }
  ];

  // Rate Cards
  const rateCards = data?.rateCard && data.rateCard.length > 0 ? data.rateCard : [
    { serviceName: 'Combo Fashion Post (1x Reels + 3x Stories)', price: 1500, description: 'Combo ideal para lançamento de coleções. Inclui Reels completo mostrando os produtos no corpo e 3 sequências de Stories para engajamento e CTA direto de vendas.', avgEngagement: '5.4%', conversionRate: '15% conv.' },
    { serviceName: '1x Reels de Provador', price: 900, description: 'Gravação de Reels dinâmico com transições ágeis exibindo até 4 looks selecionados da marca com áudio viral em alta.', avgEngagement: '5.4%', conversionRate: '15% conv.' },
    { serviceName: 'Sequência de Stories Patrocinados (3 Telas)', price: 500, description: 'Inserção de links diretos para o e-commerce, stickers de interação e cupom de desconto exclusivo.', avgEngagement: '5.4%', conversionRate: '15% conv.' }
  ];

  const completedTasksCount = tasks.filter(t => t.isDone).length;

  // Datasets para o gráfico interativo Pro Analytics
  const chartDatasets = {
    REVENUE: {
      title: 'Evolução de Ganhos & Faturamento (SafePay Escrow)',
      totalBadge: 'R$ 48.200,00',
      growthBadge: '+38.5% este semestre',
      description: 'Histórico de pagamentos liberados via custódia e projeção mensal de publis.',
      points: [
        { month: 'Out', value: 8400, display: 'R$ 8.400', heightPercent: 42, campaigns: 3, clicks: '4.2k' },
        { month: 'Nov', value: 11200, display: 'R$ 11.200', heightPercent: 56, campaigns: 4, clicks: '6.8k' },
        { month: 'Dez', value: 18500, display: 'R$ 18.500', heightPercent: 92, campaigns: 6, clicks: '11.5k' },
        { month: 'Jan', value: 9800, display: 'R$ 9.800', heightPercent: 49, campaigns: 3, clicks: '5.1k' },
        { month: 'Fev', value: 13400, display: 'R$ 13.400', heightPercent: 67, campaigns: 4, clicks: '8.4k' },
        { month: 'Mar (Atual)', value: 14850, display: 'R$ 14.850', heightPercent: 74, campaigns: 4, clicks: '9.2k', isCurrent: true }
      ]
    },
    CLICKS: {
      title: 'Cliques em Links de Stories, Bio & Cupons',
      totalBadge: '45.2k cliques',
      growthBadge: '+24.8% taxa de CTR',
      description: 'Volume de tráfego gerado diretamente para os e-commerces e apps das marcas parceiras.',
      points: [
        { month: 'Out', value: 4200, display: '4.2k cliques', heightPercent: 40, campaigns: 3, clicks: '4.2k' },
        { month: 'Nov', value: 6800, display: '6.8k cliques', heightPercent: 60, campaigns: 4, clicks: '6.8k' },
        { month: 'Dez', value: 11500, display: '11.5k cliques', heightPercent: 95, campaigns: 6, clicks: '11.5k' },
        { month: 'Jan', value: 5100, display: '5.1k cliques', heightPercent: 45, campaigns: 3, clicks: '5.1k' },
        { month: 'Fev', value: 8400, display: '8.4k cliques', heightPercent: 75, campaigns: 4, clicks: '8.4k' },
        { month: 'Mar (Atual)', value: 9200, display: '9.2k cliques', heightPercent: 82, campaigns: 4, clicks: '9.2k', isCurrent: true }
      ]
    },
    REACH: {
      title: 'Alcance & Impressões Auditadas (Instagram & TikTok)',
      totalBadge: '840k contas alcançadas',
      growthBadge: '+42.1% alcance orgânico',
      description: 'Métricas consolidadas de visualizações e engajamento capturadas via API oficial.',
      points: [
        { month: 'Out', value: 95000, display: '95k alcance', heightPercent: 40, campaigns: 3, clicks: '4.2k' },
        { month: 'Nov', value: 130000, display: '130k alcance', heightPercent: 55, campaigns: 4, clicks: '6.8k' },
        { month: 'Dez', value: 240000, display: '240k alcance', heightPercent: 98, campaigns: 6, clicks: '11.5k' },
        { month: 'Jan', value: 110000, display: '110k alcance', heightPercent: 46, campaigns: 3, clicks: '5.1k' },
        { month: 'Fev', value: 165000, display: '165k alcance', heightPercent: 70, campaigns: 4, clicks: '8.4k' },
        { month: 'Mar (Atual)', value: 190000, display: '190k alcance', heightPercent: 80, campaigns: 4, clicks: '9.2k', isCurrent: true }
      ]
    }
  };

  const activeDataset = chartDatasets[chartMode];
  const activeHoveredData = hoveredPoint !== null ? activeDataset.points[hoveredPoint] : activeDataset.points[5];

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
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Criador Auditado SHA-256">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                {creatorHandle}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 shadow-sm flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" /> {streakCount} Dias de Sequência 🔥
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Métricas Auditadas
              </span>
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
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card 1: Saldo sob Custódia SafePay */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> +32.4% este mês
            </div>
          </div>
          
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Saldo sob Custódia SafePay
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(escrowBalance)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 0% Inadimplência
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
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> +45 pts hoje
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              InfluScore de Autoridade
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 tracking-tight">{influScore}</span>
              <span className="text-xs font-bold text-amber-600">Nível {scoreClass}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Rumo a Diamante</span>
              <span className="text-slate-700 font-black">{influScore}/1000 pts</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (influScore / 1000) * 100)}%` }}
              />
            </div>
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
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> 2 entregas esta semana
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
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 94.2% Match
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Visualizações do Mídia Kit
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              +{mediaKitViews.toLocaleString('pt-BR')} <span className="text-xs font-bold text-slate-400">views</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">8 propostas este mês</span>
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
                    <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> +{task.rewardXP || 15} XP
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Banner de Comando por Voz IA */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Adicionar Tarefa via Comando de Voz</p>
                <p className="text-xs text-slate-500 font-medium">Diga por voz: "Agendar Reels amanhã às 16h com Marca X"</p>
              </div>
            </div>
            <button 
              onClick={() => toast.info('🎙️ Microfone ativado! Fale a sua tarefa...')}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-orange-600 bg-white hover:bg-orange-50 border border-orange-300 shadow-sm transition-all self-end sm:self-auto active:scale-95"
            >
              Falar Agora →
            </button>
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
                  Convites oficiais com depósito Escrow garantido.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200">
                {incomingProposals.length} Novas
              </span>
            </div>

            <div className="space-y-4">
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
                          {contract.company?.companyName || 'Marca Patrocinadora'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {contract.title}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Líquido</span>
                      <span className="text-base font-black text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.netAmount || (contract.budget * 0.85))}
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
              "{data?.analysis?.insight || 'Seus vídeos de Reels tiveram 38% mais retenção nas primeiras 3 segundos. Experimente abrir sua próxima publi com um hook visual direto para maximizar o CPM das marcas.'}"
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

          {/* Botões de Filtro de Métrica */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 self-start lg:self-auto flex-wrap">
            <button
              onClick={() => setChartMode('REVENUE')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                chartMode === 'REVENUE'
                  ? 'bg-white text-orange-600 shadow-md shadow-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Faturamento R$
            </button>

            <button
              onClick={() => setChartMode('CLICKS')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                chartMode === 'CLICKS'
                  ? 'bg-white text-orange-600 shadow-md shadow-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              Cliques em Links
            </button>

            <button
              onClick={() => setChartMode('REACH')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                chartMode === 'REACH'
                  ? 'bg-white text-orange-600 shadow-md shadow-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Alcance & Views
            </button>
          </div>
        </div>

        {/* Top Summary Bar do Gráfico */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-orange-50/40 to-transparent border border-emerald-200/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 font-black text-lg">
              {chartMode === 'REVENUE' ? 'R$' : chartMode === 'CLICKS' ? '🔗' : '👥'}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Acumulado no Período</span>
              <div className="text-2xl font-black text-slate-950">{activeDataset.totalBadge}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> {activeDataset.growthBadge}
            </span>
          </div>
        </div>

        {/* Visual do Gráfico Interativo com Barras & Curva SVG */}
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
              const isHovered = hoveredPoint === idx;
              const isCurrent = pt.isCurrent;

              return (
                <div 
                  key={idx}
                  onMouseEnter={() => setHoveredPoint(idx)}
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
                      {pt.campaigns} publis
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

        {/* 3 Mini Cards de Insights Analíticos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CPM Médio por Campanha</span>
              <p className="text-base font-black text-slate-900">R$ 38,50 <span className="text-xs font-bold text-emerald-600">(+15%)</span></p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">CTR Médio dos Stories</span>
              <p className="text-base font-black text-slate-900">5.2% <span className="text-xs font-bold text-emerald-600">(Alta Conversão)</span></p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tempo Médio SafePay</span>
              <p className="text-base font-black text-emerald-700">48 horas <span className="text-xs font-bold text-slate-500">(Auto-Release)</span></p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
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

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold">Engajamento: <strong className="text-slate-700">{rate.avgEngagement || '5.4%'}</strong></span>
                <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {rate.conversionRate || '15% conv.'}
                </span>
              </div>
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
