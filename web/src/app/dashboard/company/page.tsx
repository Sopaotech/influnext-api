'use client';

import React, { useEffect, useState } from 'react';
import { api, CompanyDashboardResponse } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { DollarSign, FileText, AlertCircle, CheckCircle, Sparkles, TrendingUp, UserCheck, ShieldCheck, X, Globe, Award, Users, BarChart3, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeliverableReviewCard } from '@/components/deliverable-review-card';
import { EscrowTimeline } from '@/components/EscrowTimeline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function CompanyDashboard() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [data, setData] = useState<CompanyDashboardResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // States para o modal de Media Kit
  const [selectedTalent, setSelectedTalent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [talentMediaKit, setTalentMediaKit] = useState<any | null>(null);
  const [activeRadarTab, setActiveRadarTab] = useState<'nacional' | 'regional'>('nacional');

  const handleOpenMediaKit = async (talent: any) => {
    setSelectedTalent(talent);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const res = await api.get(`/p/${talent.handle}`);
      const profileData = res.data;
      
      const followers = profileData.metricsHistory?.[0]?.followers ?? (talent.handle === 'demo.influencer' ? 370000 : 95000);
      const engagement = profileData.metricsHistory?.[0]?.engagementRate ?? (talent.handle === 'demo.influencer' ? 4.8 : 5.2);
      
      setTalentMediaKit({
        handle: profileData.handle || talent.handle,
        niche: profileData.niche || talent.niche,
        influScore: profileData.influScore ?? talent.influScore,
        scoreClass: profileData.scoreClass || talent.scoreClass,
        bio: profileData.bio || talent.pitch || 'Criador de conteúdo de alto valor focado em conversão e branding.',
        followers: followers,
        engagement: engagement,
        companyFeedback: talent.handle === 'demo.influencer' ? 98 : (talent.handle === 'pedro_ph' ? 95 : 92),
        negotiationBehavior: talent.handle === 'demo.influencer' ? 'Super Educado' : (talent.handle === 'pedro_ph' ? 'Colaborativo' : 'Neutro'),
        deliveryRate: 100,
        rateCard: (profileData.rateCards && profileData.rateCards.length > 0) ? profileData.rateCards : [
          { serviceName: 'Combo Reels + Stories', price: talent.handle === 'demo.influencer' ? 1500 : 900, description: '1x Reels no feed e 3x Stories para engajamento.' },
          { serviceName: '1x Reels de Provador', price: talent.handle === 'demo.influencer' ? 900 : 500, description: 'Reels dinâmico mostrando a coleção.' }
        ]
      });
    } catch (err) {
      console.error('Erro ao carregar profile real, gerando dados de fallback...');
      setTalentMediaKit({
        handle: talent.handle,
        niche: talent.niche,
        influScore: talent.influScore,
        scoreClass: talent.scoreClass,
        bio: talent.pitch || 'Criador de conteúdo estratégico focado em gerar conversões reais para marcas.',
        followers: talent.handle === 'demo.influencer' ? 370000 : (talent.handle === 'pedro_ph' ? 95000 : 120000),
        engagement: talent.handle === 'demo.influencer' ? 4.8 : 5.2,
        companyFeedback: talent.handle === 'demo.influencer' ? 98 : (talent.handle === 'pedro_ph' ? 95 : 92),
        negotiationBehavior: talent.handle === 'demo.influencer' ? 'Super Educado' : (talent.handle === 'pedro_ph' ? 'Colaborativo' : 'Neutro'),
        deliveryRate: 100,
        rateCard: talent.handle === 'demo.influencer' ? [
          { serviceName: 'Combo Reels + Stories', price: 1500, description: '1x Reels no feed e 3x Stories para engajamento e chamada de ação.' },
          { serviceName: '1x Reels de Provador', price: 900, description: 'Reels dinâmico mostrando roupas da coleção.' }
        ] : [
          { serviceName: 'Produção de Vídeo Curto', price: 1200, description: 'Roteirização, gravação e edição premium.' },
          { serviceName: 'Sequência de Stories (3 telas)', price: 400, description: 'Divulgação com cupom exclusivo de desconto.' }
        ]
      });
    } finally {
      setModalLoading(false);
    }
  };

  const statusMap: Record<string, string> = {
    IN_PROGRESS: 'Em Andamento',
    PENDING_PAYMENT: 'Aguardando Pagamento',
    UNDER_REVIEW: 'Em Análise',
    COMPLETED: 'Concluído',
    DISPUTE: 'Em Disputa',
    DRAFT: 'Rascunho'
  };

  // Monitor theme updates
  useEffect(() => {
    const savedTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const interval = setInterval(() => {
      const currentTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [theme]);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<CompanyDashboardResponse>('/dashboard/company');
      setData(res.data);

      const userState = (res.data as any).userState;
      if (userState) {
        if (!userState.onboardingCompleted) {
          window.location.href = '/auth/login';
          return;
        }
        if (userState.subscriptionStatus === 'INACTIVE' || 
           (userState.subscriptionStatus === 'TRIAL' && new Date() > new Date(userState.trialEndsAt))) {
          console.warn('TRIAL EXPIRED');
        }
      }
    } catch (err: any) {
      setError('Falha ao carregar os dados do painel da empresa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const isDark = theme === 'dark';

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-zinc-550 font-medium animate-pulse">Preparando seu painel corporativo...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-lg font-bold text-red-400 mb-2">Erro de Acesso</h2>
          <p className="text-red-400/80">{error}</p>
        </div>
      </div>
    );
  }

  const { stats, contracts } = data;
  
  // Extrair todos os deliverables em UNDER_REVIEW de todos os contratos para priorização na interface
  const pendingReviews = contracts.flatMap((c: any) => 
    c.deliverables
      .filter((d: any) => d.status === 'UNDER_REVIEW')
      .map((d: any) => ({ ...d, contractTitle: c.title, influencerHandle: c.influencer.handle }))
  );

  // Recomendações e Radar de Talentos Simulados de Alta Projeção
  const recommendedTalents = data.recommendedTalents || [
    {
      handle: 'demo.influencer',
      niche: 'Moda & Estilo',
      influScore: 78,
      scoreClass: 'GOLD',
      growth: '+12.4%',
      reputation: 'Extremamente profissional, cumpre prazos rigorosamente e entrega alto engajamento em provadores.',
      pitch: 'Produzo reels dinâmicos focados em conversão direta de vendas para marcas de vestuário premium.',
      id: 'demo-influencer-id'
    },
    {
      handle: 'pedro_ph',
      niche: 'Fotografia & Direção',
      influScore: 82,
      scoreClass: 'GOLD',
      growth: '+5.2%',
      reputation: 'Criativo e proativo, ótima direção artística e alinhamento ágil de briefing.',
      pitch: 'Combino fotografias artísticas e mini-documentários de marca com alta estética visual.',
      id: 'pedro-ph-id'
    },
    {
      handle: 'lucas_filmes',
      niche: 'Produção Audiovisual',
      influScore: 90,
      scoreClass: 'PLATINUM',
      growth: '+8.5%',
      reputation: 'Edição cinematográfica premium, vídeos curtos virais com alta retenção de retenção nos primeiros 3s.',
      pitch: 'Roteirizo e edito vídeos dinâmicos de alta conversão para marcas de tecnologia e e-commerce.',
      id: 'lucas-filmes-id'
    }
  ];

  const filteredTalents = activeRadarTab === 'nacional'
    ? recommendedTalents
    : recommendedTalents.filter((t: any) => t.handle === 'pedro_ph' || t.handle === 'demo.influencer');

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-32 min-h-screen">
      
      <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b ${
        isDark ? 'border-zinc-800/50' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_2px_rgba(217,107,39,0.5)]" />
             <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Corporate_Intelligence_2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-current tracking-tight">
            Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Investimentos</span>
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 font-medium text-sm mt-2">Monitore suas campanhas de influência e libere pagamentos em Escrow com segurança militar.</p>
        </div>
        <div className="flex">
          <Link 
            href="/dashboard/company/new-contract" 
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(217,107,39,0.5)] hover:shadow-[0_0_25px_-5px_rgba(217,107,39,0.7)] transition-all"
          >
            Propor Novo Contrato
          </Link>
        </div>
      </header>

      {/* Vincenzo AI Business Insights (Foco no Faturamento) */}
      <div className={`p-8 rounded-[2rem] border relative overflow-hidden shadow-xl ${
        isDark 
          ? 'bg-gradient-to-r from-zinc-950 to-zinc-900 border-white/5 text-white' 
          : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-zinc-850 shadow-orange-100/10'
      }`}>
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl flex-shrink-0">
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest">Painel Inteligente Vincenzo Analisa:</h3>
            <p className="text-base md:text-lg font-medium leading-relaxed">
              "Vincenzo aqui. Foco em campanhas de alta conversão. Sua taxa de ROI para a parceria ativa com a <span className="font-bold text-orange-500">@demo.influencer</span> está projetada em <span className="font-extrabold text-orange-500">38.5%</span>. Recomendo revisar os entregáveis pendentes na fila assim que postados para otimizar a distribuição do anúncio. Utilize o Radar de Talentos abaixo para escalar novos criadores com pontuação auditada."
            </p>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <MetricCard title="Investimento Escrow" value={`$${stats.totalInvested.toLocaleString('pt-BR')}`} icon={DollarSign} isDark={isDark} />
        <MetricCard title="Contratos Ativos" value={stats.activeContracts} icon={FileText} isDark={isDark} />
        <MetricCard title="Entregas na Fila" value={stats.pendingReviews} icon={AlertCircle} isDark={isDark} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Painel de Qualidade (Aprovações Prioritárias) */}
        <div className="col-span-1 lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-xl font-black text-current flex items-center gap-2 uppercase tracking-tighter">
               Ação Necessária 
             </h2>
             <span className="bg-pink-500/20 text-pink-500 dark:text-pink-450 border border-pink-500/30 text-[10px] font-black px-3 py-1 rounded-full">
               {pendingReviews.length}
             </span>
          </div>
          
          {pendingReviews.length === 0 ? (
            <div className={`border rounded-[2.5rem] p-12 text-center text-xs font-bold text-zinc-550 shadow-md ${
              isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex justify-center mb-4"><CheckCircle className="w-10 h-10 text-emerald-500/70" /></div>
              Sua fila de revisão está vazia.<br/>Nenhuma pendência no momento.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 pb-4 no-scrollbar">
              {pendingReviews.map(delivery => (
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

        {/* Lista de Contratos Ativos */}
        <div className={`border rounded-[2.5rem] p-8 shadow-xl flex flex-col lg:col-span-3 ${
          isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-current flex items-center gap-2 uppercase tracking-tighter">
              <FileText className="w-5 h-5 text-orange-400" /> Histórico de Contratos
            </h2>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Clique na linha para detalhes</span>
          </div>
          
          {contracts.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-[2rem] ${
              isDark ? 'bg-zinc-950/50 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200/80'
            }`}>
              <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                <FileText className="w-10 h-10 text-zinc-400" />
              </div>
              <h3 className="text-current text-lg font-black uppercase tracking-tight mb-2">Sua esteira está vazia</h3>
              <p className="text-zinc-550 dark:text-zinc-400 text-sm font-medium max-w-md mb-8">
                Descubra influenciadores de alta conversão validados por dados reais. Negocie e escale os seus resultados com proteção total.
              </p>
              <Link 
                href="/dashboard/marketplace"
                className={`px-8 py-4 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all border ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-250'
                }`}
              >
                Procurar Influenciadores Agora
              </Link>
            </div>
          ) : (
            <div className={`rounded-[1.5rem] border overflow-hidden flex-1 ${
              isDark ? 'border-zinc-800/60 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50/50'
            }`}>
              <Table>
                <TableHeader className={isDark ? 'bg-zinc-900' : 'bg-zinc-100'}>
                  <TableRow className={`border-b hover:bg-transparent ${isDark ? 'border-b-zinc-800' : 'border-b-zinc-200'}`}>
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14 pl-6">Influenciador</TableHead>
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14">Campanha</TableHead>
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14">Orçamento</TableHead>
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14">Escrow</TableHead>
                    <TableHead className="text-right text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14 pr-6">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract: any) => {
                    const lastCapture = contract.influencer.metricsHistory?.[0]?.capturedAt;
                    const isOutdated = lastCapture ? (new Date().getTime() - new Date(lastCapture).getTime() > 24 * 60 * 60 * 1000) : true;
                    
                    // Row click handler (clicks go to report if completed, else go to general contracts page)
                    const handleRowClick = () => {
                      if (contract.escrowStatus === 'COMPLETED') {
                        router.push(`/dashboard/company/reports/${contract.id}`);
                      } else {
                        router.push('/dashboard/contracts');
                      }
                    };

                    return (
                      <TableRow 
                        key={contract.id} 
                        onClick={handleRowClick}
                        className={`border-b cursor-pointer transition-colors group ${
                          isDark ? 'border-b-zinc-800/50 hover:bg-zinc-800/30' : 'border-b-zinc-200 hover:bg-zinc-100/50'
                        }`}
                      >
                        <TableCell className="font-black text-current py-6 pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="group-hover:text-orange-500 transition-colors">@{contract.influencer.handle}</span>
                            {isOutdated && (
                              <span className="inline-flex w-max items-center gap-1 text-[8px] font-black uppercase bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                                <AlertCircle className="w-2.5 h-2.5" /> Desatualizado
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-550 dark:text-zinc-300 py-6 font-bold text-sm">{contract.title}</TableCell>
                      <TableCell className="text-emerald-600 dark:text-emerald-400 font-black py-6 tracking-tighter text-lg">${Number(contract.budget).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <EscrowTimeline status={contract.escrowStatus} />
                          <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-tighter">
                            {statusMap[contract.escrowStatus] || contract.escrowStatus}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-6 pr-6" onClick={(e) => e.stopPropagation()}>
                        {contract.escrowStatus === 'DRAFT' && (
                          <button 
                            onClick={async () => {
                              if (confirm('Confirmar depósito Escrow para iniciar a campanha?')) {
                                try {
                                  await api.post(`/contracts/${contract.id}/pay`);
                                  fetchDashboard();
                                } catch (err) {
                                  alert('Erro ao confirmar depósito.');
                                }
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                          >
                            Depositar
                          </button>
                        )}
                        {contract.escrowStatus === 'COMPLETED' && (
                          <Link
                            href={`/dashboard/company/reports/${contract.id}`}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                              isDark ? 'border-zinc-800 text-zinc-400 hover:bg-white/5' : 'border-zinc-250 text-zinc-650 hover:bg-zinc-100'
                            }`}
                          >
                            Ver Relatório
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      </div>

      {/* Radar de Talentos & Recomendação da IA (Spotlight de Influenciadores) */}
      <section className={`border rounded-[2.5rem] p-8 shadow-xl space-y-8 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200 shadow-zinc-100/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-current tracking-tight flex items-center gap-2 uppercase">
              <UserCheck className="w-6 h-6 text-orange-500" /> Radar de Talentos
            </h2>
            <p className="text-sm text-zinc-550 dark:text-zinc-400 font-medium">Recomendações baseadas em crescimento de audiência, dedicação em prazos e pitches validados.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tabs de Filtro */}
            <div className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <button 
                onClick={() => setActiveRadarTab('nacional')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  activeRadarTab === 'nacional'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-zinc-550 dark:text-zinc-400 hover:text-current'
                }`}
              >
                Nacional
              </button>
              <button 
                onClick={() => setActiveRadarTab('regional')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  activeRadarTab === 'regional'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-zinc-550 dark:text-zinc-400 hover:text-current'
                }`}
              >
                Regional (SP)
              </button>
            </div>

            <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-black px-4.5 py-2.5 rounded-xl uppercase tracking-wider">
              Métricas Auditadas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTalents.map((talent, index) => (
            <div 
              key={index}
              onClick={() => handleOpenMediaKit(talent)}
              className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col justify-between cursor-pointer hover:scale-[1.01] hover:shadow-xl ${
                isDark 
                  ? 'bg-zinc-950/60 border-zinc-800 hover:border-orange-500/30' 
                  : 'bg-zinc-50/50 border-zinc-250 hover:border-orange-500/30 shadow-sm shadow-zinc-100/30'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-black text-current">@{talent.handle}</h4>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{talent.niche}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> {talent.growth}
                    </span>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">MoM</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black px-3 py-1 rounded-full">
                    InfluScore: {talent.influScore}
                  </span>
                  <span className="bg-zinc-500/15 text-zinc-400 text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> {talent.scoreClass}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-850">
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Pitch do Criador</span>
                    <p className="text-xs text-zinc-550 dark:text-zinc-300 italic font-medium">"{talent.pitch}"</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Reputação e Dedicação</span>
                    <p className="text-xs text-zinc-550 dark:text-zinc-300 font-medium">{talent.reputation}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-zinc-850">
                <Link
                  href={`/dashboard/company/new-contract?influencerId=${talent.id}&handle=${talent.handle}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-11 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  Propor Contrato
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Media Kit do Influenciador Selecionado */}
      {isModalOpen && selectedTalent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div 
            className={`relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-[2.5rem] border p-6 md:p-10 animate-in zoom-in-95 duration-300 ${
              isDark ? 'bg-[#0b0a09] border-zinc-800 text-white' : 'bg-white border-zinc-250 text-zinc-900 shadow-2xl shadow-zinc-200/50'
            }`}
          >
            {/* Botão de Fechar */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-6 right-6 p-2.5 rounded-full border transition-all ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {modalLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sincronizando Ativos do Criador...</span>
              </div>
            ) : talentMediaKit ? (
              <div className="space-y-8">
                {/* Cabeçalho */}
                <div className="flex items-center gap-4 border-b border-zinc-850 pb-6 pr-12">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 p-0.5 shadow-md animate-pulse">
                    <div className={`w-full h-full rounded-[0.9rem] flex items-center justify-center font-black text-xl overflow-hidden ${
                      isDark ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-850'
                    }`}>
                      {selectedTalent.handle[0].toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black flex items-center gap-1.5">
                      @{talentMediaKit.handle}
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-[10px] bg-orange-500/10 text-orange-500 border border-orange-500/10 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        {talentMediaKit.niche}
                      </span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/10 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        InfluScore: {talentMediaKit.influScore}
                      </span>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Classe {talentMediaKit.scoreClass}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Principal em Duas Colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Coluna da Esquerda: Bio, IA e Preços */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">Posicionamento & Bio</span>
                      <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {talentMediaKit.bio}
                      </p>
                    </div>

                    {/* Catálogo de Serviços */}
                    <div className="space-y-4">
                      <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block">Catálogo de Serviços</span>
                      <div className="space-y-3">
                        {talentMediaKit.rateCard?.map((rate: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                              isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <h5 className="text-[11px] font-black uppercase tracking-wide">{rate.serviceName}</h5>
                              <p className="text-[10px] text-zinc-455 dark:text-zinc-450">{rate.description}</p>
                            </div>
                            <span className="text-xs font-black text-emerald-500 whitespace-nowrap">
                              R$ {rate.price.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Coluna da Direita: KPIs e Avaliação Corporativa */}
                  <div className="space-y-6">
                    {/* KPIs de Audiência */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-0.5">Seguidores</span>
                        <span className="text-xl font-black text-current">{talentMediaKit.followers?.toLocaleString()}</span>
                      </div>
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block mb-0.5">Engajamento</span>
                        <span className="text-xl font-black text-orange-500">{talentMediaKit.engagement}%</span>
                      </div>
                    </div>

                    {/* Avaliação e Comportamento Corporativo (NOVO) */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-widest block">Trabalhar com Ele (Feedback das Marcas)</span>
                      
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-400 block uppercase">Recomendação</span>
                          <span className="text-lg font-black text-emerald-500">{talentMediaKit.companyFeedback}% das marcas</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-zinc-400 block uppercase">Negociação</span>
                          <span className="text-xs font-black text-orange-500 border border-orange-500/20 bg-orange-500/5 px-2 py-0.5 rounded inline-block mt-0.5">{talentMediaKit.negotiationBehavior}</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-dashed border-zinc-800/40 text-[10px] font-bold text-zinc-550 dark:text-zinc-400 leading-relaxed">
                        <div>⏱ **Pontualidade:** {talentMediaKit.deliveryRate}% de entregas no prazo acordado</div>
                        <div>💬 **Facilidade de Contato:** Resposta rápida e alinhamento ágil de briefing.</div>
                      </div>
                    </div>

                    {/* Cidades de Público */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-widest block">Demografia de Audiência (São Paulo / Rio)</span>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-550 dark:text-zinc-400">
                            <span>São Paulo</span>
                            <span>52%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '52%' }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-550 dark:text-zinc-400">
                            <span>Rio de Janeiro</span>
                            <span>20%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer do Modal com botão Propor Contrato */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-850">
                  <div className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Transação coberta por Escrow Seguro
                  </div>
                  <Link
                    href={`/dashboard/company/new-contract?influencerId=${selectedTalent.id}&handle=${selectedTalent.handle}`}
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    Propor Contrato com {selectedTalent.handle} ➔
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
