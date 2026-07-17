'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MetricCard } from '@/components/MetricCard';
import { Users, DollarSign, FileText, Activity, TrendingUp, Sparkles, Zap, Brain, ShieldCheck, Eye, LifeBuoy, Crown, UserX, Percent } from 'lucide-react';
import Cookies from 'js-cookie';

interface AdminStats {
  metrics: {
    totalUsers: Array<{ role: string; _count: { _all: number } }>;
    gmv: number;
    revenue: number;
    marketplaceHealth: Array<{ escrowStatus: string; _count: { _all: number } }>;
    totalContracts: number;
    pageViews: number;
    churnRate?: number;
    defaultRate?: number;
    activeSubs?: number;
    canceledSubs?: number;
    pastDueSubs?: number;
  };
  status: string;
  serverTime: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [grantIdentifier, setGrantIdentifier] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';

  useEffect(() => {
    const savedTheme = Cookies.get('influnext_theme');
    if (savedTheme) setTheme(savedTheme);
    fetchStats();
    fetchTickets();
  }, []);

  const handleStartIgConnection = () => {
    const id = toast.loading('Iniciando conexão com Instagram da Empresa...');
    api.get('/auth/social/urls').then(res => {
      if (res.data.instagram) window.location.href = res.data.instagram;
    }).catch(() => toast.error('Erro ao buscar URL de conexão.', { id }));
  };

  const handleStartTikTokConnection = () => {
    const id = toast.loading('Iniciando conexão com TikTok da Empresa...');
    api.get('/auth/social/urls').then(res => {
      if (res.data.tiktok) window.location.href = res.data.tiktok;
    }).catch(() => toast.error('Erro ao buscar URL de conexão.', { id }));
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<AdminStats>('/admin/stats');
      setData(res.data);
    } catch (err) {
      console.error('Erro ao buscar stats de admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/admin');
      setTickets(res.data);
    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
    }
  };

  const handleGenerateStrategy = async () => {
    try {
      setIsGenerating(true);
      const res = await api.get('/admin/growth-strategy');
      setStrategy(res.data);
    } catch (err) {
      console.error('Erro ao gerar estratégia:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleGrantPro = async () => {
    if (!grantIdentifier) {
      toast.error('Insira o e-mail ou ID do usuário.');
      return;
    }
    try {
      setIsGranting(true);
      const res = await api.post('/admin/grant-pro', { identifier: grantIdentifier });
      toast.success(res.data.message);
      setGrantIdentifier('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao liberar acesso');
    } finally {
      setIsGranting(false);
    }
  };

  const formatCurrency = (value: any) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Activity className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Preparando visão financeira...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
      
      {/* Header */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
        <div className="space-y-2">
          <div className={`flex items-center gap-2 font-black text-[10px] tracking-[0.4em] uppercase ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            <ShieldCheck className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            GovernanceHub // FounderLevel
          </div>
          <h1 className={`text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Análise de <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-orange-500 to-amber-500' : 'from-orange-600 to-amber-600'}`}>Mercado</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live_System_Online</span>
           </div>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <MetricCard 
          title="Faturamento Bruto" 
          value={formatCurrency(data?.metrics?.revenue || 0)} 
          icon={TrendingUp}
          isDark={isDark}
        />
        <MetricCard 
          title="Volume GMV" 
          value={formatCurrency(data?.metrics?.gmv || 0)} 
          icon={DollarSign} 
          isDark={isDark}
        />
        <MetricCard 
          title="Visitantes Únicos" 
          value={data?.metrics?.pageViews || 0} 
          icon={Eye} 
          isDark={isDark}
        />
        <MetricCard 
          title="Contratos Ativos" 
          value={data?.metrics?.totalContracts || 0} 
          icon={FileText} 
          isDark={isDark}
        />
        <MetricCard 
          title="Taxa de Churn" 
          value={`${data?.metrics?.churnRate ?? 0}%`} 
          icon={UserX}
          description={`${data?.metrics?.canceledSubs ?? 0} cancelados`}
          isDark={isDark}
        />
        <MetricCard 
          title="Inadimplência" 
          value={`${data?.metrics?.defaultRate ?? 0}%`} 
          icon={Percent}
          description={`${data?.metrics?.pastDueSubs ?? 0} em atraso`}
          isDark={isDark}
        />
      </section>

      {/* Gestão de Parceiros (Grant Pro) */}
      <section className={`border rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-white/[0.02] border-white/[0.06] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'}`}>
        {/* Glow corner */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${isDark ? 'bg-orange-500/5' : 'bg-orange-500/10'}`} />
        
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <div className={`flex items-center gap-2 font-black text-[10px] tracking-[0.2em] uppercase ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                <Crown className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                Acesso Pro & Parcerias
              </div>
              <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Liberar Vantagens para Parceiros</h2>
           </div>
        </div>
        
        <div className={`flex flex-col md:flex-row gap-4 p-6 rounded-3xl border transition-all ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
           <div className="flex-1 relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="E-mail ou ID do usuário (ex: alexsandro@parceiro.com)" 
                className={`w-full text-sm font-bold focus:outline-none rounded-2xl pl-11 pr-4 py-4 transition-all shadow-sm ${isDark ? 'bg-white/[0.04] border-white/[0.08] text-white focus:border-orange-500/50 focus:bg-white/[0.07] placeholder:text-zinc-600' : 'bg-white border-slate-200 text-slate-900 focus:border-orange-500 focus:bg-white placeholder:text-slate-400'}`}
                value={grantIdentifier}
                onChange={e => setGrantIdentifier(e.target.value)}
              />
           </div>
           <button 
             onClick={handleGrantPro}
             disabled={isGranting}
             className={`font-black text-[10px] uppercase tracking-[0.2em] px-10 rounded-2xl h-14 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 ${isDark ? 'bg-white hover:bg-zinc-200 text-slate-950' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/10'}`}
           >
             {isGranting ? 'Sincronizando...' : 'Liberar Acesso Pro →'}
           </button>
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Isso ativará todos os recursos premium e removerá as travas de pagamento do usuário.</p>
      </section>

      {/* Social Assets Section for Admin */}
      <section className={`border rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl transition-all duration-500 ${isDark ? 'bg-gradient-to-r from-orange-950/20 via-amber-950/10 to-orange-950/20 border-orange-500/20 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-md shadow-slate-100/50'}`}>
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className={`w-32 h-32 ${isDark ? 'text-white' : 'text-slate-200'}`} />
         </div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
               <div>
                  <div className={`font-black text-[10px] tracking-[0.3em] uppercase mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Configuração de Elite</div>
                  <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Vincular Ativos da Empresa</h2>
               </div>
               <p className={`text-xs font-medium max-w-md ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                 Conecte o Instagram e outras redes da <b>InfluNext</b> para monitorar métricas oficiais, validar parcerias e usar ativos da marca nas campanhas.
               </p>
            </div>
            <div className="flex flex-wrap gap-4">
               <button 
                 onClick={handleStartIgConnection}
                 className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all group border ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/85 text-slate-800'}`}
               >
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                 </div>
                 <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conectar</div>
                    <div className="text-sm font-bold">Instagram Pro</div>
                 </div>
               </button>

               <button 
                 onClick={handleStartTikTokConnection}
                 className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all group border ${isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/85 text-slate-800'}`}
               >
                 <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-cyan-400/20 blur-[8px]" />
                    <div className="absolute bottom-0 right-0 w-1/2 h-full bg-rose-500/20 blur-[8px]" />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.153 0 .3.013.443.037v-3.468a6.34 6.34 0 0 0-.443-.016 6.341 6.341 0 1 0 6.341 6.341V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686z" fill="white" />
                    </svg>
                 </div>
                 <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conectar</div>
                    <div className="text-sm font-bold">TikTok Enterprise</div>
                 </div>
               </button>
            </div>
         </div>
      </section>

      {/* Gemini Growth Partner */}
      <section className={`border rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'}`}>
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap className="w-48 h-48 text-orange-500" />
         </div>
         <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className={`flex items-center gap-2 font-black text-[10px] tracking-[0.3em] uppercase mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                    <Sparkles className={`w-4 h-4 animate-pulse ${isDark ? 'text-orange-400' : 'text-orange-600'}`} /> Gemini Growth Partner
                  </div>
                  <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>Estrategista de Escala SaaS</h2>
               </div>
               <button 
                 onClick={handleGenerateStrategy}
                 disabled={isGenerating}
                 className={`px-6 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50 ${isDark ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20' : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/10'}`}
               >
                 {isGenerating ? 'Analisando Mercado...' : 'Gerar Novo Plano Estratégico'}
               </button>
            </div>
            {strategy ? (
              <div className={`border rounded-2xl p-6 md:p-10 max-w-none animate-in fade-in zoom-in-95 duration-500 shadow-inner ${isDark ? 'bg-white/[0.01] border-white/[0.05]' : 'bg-slate-50 border-slate-200'}`}>
                 <div className={`text-sm leading-relaxed whitespace-pre-wrap font-sans ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    {strategy.content}
                 </div>
              </div>
            ) : (
              <div className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-4 ${isDark ? 'border-white/[0.08] bg-white/[0.01]' : 'border-slate-200 bg-slate-50'}`}>
                 <Brain className="w-10 h-10 text-zinc-500" />
                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Aguardando solicitação estratégica...</p>
              </div>
            )}
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Tickets */}
        <div className={`border rounded-[2.5rem] p-6 shadow-sm space-y-6 backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'}`}>
           <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <LifeBuoy className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} /> Chamados de Suporte
           </h3>
           <div className="space-y-3">
              {tickets.length > 0 ? tickets.map((t: any) => (
                <div key={t.id} className={`p-4 border rounded-2xl flex items-center justify-between group transition-all ${isDark ? 'bg-white/[0.02] border-white/[0.06] hover:border-orange-500/40 hover:bg-white/[0.04]' : 'bg-slate-50 border-slate-200 hover:border-orange-500/40 hover:bg-slate-100/80 text-slate-800'}`}>
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                           t.category === 'BUG' 
                             ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                             : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                         }`}>
                            {t.category}
                         </span>
                         <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.subject}</span>
                      </div>
                      <p className={`text-[10px] font-medium truncate max-w-[300px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{t.message}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-zinc-500 uppercase">{t.user.email}</p>
                      <button className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'}`}>Responder</button>
                   </div>
                </div>
              )) : (
                <p className="text-center py-10 text-[9px] text-zinc-500 font-bold uppercase">Nenhum chamado aberto.</p>
              )}
           </div>
        </div>

        {/* User Breakdown */}
        <div className={`border rounded-[2.5rem] p-6 shadow-sm space-y-6 backdrop-blur-xl transition-all duration-500 ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'}`}>
           <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Base de Usuários</h3>
           <div className="space-y-3">
              {Array.isArray(data?.metrics?.totalUsers) ? data.metrics.totalUsers.map((u, idx) => (
                <div key={idx} className={`flex items-center justify-between p-4 border rounded-2xl ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-[10px] font-black uppercase ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{u.role}</span>
                    <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>{u._count._all}</span>
                </div>
              )) : null}
           </div>
        </div>
      </div>
    </div>
  );
}
