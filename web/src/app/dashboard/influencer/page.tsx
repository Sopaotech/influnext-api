"use client";
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { MetricCard } from '@/components/MetricCard';
import { Users, Activity, CheckSquare, Sparkles, Zap, Clock, ExternalLink, ArrowRight, Wallet, Target, TrendingUp } from 'lucide-react';
import { InfluScoreCard } from '@/components/influ-score-card';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  scheduledDate: string;
  isDone: boolean;
  fromAI: boolean;
}

interface Trend {
  id: string;
  title: string;
  videoUrl: string;
}

import { SocialConnect } from '@/components/SocialConnect';

export default function InfluencerDashboard() {
  const [data, setData] = useState<any | null>(null);
  const [kpis, setKpis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mission, setMission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingMission, setCompletingMission] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, missionRes] = await Promise.all([
          api.get<any>('/dashboard/influencer'),
          api.get('/influencers/mission')
        ]);
        setData(dashRes.data);
        setKpis(dashRes.data.kpis);
        setMission(dashRes.data.profile?.dailyMission ? {
          dailyMission: dashRes.data.profile.dailyMission,
          missionCompleted: dashRes.data.profile.missionCompleted
        } : missionRes.data);

        // Validation of Subscription State
        const userState = dashRes.data.userState;
        if (userState && userState.subscriptionStatus === 'INACTIVE') {
          toast.error('Assinatura Inativa. Por favor, regularize seu acesso.');
        }

      } catch (err: any) {
        setError('Falha ao conectar com o servidor.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();

    const decayed = Cookies.get('influnext_decayed');
    if (decayed) {
      toast.error(`Sentimos sua falta! Seu InfluScore caiu ${decayed} pontos por inatividade.`, {
        duration: 8000,
      });
      Cookies.remove('influnext_decayed');
    }
  }, []);

  const handleCompleteMission = async () => {
    setCompletingMission(true);
    try {
      await api.post('/influencers/mission/complete');
      setMission((prev: any) => prev ? { ...prev, missionCompleted: true } : null);
      toast.success('✦ Missão Concluída! +5 pts InfluScore');
    } catch (err) {
      toast.error('Erro ao completar missão');
    } finally {
      setCompletingMission(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 md:space-y-10 animate-pulse">
        <div className="h-12 w-64 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 h-80 bg-white/5 rounded-3xl" />
           <div className="h-80 bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  const latestMetrics = data?.metricsHistory?.[0] || null;
  const pendingTasks = data?.tasks || [];
  const activeTrends = data?.trendVault || [];
  const escrowBalance = kpis?.escrowBalance ?? 0;
  const pendingMissionsCount = kpis?.pendingMissionsCount ?? 0;
  const currentScore = kpis?.influScore ?? data?.profile?.influScore ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#050508] selection:bg-purple-500/30">
      
      {/* Mobile Bottom Navigation - Floating & Premium */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
        <nav className="bg-[#0d0b1a]/80 backdrop-blur-3xl border border-white/[0.08] p-2 rounded-full flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <button className="p-3 text-purple-400 bg-purple-500/10 rounded-full transition-all">
             <Target className="w-5 h-5" />
          </button>
          <button className="p-3 text-zinc-500 hover:text-white transition-all">
             <Activity className="w-5 h-5" />
          </button>
          <div className="relative -top-4">
             <button className="p-4 bg-gradient-to-br from-purple-600 to-emerald-600 text-white rounded-full shadow-[0_10px_20px_rgba(124,58,237,0.4)] active:scale-90 transition-all">
                <Sparkles className="w-6 h-6" />
             </button>
          </div>
          <button className="p-3 text-zinc-500 hover:text-white transition-all">
             <TrendingUp className="w-5 h-5" />
          </button>
          <button className="p-3 text-zinc-500 hover:text-white transition-all">
             <Users className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Daily Mission Banner - Refined for Mobile */}
      {mission && !mission.missionCompleted && (
        <div className="mx-4 md:mx-8 mt-4 md:mt-6 p-px rounded-2xl bg-gradient-to-r from-emerald-500/40 via-emerald-500/10 to-transparent">
           <div className="bg-[#050508]/60 backdrop-blur-xl px-4 py-3 rounded-[calc(1rem-1px)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                 </div>
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500/60">Missão_Diária</p>
                    <p className="text-xs font-bold text-zinc-100 line-clamp-1">{mission.dailyMission}</p>
                 </div>
              </div>
              <button 
                onClick={handleCompleteMission}
                disabled={completingMission}
                className="group px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {completingMission ? '...' : <CheckSquare className="w-3.5 h-3.5" />}
              </button>
           </div>
        </div>
      )}

      <div className="p-4 md:p-10 space-y-8 md:space-y-10 flex-1 max-w-7xl mx-auto w-full">
        
        {/* Pro Max Header - Ultra Premium on Mobile */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.03] pb-6 md:pb-10">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                 <div className="h-1 w-4 bg-purple-600 rounded-full" />
                 <span className="text-[8px] md:text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Influ_Hub</span>
              </div>
              <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">{data?.handle?.toUpperCase() || 'CREATOR'}</span>
              </h1>
            </div>
            {/* Mobile Profile Avatar/Wallet Trigger */}
            <div className="md:hidden">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-emerald-600 p-0.5 shadow-lg shadow-purple-500/20">
                <div className="w-full h-full rounded-[0.9rem] bg-[#0d0b1a] flex items-center justify-center text-white font-black text-xs">
                  {data?.handle?.substring(0, 2).toUpperCase() || 'CR'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="w-full md:w-auto bg-[#0d0b1a] border border-white/[0.05] px-6 py-4 rounded-[2rem] flex items-center md:items-end justify-between md:justify-end gap-4 group hover:border-emerald-500/30 transition-all duration-500">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Saldo Protegido</span>
                      <span className="text-lg md:text-2xl font-black text-emerald-400 tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(escrowBalance)}
                      </span>
                   </div>
                </div>
                <ArrowRight className="md:hidden w-4 h-4 text-zinc-800" />
             </div>
          </div>
        </header>

        {/* InfluScore Section - Primary Focus on Mobile */}
        <section className="md:hidden">
          <InfluScoreCard score={currentScore} />
        </section>

        {/* Social Connection Section - Horizontal Scroll on Mobile */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Conexões Ativas</h3>
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-none -mx-4 px-4 snap-x">
             <SocialConnect isHorizontal={true} connectedPlatforms={data?.platforms} />
          </div>
        </section>

        {/* Core KPIs - Compact Grid on Mobile */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Métricas Principais</h3>
             <TrendingUp className="w-4 h-4 text-zinc-800" />
          </div>
          <div className="grid grid-cols-2 md:hidden gap-3">
             <div className="col-span-1">
                <MetricCard 
                  title="Audiência" 
                  value={latestMetrics?.followers ?? kpis?.latestFollowers ?? 0} 
                  icon={Users} 
                  change={+2.4}
                />
             </div>
             <div className="col-span-1">
                <MetricCard 
                  title="Engajamento" 
                  value={latestMetrics ? `${latestMetrics.engagementRate}%` : (kpis?.latestEngagement ? `${kpis.latestEngagement}%` : '0.0%')} 
                  icon={TrendingUp} 
                  change={-0.8}
                />
             </div>
             <div className="col-span-2">
                <div className="bg-[#0d0b1a] border border-white/[0.05] p-5 rounded-[2rem] flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-2xl">
                         <CheckSquare className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Missões Pendentes</p>
                         <p className="text-xl font-black text-white">{pendingMissionsCount}</p>
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-zinc-700" />
                   </div>
                </div>
             </div>
          </div>

          {/* Desktop KPIs - Hidden on Mobile */}
          <div className="hidden md:flex overflow-x-auto pb-4 gap-4 scrollbar-none -mx-4 px-4 snap-x">
            <div className="min-w-[280px] snap-center">
              <MetricCard 
                title="Audiência Total" 
                value={latestMetrics?.followers ?? kpis?.latestFollowers ?? 0} 
                icon={Users} 
                change={+2.4}
                description="Crescimento constante"
              />
            </div>
            <div className="min-w-[280px] snap-center">
              <MetricCard 
                title="Engajamento" 
                value={latestMetrics ? `${latestMetrics.engagementRate}%` : (kpis?.latestEngagement ? `${kpis.latestEngagement}%` : '0.0%')} 
                icon={TrendingUp} 
                change={-0.8}
                description="Média de interações"
              />
            </div>
          </div>
        </section>

        {/* AI Strategy Insight - NEW */}
        {data?.analysis && (
          <section className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-emerald-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative bg-[#0d0b1a] border border-purple-500/20 rounded-[2.5rem] p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">Inteligência_Estratégica</h3>
                  <p className="text-xs font-bold text-zinc-400">Direcionamento do seu Mentor IA</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-lg md:text-2xl font-bold text-white leading-tight tracking-tight italic">
                  "{data.analysis.analysisText}"
                </p>
                <div className="flex items-center gap-2 pt-4 opacity-50">
                   <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Análise baseada em tendências globais e seu perfil</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Core KPIs & InfluScore Section - Desktop Layout */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard 
                title="Audiência Total" 
                value={latestMetrics?.followers ?? kpis?.latestFollowers ?? 0} 
                icon={Users} 
                change={+2.4}
                description="Crescimento orgânico constante"
              />
              <MetricCard 
                title="Taxa de Engajamento" 
                value={latestMetrics ? `${latestMetrics.engagementRate}%` : (kpis?.latestEngagement ? `${kpis.latestEngagement}%` : '0.0%')} 
                icon={TrendingUp} 
                change={-0.8}
                description="Média de interações por post"
              />
              <MetricCard 
                title="Missões Pendentes" 
                value={pendingMissionsCount} 
                icon={CheckSquare} 
                description="Complete para subir seu score"
              />
              <div className="bg-gradient-to-br from-[#100c1e] to-[#050508] border border-white/[0.05] rounded-[2rem] p-6 flex flex-col justify-between group hover:border-purple-500/20 transition-all cursor-pointer">
                 <div className="flex items-center justify-between">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                       <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-all" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status de Campanha</p>
                    <p className="text-lg font-bold text-white uppercase tracking-tight">4 Propostas Ativas</p>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-1">
              <InfluScoreCard score={currentScore} />
           </div>
        </div>

        {/* Central Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart Card */}
          <div className="lg:col-span-2">
            <section className="bg-[#0d0b1a] border border-white/[0.05] p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                 <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sincronização 2026</span>
                 </div>
              </div>

              <div className="mb-10">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2 flex items-center gap-2">
                   <Activity className="w-3.5 h-3.5" /> Curva_de_Crescimento
                </h3>
                <p className="text-xs font-bold text-zinc-400">Análise volumétrica de autoridade digital</p>
              </div>

              <div className="h-[280px] w-full relative">
                {data?.metricsHistory?.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartLineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* The Path */}
                    {(() => {
                      const history = [...data.metricsHistory].reverse();
                      const min = Math.min(...history.map((m: any) => m.followers));
                      const max = Math.max(...history.map((m: any) => m.followers));
                      const range = max - min || 1;
                      const points = history.map((m: any, i: number) => {
                        const x = (i / (history.length - 1)) * 1000;
                        const y = 300 - ((m.followers - min) / range) * 220 - 40;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <path
                            d={`M 0,300 L ${points} L 1000,300 Z`}
                            fill="url(#chartLineGradient)"
                            className="transition-all duration-1000"
                          />
                          <polyline
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                            className="drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-1000"
                          />
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30">
                     <TrendingUp className="w-12 h-12 text-zinc-700 animate-pulse" />
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Processando Sinais Históricos...</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-between text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">
                 <span>Mês Anterior</span>
                 <span className="text-zinc-800">|</span>
                 <span>Agora</span>
              </div>
            </section>
          </div>

          {/* Activity Stream Sidebar */}
          <div className="lg:col-span-1">
             <section className="bg-[#0d0b1a] border border-white/[0.05] p-8 rounded-[2.5rem] h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
                     <Clock className="w-4 h-4 text-purple-600" /> Atividade
                   </h3>
                   <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-none">
                  {[
                    { time: 'AGORA', type: 'IA', desc: 'Briefing de marca analisado.' },
                    { time: '2H', type: 'SCORE', desc: 'InfluScore atualizado +5 pts.' },
                    { time: '5H', type: 'MSG', desc: 'Novas propostas no Marketplace.' },
                    { time: '1D', type: 'VIEW', desc: 'Perfil visualizado por 12 marcas.' },
                    { time: '1D', type: 'SYS', desc: 'Check-in diário concluído.' },
                  ].map((act, i) => (
                    <div key={i} className="relative pl-6 border-l border-white/5 group">
                       <div className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-zinc-800 border border-white/10 group-hover:bg-purple-500 group-hover:border-purple-400 transition-all duration-300" />
                       <div className="space-y-1">
                          <p className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors">{act.desc}</p>
                          <p className="text-[9px] text-zinc-600 font-black tracking-widest uppercase">{act.time}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <button className="mt-8 w-full py-4 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-zinc-300 text-[10px] font-black uppercase rounded-2xl transition-all hover:tracking-widest duration-500">
                   Ver Histórico Completo
                </button>
             </section>
          </div>
        </div>

        {/* Secondary Info: Trends & Tasks */}
        {/* Trend Vault - Premium Vertical Stack for Mobile */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Trend_Vault</h3>
              </div>
              <span className="text-[9px] font-black text-purple-400/60 tracking-widest uppercase">Ver Tudo</span>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeTrends.slice(0, 4).map((trend: any) => (
                <div key={trend.id} className="group relative aspect-[9/16] rounded-[2rem] overflow-hidden border border-white/10 bg-zinc-900">
                   <img 
                     src={trend.videoUrl || `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80`} 
                     alt={trend.title}
                     className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                   <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight uppercase tracking-tighter">
                        {trend.title}
                      </p>
                      <div className="flex items-center gap-2">
                         <div className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-1/3" />
                         </div>
                         <span className="text-[8px] font-black text-purple-400">HOT</span>
                      </div>
                   </div>
                   <div className="absolute top-3 right-3">
                      <div className="p-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                         <ExternalLink className="w-3 h-3 text-white/70" />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Tasks Section */}
        <section className="bg-[#0d0b1a] border border-white/[0.05] p-8 rounded-[2.5rem] space-y-8">
           <div className="flex items-center justify-between">
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Pipeline_Tarefas</h3>
                <p className="text-xs font-bold text-zinc-400">Próximos entregáveis planejados</p>
             </div>
             <CheckSquare className="w-5 h-5 text-emerald-600/30" />
           </div>

           <div className="space-y-3">
              {pendingTasks.slice(0, 5).map((t: Task) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05] hover:bg-white/[0.04] transition-all group">
                   <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-md border ${t.isDone ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700 group-hover:border-purple-500/50'} transition-all`} />
                      <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors uppercase">{t.title}</span>
                   </div>
                   <span className="text-[9px] font-black text-zinc-700">{new Date(t.scheduledDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              ))}
           </div>
        </section>

      </div>

      {/* Global Status Footer */}
      <footer className="mt-20 border-t border-white/[0.03] py-12 px-10 flex flex-col md:flex-row items-center justify-between gap-8 bg-[#0d0b1a]/30 backdrop-blur-3xl">
        <div className="flex items-center gap-10">
           <div className="space-y-1">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Autoridade_Digital</span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-zinc-300 uppercase">{data?.scoreClass || 'BRONZE'}</span>
              </div>
           </div>
           <div className="space-y-1">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">InfluScore_System</span>
              <span className="text-[10px] font-black text-purple-400 uppercase">{currentScore}/100 PONTOS</span>
           </div>
           <div className="space-y-1">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block">Status_Sincronismo</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">SISTEMA OPERACIONAL</span>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">InfluNext // Alpha_v2.6</span>
           <div className="h-1 w-1 bg-zinc-800 rounded-full" />
           <span className="text-[9px] font-bold text-zinc-800">© 2026</span>
        </div>
      </footer>
    </div>
  );
}
