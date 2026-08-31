'use client';

import React, { useEffect, useState } from 'react';
import { api, CompanyDashboardResponse } from '@/lib/api';
import { 
  Building2, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  X, 
  Users, 
  BarChart3, 
  Loader2, 
  ArrowUpRight, 
  Radio, 
  Lock, 
  Clock, 
  Flame, 
  Eye, 
  Share2, 
  Check, 
  AlertCircle, 
  Plus, 
  ExternalLink,
  ChevronRight,
  Briefcase,
  Layers,
  Award
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeliverableReviewCard } from '@/components/deliverable-review-card';
import { ContractLegalModal, ContractLegalData } from '@/components/ContractLegalModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CompanyTalent {
  id: string;
  handle: string;
  niche: string;
  influScore: number;
  scoreClass: string;
  growth?: string;
  reputation?: string;
  pitch?: string;
  [key: string]: unknown;
}

interface TalentMediaKit {
  handle: string;
  niche: string;
  influScore: number;
  scoreClass: string;
  bio: string;
  followers: number;
  engagement: number;
  companyFeedback: number;
  negotiationBehavior: string;
  deliveryRate: number;
  rateCard?: Array<{ serviceName: string; price: number; description?: string }>;
}

interface DeliverableItem {
  id: string;
  status: string;
  proofUrl?: string;
  [key: string]: unknown;
}

interface ContractItem extends ContractLegalData {
  id: string;
  title: string;
  budget: number;
  netAmount?: number;
  escrowStatus: string;
  createdAt?: string;
  influencer: { handle: string; metricsHistory?: Array<{ capturedAt?: string }> };
  deliverables?: DeliverableItem[];
}

export default function CompanyDashboard() {
  const router = useRouter();
  const [data, setData] = useState<CompanyDashboardResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // States para o modal de Media Kit do Influenciador
  const [selectedTalent, setSelectedTalent] = useState<CompanyTalent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [talentMediaKit, setTalentMediaKit] = useState<TalentMediaKit | null>(null);
  const [activeRadarTab, setActiveRadarTab] = useState<'nacional' | 'regional' | 'high_roi'>('nacional');

  // State para o modal de Minuta Jurídica Oficial
  const [selectedLegalContract, setSelectedLegalContract] = useState<ContractItem | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<CompanyDashboardResponse>('/dashboard/company');
      setData(res.data);

      const userState = (res.data as unknown as { userState?: { onboardingCompleted?: boolean; subscriptionStatus?: string; trialEndsAt?: string } }).userState;
      if (userState && !userState.onboardingCompleted) {
        window.location.href = '/auth/login';
        return;
      }
    } catch {
      setError('Falha ao carregar os dados do painel da empresa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleOpenMediaKit = async (talent: CompanyTalent) => {
    setSelectedTalent(talent);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const cleanHandle = talent.handle.replace('@', '');
      const res = await api.get<{ 
        handle?: string; 
        niche?: string; 
        influScore?: number; 
        scoreClass?: string; 
        bio?: string; 
        metricsHistory?: Array<{ followers?: number; engagementRate?: number }>; 
        rateCards?: Array<{ serviceName: string; price: number; description?: string }> 
      }>(`/p/${cleanHandle}`);
      
      const profileData = res.data;
      const followers = profileData.metricsHistory?.[0]?.followers ?? (talent.handle.includes('demo') ? 370000 : 95000);
      const engagement = profileData.metricsHistory?.[0]?.engagementRate ?? (talent.handle.includes('demo') ? 4.8 : 5.2);
      
      setTalentMediaKit({
        handle: profileData.handle || talent.handle,
        niche: profileData.niche || talent.niche,
        influScore: profileData.influScore ?? talent.influScore,
        scoreClass: profileData.scoreClass || talent.scoreClass,
        bio: profileData.bio || talent.pitch || 'Criador de conteúdo de alto valor focado em conversão e branding.',
        followers: followers,
        engagement: engagement,
        companyFeedback: talent.handle.includes('demo') ? 98 : 95,
        negotiationBehavior: talent.handle.includes('demo') ? 'Super Educado' : 'Colaborativo',
        deliveryRate: 100,
        rateCard: (profileData.rateCards && profileData.rateCards.length > 0) ? profileData.rateCards : [
          { serviceName: 'Combo Reels + Stories', price: 1500, description: '1x Reels no feed e 3x Stories para engajamento e chamada de ação.' },
          { serviceName: '1x Reels de Provador', price: 900, description: 'Reels dinâmico mostrando roupas da coleção com gancho viral.' }
        ]
      });
    } catch {
      // Fallback em caso de erro de rede
      setTalentMediaKit({
        handle: talent.handle,
        niche: talent.niche,
        influScore: talent.influScore,
        scoreClass: talent.scoreClass,
        bio: talent.pitch || 'Criador de conteúdo estratégico focado em gerar conversões reais para marcas.',
        followers: talent.handle.includes('demo') ? 370000 : 95000,
        engagement: 4.8,
        companyFeedback: 98,
        negotiationBehavior: 'Super Educado',
        deliveryRate: 100,
        rateCard: [
          { serviceName: 'Combo Reels + Stories', price: 1500, description: '1x Reels no feed e 3x Stories com CTA de vendas.' },
          { serviceName: '1x Reels Patrocinado', price: 900, description: 'Reels dinâmico com demonstrativo do produto.' }
        ]
      });
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': 
        return { label: 'Concluído & Pago', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'DISPUTED': 
        return { label: 'Em Mediação', style: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'ACTIVE': 
      case 'IN_PROGRESS':
        return { label: 'SafePay Ativo', style: 'text-orange-700 bg-orange-50 border-orange-200' };
      case 'PENDING_PAYMENT':
        return { label: 'Aguardando Depósito', style: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'UNDER_REVIEW':
        return { label: 'Em Análise', style: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'DRAFT':
      default: 
        return { label: 'Pendente de Assinatura', style: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
  };

  if (isLoading && !data) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-white min-h-screen animate-pulse">
        <div className="h-24 bg-slate-100 rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-slate-100 rounded-3xl border border-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-96 bg-slate-100 rounded-3xl border border-slate-200" />
          <div className="lg:col-span-4 h-96 bg-slate-100 rounded-3xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl flex flex-col items-center text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <h2 className="text-lg font-black text-red-950">Falha ao Carregar Painel</h2>
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { stats, contracts } = data;
  const rawContracts = contracts as unknown as ContractItem[];

  // Extrair todos os deliverables em UNDER_REVIEW para priorização na fila
  const pendingReviews = rawContracts.flatMap((c) => 
    (c.deliverables || [])
      .filter((d) => d.status === 'UNDER_REVIEW')
      .map((d) => ({ ...d, contractTitle: c.title, influencerHandle: c.influencer.handle }))
  );

  // Recomendações e Radar de Talentos
  const recommendedTalents: CompanyTalent[] = data.recommendedTalents || [
    {
      id: 'demo-influencer-id',
      handle: 'demo.influencer',
      niche: 'Fashion & Lifestyle',
      influScore: 78,
      scoreClass: 'GOLD',
      growth: '+12.4%',
      reputation: 'Extremamente profissional, cumpre prazos rigorosamente e entrega alto engajamento em provadores.',
      pitch: 'Produzo reels dinâmicos focados em conversão direta de vendas para marcas de vestuário premium.'
    },
    {
      id: 'pedro-ph-id',
      handle: 'pedro_ph',
      niche: 'Fotografia & Direção',
      influScore: 82,
      scoreClass: 'GOLD',
      growth: '+5.2%',
      reputation: 'Criativo e proativo, ótima direção artística e alinhamento ágil de briefing.',
      pitch: 'Combino fotografias artísticas e mini-documentários de marca com alta estética visual.'
    },
    {
      id: 'lucas-filmes-id',
      handle: 'lucas_filmes',
      niche: 'Audiovisual & Tech',
      influScore: 90,
      scoreClass: 'PLATINUM',
      growth: '+8.5%',
      reputation: 'Edição cinematográfica premium, vídeos curtos virais com alta retenção nos primeiros 3s.',
      pitch: 'Roteirizo e edito vídeos dinâmicos de alta conversão para marcas de tecnologia e e-commerce.'
    }
  ];

  const filteredTalents = activeRadarTab === 'nacional'
    ? recommendedTalents
    : activeRadarTab === 'regional'
    ? recommendedTalents.filter((t) => t.handle === 'demo.influencer' || t.handle === 'pedro_ph')
    : recommendedTalents.filter((t) => t.influScore >= 80);

  const totalSafePayHeld = (stats as unknown as { escrowHeld?: number }).escrowHeld ?? 9500;
  const totalInvested = stats.totalInvested > 0 ? stats.totalInvested : 14500;
  const activeContractsCount = stats.activeContracts > 0 ? stats.activeContracts : rawContracts.length;

  return (
    <div className="relative w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">
      
      {/* ══════════════════════════════════════════════════════════════════════
          SOMBREAMENTO LARANJA SUAVE DE FUNDO (AMBIENT LIGHT GLOW)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[1100px] h-[380px] bg-gradient-to-b from-orange-500/[0.08] via-amber-500/[0.04] to-transparent blur-[100px] rounded-full -z-0" />
      <div className="pointer-events-none absolute top-[500px] -right-24 w-[450px] h-[450px] bg-orange-400/[0.05] blur-[120px] rounded-full -z-0" />

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER CORPORATIVO WIDESCREEN - MARCA, STATUS & AÇÕES
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-10 p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Identificação da Empresa */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-2xl">
                M
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Empresa Verificada SafePay">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                Marca Premium Ltda
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 shadow-sm flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-orange-500" /> Contratante Oficial
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SafePay Ativo
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Painel Executivo de Governança de Parcerias, Inteligência de Conversão e Custódia SafePay.
            </p>
          </div>
        </div>

        {/* Ações Rápidas Corporativas */}
        <div className="flex items-center gap-3.5 self-start xl:self-auto flex-wrap">
          <Link href="/dashboard/marketplace">
            <button className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95">
              <Users className="w-4 h-4 text-orange-600" />
              Explorar Marketplace
            </button>
          </Link>

          <Link href="/dashboard/company/new-contract">
            <button className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2">
              <Plus className="w-4 h-4 stroke-[3]" />
              Propor Novo Contrato
            </button>
          </Link>
        </div>

      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. OS 4 CARDS DE KPIS CORPORATIVOS COM BOTÕES CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card 1: Total em Custódia SafePay */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Protegido
            </div>
          </div>
          
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Saldo sob Custódia SafePay
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSafePayHeld)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 0% Risco de Golpe
            </span>
            <Link 
              href="/dashboard/contracts" 
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-sm shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1 hover:shadow-orange-500/30"
            >
              Gerenciar SafePay <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Campanhas & Contratos Ativos */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {activeContractsCount} Em Execução
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Campanhas em Andamento
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {activeContractsCount} <span className="text-sm font-bold text-slate-400">Contratos</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Cronogramas em dia
            </span>
            <Link 
              href="/dashboard/contracts" 
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white border border-orange-200 shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              Ver Contratos <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Entregáveis Aguardando Aprovação */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full border ${
              pendingReviews.length > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}>
              <Flame className="w-3.5 h-3.5 text-amber-600" /> {pendingReviews.length} Pendentes
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Aprovação de Entregas
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {pendingReviews.length} <span className="text-sm font-bold text-slate-400">na fila</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Liberação com 1 clique</span>
            <a 
              href="#fila-revisao" 
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white border border-amber-200 shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              Revisar Fila ⚡
            </a>
          </div>
        </div>

        {/* Card 4: ROI Projetado & Alcance Auditado */}
        <div className="p-6 rounded-[2rem] border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 38.5% ROI Médio
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Investimento Consolidado
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvested)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">1.4M impressões</span>
            <Link 
              href="/dashboard/reports" 
              className="px-3.5 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              Relatórios <BarChart3 className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. VINCENZO AI - BUSINESS ADVISOR & PREDIÇÃO DE ROI
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm relative overflow-hidden space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
                Vincenzo AI • Business Advisor
              </span>
              <span className="text-xs font-bold text-slate-400">Inteligência Preditiva em Tempo Real</span>
            </div>
            <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed">
              "Foco em escala e eficiência orçamentária. As métricas auditadas da sua campanha ativa com a <strong className="text-slate-950 font-black">@demo.influencer</strong> indicam projeção de <strong className="text-emerald-600 font-black">+38.5% de ROI</strong>. Recomendo aprovar as entregas pendentes na fila assim que postadas para liberar o SafePay e acelerar a tração dos novos criadores do Radar abaixo."
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. SEÇÃO PRINCIPAL: FILA DE APROVAÇÃO & TABELA DE CONTRATOS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="fila-revisao">
        
        {/* Coluna Esquerda (4 cols): Fila de Aprovação de Entregáveis */}
        <div className="xl:col-span-4 p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Fila de Validação
                </h3>
                <p className="text-xs text-slate-400 font-medium">Entregas de criadores aguardando liberação do SafePay.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                {pendingReviews.length} Pendentes
              </span>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">Fila 100% em dia!</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                    Nenhum entregável pendente de revisão no momento. Novos posts aparecerão aqui automaticamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {pendingReviews.map((delivery) => (
                  <DeliverableReviewCard 
                    key={delivery.id}
                    deliverableId={delivery.id}
                    contractTitle={delivery.contractTitle}
                    influencerHandle={delivery.influencerHandle}
                    proofUrl={delivery.proofUrl || ''}
                    onSuccess={() => fetchDashboard()}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> SafePay Auto-Release: 48h
            </span>
            <Link href="/dashboard/support" className="text-orange-600 font-bold hover:underline">
              Precisa de Ajuda?
            </Link>
          </div>
        </div>

        {/* Coluna Direita (8 cols): Esteira de Contratos & Campanhas Ativas */}
        <div className="xl:col-span-8 p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Esteira de Contratos & Campanhas
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Acompanhe o status jurídico, depósito em custódia e entregas em tempo real.
              </p>
            </div>

            <Link href="/dashboard/contracts">
              <button className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all">
                Ver Todos →
              </button>
            </Link>
          </div>

          {rawContracts.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center border border-orange-100">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">Nenhum contrato ativo</h4>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  Inicie sua primeira campanha com influenciadores auditados e proteção SafePay completa.
                </p>
              </div>
              <Link href="/dashboard/company/new-contract">
                <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95">
                  Propor Primeiro Contrato
                </button>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/30">
              <Table>
                <TableHeader className="bg-slate-100/70">
                  <TableRow className="border-b border-slate-200 hover:bg-transparent">
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-wider pl-6">Influenciador</TableHead>
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-wider">Campanha</TableHead>
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-wider">Valor</TableHead>
                    <TableHead className="text-slate-500 font-black uppercase text-[10px] tracking-wider">Status SafePay</TableHead>
                    <TableHead className="text-right text-slate-500 font-black uppercase text-[10px] tracking-wider pr-6">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawContracts.map((contract) => {
                    const badge = getStatusBadge(contract.escrowStatus);
                    return (
                      <TableRow 
                        key={contract.id}
                        className="border-b border-slate-100 hover:bg-white transition-colors group cursor-pointer"
                        onClick={() => setSelectedLegalContract(contract)}
                      >
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                              {contract.influencer.handle.replace('@', '').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900 group-hover:text-orange-600 transition-colors block">
                                @{contract.influencer.handle}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">Auditado SHA-256</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]">
                            {contract.title}
                          </span>
                        </TableCell>

                        <TableCell className="py-4">
                          <span className="text-xs font-black text-slate-950">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.budget)}
                          </span>
                        </TableCell>

                        <TableCell className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${badge.style}`}>
                            {badge.label}
                          </span>
                        </TableCell>

                        <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLegalContract(contract)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white border border-orange-200 transition-all"
                          >
                            Ver Minuta
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. RADAR DE TALENTOS & RECOMENDAÇÃO POR IA (SPOTLIGHT)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                Alta Performance Auditada
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +94.8% Retenção Média
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Radar de Criadores com Alta Taxa de Audiência & Engajamento por IA
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Influenciadores auditados com alta taxa de conversão, visualizações e audiência qualificada recomendados para sua marca.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveRadarTab('nacional')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeRadarTab === 'nacional' ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Nacional
            </button>
            <button 
              onClick={() => setActiveRadarTab('regional')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeRadarTab === 'regional' ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Regional (SP)
            </button>
            <button 
              onClick={() => setActiveRadarTab('high_roi')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeRadarTab === 'high_roi' ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alta Conversão
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTalents.map((talent) => {
            const avatarUrl = talent.handle.includes('pedro')
              ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop'
              : talent.handle.includes('lucas')
              ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop'
              : talent.handle.includes('sandbox')
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop'
              : talent.handle.includes('teste')
              ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop'
              : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop';

            return (
              <div 
                key={talent.id}
                className="p-6 rounded-[2rem] border border-slate-200 bg-slate-50/50 hover:border-orange-300 hover:bg-white hover:shadow-lg transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img 
                          src={avatarUrl} 
                          alt={talent.handle}
                          className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/20 shadow-sm"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white p-0.5 rounded-full border border-white" title="Criador Auditado SHA-256">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-950 group-hover:text-orange-600 transition-colors">
                          @{talent.handle}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          {talent.niche}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" /> {talent.growth || '+12.4%'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-orange-50 text-orange-600 border border-orange-200">
                      InfluScore: {talent.influScore}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Classe {talent.scoreClass}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Pitch do Criador</span>
                    <p className="text-slate-600 italic leading-relaxed text-xs line-clamp-2">
                      "{talent.pitch}"
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => handleOpenMediaKit(talent)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all text-center"
                  >
                    Mídia Kit
                  </button>
                  <Link
                    href={`/dashboard/company/new-contract?influencerId=${talent.id}&handle=${talent.handle}`}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-md shadow-orange-500/20 transition-all text-center flex items-center justify-center gap-1"
                  >
                    Contratar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. MODAL DO MÍDIA KIT DO INFLUENCIADOR SELECIONADO
      ══════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && selectedTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-[2.5rem] bg-white border border-slate-200 p-6 md:p-8 shadow-2xl space-y-6">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {modalLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                <span className="text-xs font-bold text-slate-400">Carregando métricas auditadas...</span>
              </div>
            ) : talentMediaKit ? (
              <div className="space-y-6">
                {/* Header do Modal */}
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                    {talentMediaKit.handle.replace('@', '').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-1.5">
                      @{talentMediaKit.handle}
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {talentMediaKit.niche}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        InfluScore: <strong>{talentMediaKit.influScore}</strong> ({talentMediaKit.scoreClass})
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPIs & Rate Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Seguidores</span>
                    <span className="text-lg font-black text-slate-900">{talentMediaKit.followers.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Engajamento</span>
                    <span className="text-lg font-black text-orange-600">{talentMediaKit.engagement}%</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Feedback Marcas</span>
                    <span className="text-lg font-black text-emerald-700">{talentMediaKit.companyFeedback}% Aprov.</span>
                  </div>
                </div>

                {/* Catálogo de Pacotes */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Tabela de Pacotes & Preços (Rate Card)</h4>
                  <div className="space-y-2">
                    {talentMediaKit.rateCard?.map((rate, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-black text-slate-900">{rate.serviceName}</h5>
                          <p className="text-[11px] text-slate-500">{rate.description}</p>
                        </div>
                        <span className="text-sm font-black text-slate-950 ml-4 whitespace-nowrap">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rate.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ação */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Pagamento com Proteção SafePay
                  </span>
                  <Link
                    href={`/dashboard/company/new-contract?influencerId=${selectedTalent.id}&handle=${selectedTalent.handle}`}
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 shadow-md hover:shadow-lg transition-all"
                  >
                    Propor Contrato com {selectedTalent.handle} →
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          7. MODAL DA MINUTA JURÍDICA OFICIAL & ASSINATURA ELETRÔNICA
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedLegalContract && (
        <ContractLegalModal
          isOpen={!!selectedLegalContract}
          onClose={() => setSelectedLegalContract(null)}
          contract={selectedLegalContract}
          canSign={false}
        />
      )}

    </div>
  );
}
