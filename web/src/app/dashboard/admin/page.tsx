'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { MetricCard } from '@/components/MetricCard';
import { Users, DollarSign, FileText, AlertTriangle, ShieldCheck, Activity, TrendingUp, BarChart3, Sparkles, Zap, Brain, CheckCircle2, Eye, MessageSquare, LifeBuoy } from 'lucide-react';

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

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, []);

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
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-purple-600 font-black text-[10px] tracking-[0.2em] uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            Visão Geral do Fundador
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Análise de <span className="text-purple-600">Mercado</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sistema Operacional</span>
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
                 onClick={() => {
                   const id = toast.loading('Iniciando conexão com Instagram da Empresa...');
                   api.get('/auth/social/urls').then(res => {
                     if (res.data.instagram) window.location.href = res.data.instagram;
                   }).catch(() => toast.error('Erro ao buscar URL de conexão.', { id }));
                 }}
                 className="px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center gap-3 transition-all group"
               >
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                 </div>
                 <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">Conectar</div>
                    <div className="text-sm font-bold">Instagram Pro</div>
                 </div>
               </button>

               <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 opacity-50 cursor-not-allowed">
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-500" />
                 </div>
                 <div className="text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Em Breve</div>
                    <div className="text-sm font-bold text-slate-500">TikTok Enterprise</div>
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
    </div>
  );
}
