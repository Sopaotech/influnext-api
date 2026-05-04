'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Sincronizando Core Financeiro...</p>
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
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-black text-[10px] tracking-[0.2em] uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            Founder's Master View
          </div>
          <h1 className="text-3xl font-black text-zinc-50 tracking-tighter">
            Análise de <span className="text-purple-500">Mercado</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sistema Operacional</span>
           </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          title="Faturamento Bruto" 
          value={formatCurrency(data?.metrics?.revenue || 0)} 
          icon={TrendingUp}
          highlightColor="#fbbf24"
        />
        <MetricCard 
          title="Volume GMV" 
          value={formatCurrency(data?.metrics?.gmv || 0)} 
          icon={DollarSign} 
        />
        <MetricCard 
          title="Visitantes Únicos" 
          value={data?.metrics?.pageViews || 0} 
          icon={Eye} 
        />
        <MetricCard 
          title="Contratos Ativos" 
          value={data?.metrics?.totalContracts || 0} 
          icon={FileText} 
        />
      </section>

      {/* Gemini Growth Partner */}
      <section className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-purple-500/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(139,92,246,0.1)]">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap className="w-48 h-48 text-purple-500" />
         </div>
         <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2 text-pink-400 font-black text-[10px] tracking-[0.3em] uppercase mb-1">
                    <Sparkles className="w-4 h-4" /> Gemini Growth Partner
                  </div>
                  <h2 className="text-2xl font-black text-zinc-50 tracking-tight">Estrategista de Escala SaaS</h2>
               </div>
               <button 
                 onClick={handleGenerateStrategy}
                 disabled={isGenerating}
                 className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-600/20 disabled:opacity-50"
               >
                 {isGenerating ? 'Analisando Mercado...' : 'Gerar Novo Plano de Guerra'}
               </button>
            </div>
            {strategy ? (
              <div className="bg-zinc-950/80 border border-purple-500/20 rounded-2xl p-6 md:p-10 prose prose-invert max-w-none animate-in fade-in zoom-in-95 duration-500">
                 <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {strategy.content}
                 </div>
              </div>
            ) : (
              <div className="h-48 border-2 border-dashed border-purple-500/20 rounded-2xl flex flex-col items-center justify-center space-y-4">
                 <Brain className="w-10 h-10 text-zinc-800" />
                 <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Aguardando solicitação estratégica...</p>
              </div>
            )}
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Tickets */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <LifeBuoy className="w-3.5 h-3.5" /> Chamados de Suporte
           </h3>
           <div className="space-y-3">
              {tickets.length > 0 ? tickets.map((t: any) => (
                <div key={t.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${t.category === 'BUG' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {t.category}
                         </span>
                         <span className="text-xs font-bold text-zinc-200">{t.subject}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[300px]">{t.message}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-zinc-600 uppercase">{t.user.email}</p>
                      <button className="text-[9px] font-black text-purple-400 uppercase tracking-widest hover:text-purple-300">Responder</button>
                   </div>
                </div>
              )) : (
                <p className="text-center py-10 text-[9px] text-zinc-600 font-bold uppercase">Nenhum chamado aberto.</p>
              )}
           </div>
        </div>

        {/* User Breakdown */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Base de Usuários</h3>
           <div className="space-y-3">
              {Array.isArray(data?.metrics?.totalUsers) ? data.metrics.totalUsers.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-zinc-500">{u.role}</span>
                    <span className="text-xl font-black text-zinc-50">{u._count._all}</span>
                </div>
              )) : null}
           </div>
        </div>
      </div>
    </div>
  );
}
