'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MetricCard } from '@/components/MetricCard';
import { Users, DollarSign, FileText, AlertTriangle, ShieldCheck, Activity, TrendingUp, BarChart3, Sparkles, Zap, Brain, CheckCircle2, Eye, MessageSquare, LifeBuoy, Crown } from 'lucide-react';
import { InstagramOnboardingModal } from '@/components/InstagramOnboardingModal';

interface AdminStats {
  metrics: {
    totalUsers: Array<{ role: string; _count: { _all: number } }>;
    gmv: number;
    revenue: number;
    marketplaceHealth: Array<{ escrowStatus: string; _count: { _all: number } }>;
    totalContracts: number;
    pageViews: number;
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

  const [isIgModalOpen, setIsIgModalOpen] = useState(false);

  useEffect(() => {
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
        <Activity className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Preparando visão financeira...</p>
      </div>
    );
  }

  const totalUsersCount = Array.isArray(data?.metrics?.totalUsers) 
    ? data.metrics.totalUsers.reduce((acc, curr) => acc + curr._count._all, 0) 
    : 0;
  
  const draftCount = Array.isArray(data?.metrics?.marketplaceHealth) 
    ? data.metrics.marketplaceHealth.find(h => h.escrowStatus === 'DRAFT')?._count._all || 0
    : 0;
    
  const completedCount = Array.isArray(data?.metrics?.marketplaceHealth)
    ? data.metrics.marketplaceHealth.find(h => h.escrowStatus === 'COMPLETED')?._count._all || 0
    : 0;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-500 font-black text-[10px] tracking-[0.4em] uppercase">
            <ShieldCheck className="w-5 h-5" />
            Governance_Hub // Founder_Level
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
            Análise de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600">Mercado</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Live_System_Online</span>
           </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          title="Faturamento Bruto" 
          value={formatCurrency(data?.metrics?.revenue || 0)} 
          icon={TrendingUp}
          className="bg-white border-slate-100 shadow-sm"
        />
        <MetricCard 
          title="Volume GMV" 
          value={formatCurrency(data?.metrics?.gmv || 0)} 
          icon={DollarSign} 
          className="bg-white border-slate-100 shadow-sm"
        />
        <MetricCard 
          title="Visitantes Únicos" 
          value={data?.metrics?.pageViews || 0} 
          icon={Eye} 
          className="bg-white border-slate-100 shadow-sm"
        />
        <MetricCard 
          title="Contratos Ativos" 
          value={data?.metrics?.totalContracts || 0} 
          icon={FileText} 
          className="bg-white border-slate-100 shadow-sm"
        />
      </section>

      {/* Gestão de Parceiros (Grant Pro) */}
      <section className="bg-white border border-purple-100 rounded-3xl p-8 shadow-[0_20px_40px_rgba(168,85,247,0.03)] space-y-6">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-purple-600 font-black text-[10px] tracking-[0.2em] uppercase">
                <Crown className="w-4 h-4" />
                Acesso Pro & Parcerias
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Liberar Vantagens para Parceiros</h2>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
           <div className="flex-1 relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="E-mail ou ID do usuário (ex: alexsandro@parceiro.com)" 
                className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/5 transition-all shadow-sm"
                value={grantIdentifier}
                onChange={e => setGrantIdentifier(e.target.value)}
              />
           </div>
           <button 
             onClick={handleGrantPro}
             disabled={isGranting}
             className="bg-slate-900 hover:bg-purple-600 text-white font-black text-[10px] uppercase tracking-[0.2em] px-10 rounded-xl h-14 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
           >
             {isGranting ? 'Sincronizando...' : 'Liberar Acesso Pro →'}
           </button>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Isso ativará todos os recursos premium e removerá as travas de pagamento do usuário.</p>
      </section>


      {/* Social Assets Section for Admin */}
      <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32 text-white" />
         </div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
               <div>
                  <div className="text-purple-400 font-black text-[10px] tracking-[0.3em] uppercase mb-1">Configuração de Elite</div>
                  <h2 className="text-2xl font-black tracking-tight">Vincular Ativos da Empresa</h2>
               </div>
               <p className="text-slate-400 text-xs font-medium max-w-md">
                 Conecte o Instagram e outras redes da <b>InfluNext</b> para monitorar métricas oficiais, validar parcerias e usar ativos da marca nas campanhas.
               </p>
            </div>
            <div className="flex flex-wrap gap-4">
               <button 
                 onClick={() => setIsIgModalOpen(true)}
                 className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center gap-3 transition-all group"
               >
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                 </div>
                 <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Conectar</div>
                    <div className="text-sm font-bold">Instagram Pro</div>
                 </div>
               </button>

               <button 
                 onClick={handleStartTikTokConnection}
                 className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center gap-3 transition-all group"
               >
                 <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden">
                    {/* Efeito Neon do TikTok nas bordas do botão interno */}
                    <div className="absolute top-0 left-0 w-1/2 h-full bg-cyan-400/20 blur-[8px]" />
                    <div className="absolute bottom-0 right-0 w-1/2 h-full bg-rose-500/20 blur-[8px]" />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.153 0 .3.013.443.037v-3.468a6.34 6.34 0 0 0-.443-.016 6.341 6.341 0 1 0 6.341 6.341V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686z" fill="white" />
                    </svg>
                 </div>
                 <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Conectar</div>
                    <div className="text-sm font-bold">TikTok Enterprise</div>
                 </div>
               </button>
            </div>
         </div>
      </section>

      {/* Gemini Growth Partner - Premium Light Style */}
      <section className="bg-white border border-purple-100 rounded-3xl p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(139,92,246,0.05)]">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap className="w-48 h-48 text-purple-600" />
         </div>
         <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2 text-pink-500 font-black text-[10px] tracking-[0.3em] uppercase mb-1">
                    <Sparkles className="w-4 h-4" /> Gemini Growth Partner
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Estrategista de Escala SaaS</h2>
               </div>
               <button 
                 onClick={handleGenerateStrategy}
                 disabled={isGenerating}
                 className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-600/20 disabled:opacity-50"
               >
                 {isGenerating ? 'Analisando Mercado...' : 'Gerar Novo Plano Estratégico'}
               </button>
            </div>
            {strategy ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-10 max-w-none animate-in fade-in zoom-in-95 duration-500 shadow-inner">
                 <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {strategy.content}
                 </div>
              </div>
            ) : (
              <div className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-4 bg-slate-50/50">
                 <Brain className="w-10 h-10 text-slate-300" />
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aguardando solicitação estratégica...</p>
              </div>
            )}
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Tickets */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LifeBuoy className="w-3.5 h-3.5" /> Chamados de Suporte
           </h3>
           <div className="space-y-3">
              {tickets.length > 0 ? tickets.map((t: any) => (
                <div key={t.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 hover:shadow-md transition-all">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${t.category === 'BUG' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                            {t.category}
                         </span>
                         <span className="text-xs font-bold text-slate-800">{t.subject}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium truncate max-w-[300px]">{t.message}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">{t.user.email}</p>
                      <button className="text-[9px] font-black text-purple-600 uppercase tracking-widest hover:text-purple-700">Responder</button>
                   </div>
                </div>
              )) : (
                <p className="text-center py-10 text-[9px] text-slate-400 font-bold uppercase">Nenhum chamado aberto.</p>
              )}
           </div>
        </div>

        {/* User Breakdown */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base de Usuários</h3>
           <div className="space-y-3">
              {Array.isArray(data?.metrics?.totalUsers) ? data.metrics.totalUsers.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-500">{u.role}</span>
                    <span className="text-xl font-black text-slate-900">{u._count._all}</span>
                </div>
              )) : null}
           </div>
        </div>
      </div>

      <InstagramOnboardingModal 
        isOpen={isIgModalOpen}
        onClose={() => setIsIgModalOpen(false)}
        onConfirm={() => {
          setIsIgModalOpen(false);
          handleStartIgConnection();
        }}
      />
    </div>
  );
}
