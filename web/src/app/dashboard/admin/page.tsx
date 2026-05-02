'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { Users, DollarSign, FileText, AlertTriangle, ShieldCheck, Activity, TrendingUp, BarChart3 } from 'lucide-react';

interface AdminStats {
  metrics: {
    totalUsers: Array<{ role: string; _count: { _all: number } }>;
    gmv: number;
    revenue: number;
    newUsersLast7Days: number;
    marketplaceHealth: Array<{ escrowStatus: string; _count: { _all: number } }>;
    totalContracts: number;
  };
  disputes: any[];
  status: string;
  serverTime: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchStats();
  }, []);

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

  const totalUsersCount = data?.metrics.totalUsers.reduce((acc, curr) => acc + curr._count._all, 0) || 0;
  
  // Encontrar contagem de DRAFT e COMPLETED para saúde do mercado
  const draftCount = data?.metrics.marketplaceHealth.find(h => h.escrowStatus === 'DRAFT')?._count._all || 0;
  const completedCount = data?.metrics.marketplaceHealth.find(h => h.escrowStatus === 'COMPLETED')?._count._all || 0;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
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

      {/* Main Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          title="Faturamento (Lucro IX)" 
          value={formatCurrency(data?.metrics.revenue)} 
          icon={TrendingUp}
          highlightColor="#fbbf24"
        />
        <MetricCard 
          title="Volume GMV (Mercado)" 
          value={formatCurrency(data?.metrics.gmv)} 
          icon={DollarSign} 
        />
        <MetricCard 
          title="Novos Usuários (7d)" 
          value={data?.metrics.newUsersLast7Days || 0} 
          icon={Users} 
        />
        <MetricCard 
          title="Disputas Críticas" 
          value={data?.disputes.length || 0} 
          icon={AlertTriangle} 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Marketplace Health */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-8">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> Saúde do Ecossistema
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Taxa de Conversão</p>
                 <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    {completedCount > 0 ? ((completedCount / (data?.metrics.totalContracts || 1)) * 100).toFixed(1) : 0}%
                 </p>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${(completedCount / (data?.metrics.totalContracts || 1)) * 100}%` }} />
                 </div>
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Propostas em Aberto (Draft)</p>
                 <p className="text-2xl font-black text-zinc-50">{draftCount}</p>
                 <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Aguardando Pagamento</p>
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Total de Contratos</p>
                 <p className="text-2xl font-black text-zinc-50">{data?.metrics.totalContracts}</p>
                 <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Histórico Acumulado</p>
              </div>
           </div>
        </div>

        {/* User Breakdown */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Composição da Base</h3>
           <div className="space-y-3">
              {data?.metrics.totalUsers.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl group hover:border-purple-500/30 transition-all">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tight">{u.role}</span>
                      <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Total Registrado</span>
                   </div>
                   <span className="text-2xl font-black text-zinc-50 group-hover:text-purple-400 transition-colors">{u._count._all}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Disputes / Urgent Action */}
      {data?.disputes && data.disputes.length > 0 && (
        <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Mediação Urgente
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.disputes.map((d: any) => (
                <div key={d.id} className="p-4 bg-zinc-950 border border-red-500/20 rounded-2xl flex justify-between items-center group">
                   <div className="space-y-1">
                      <p className="text-xs font-black text-zinc-50 tracking-tight truncate max-w-[200px]">{d.title}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">Empresa: {d.company.name || d.company.id}</p>
                   </div>
                   <button className="px-4 py-2 bg-red-500/10 text-red-400 text-[10px] font-black uppercase rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                      Intervir
                   </button>
                </div>
              ))}
           </div>
        </section>
      )}

    </div>
  );
}
