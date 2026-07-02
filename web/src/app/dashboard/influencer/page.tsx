"use client";
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Wallet, LogOut, Bell, Settings, TrendingUp } from 'lucide-react';
import { CareerDashboard } from '@/components/dashboard/CareerDashboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function InfluencerDashboard() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashRes = await api.get<any>('/dashboard/influencer');
        setData(dashRes.data);
      } catch (err: any) {
        toast.error('Falha ao conectar com o servidor.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-10 space-y-10 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-12 w-64 bg-white/10 rounded-2xl" />
          <div className="h-12 w-32 bg-white/10 rounded-2xl" />
        </div>
        <div className="h-[300px] bg-white/10 rounded-[2.5rem]" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-[500px] bg-white/10 rounded-[2.5rem]" />
          <div className="h-[500px] bg-white/10 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const escrowBalance = data?.kpis?.escrowBalance ?? 0;
  const isDark = data?.userState?.theme === 'dark';

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      
      {/* Header Summary - Glassy & Minimal */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="space-y-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2">
            <Sparkles className="w-3 md:w-4 h-3 md:h-4 text-slate-400 animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Gestão Inteligente</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl md:text-7xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-slate-900 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]'}`}>
            Escritório <span className={`${isDark ? 'text-zinc-400' : 'text-slate-500'} font-medium italic`}>Digital</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
           {/* Total Earnings Card */}
           <div 
             className={`px-5 md:px-8 py-4 md:py-6 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-between sm:justify-start gap-4 md:gap-6 shadow-xl transition-all group w-full sm:w-auto ${
               isDark 
                 ? 'bg-black/35 border border-white/5 hover:bg-black/50 text-white' 
                 : 'bg-white/40 border border-white/50 hover:bg-white/60 text-slate-900'
             }`}
             style={{ backdropFilter: 'blur(30px)' }}
           >
              <div className="flex items-center gap-3 md:gap-4">
                 <div className="p-3 md:p-4 bg-orange-600 text-white rounded-xl md:rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-orange-500/20">
                    <Wallet className="w-4 md:w-5 h-4 md:h-5" />
                 </div>
                 <div className="text-left">
                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest block mb-0.5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>Saldo Disponível</span>
                    <span className={`text-xl md:text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(escrowBalance)}
                    </span>
                 </div>
              </div>
              <Link 
                href="/dashboard/influencer/wallet"
                className={`rounded-full font-black text-[9px] md:text-[10px] uppercase h-10 md:h-12 px-6 md:px-8 transition-colors shadow-xl flex items-center justify-center ${
                  isDark 
                    ? 'bg-white text-slate-950 hover:bg-orange-600 hover:text-white' 
                    : 'bg-slate-900 text-white hover:bg-orange-600'
                }`}
              >
                Sacar
              </Link>
           </div>

           {/* Quick Stats Mini Card */}
           <div className={`px-5 md:px-8 py-4 md:py-6 rounded-[2rem] md:rounded-[2.5rem] flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-1 shadow-2xl min-w-[140px] md:min-w-[180px] ${
             isDark 
               ? 'bg-white text-slate-950' 
               : 'bg-slate-900 text-white'
           }`}>
              <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Performance</span>
              <div className="flex items-center gap-2">
                 <span className="text-lg md:text-2xl font-black tracking-tighter text-orange-500">
                    {data?.kpis?.totalEarned && data.kpis.totalEarned > 0
                      ? `+R$ ${data.kpis.totalEarned >= 1000 ? `${(data.kpis.totalEarned / 1000).toFixed(0)}k` : data.kpis.totalEarned}`
                      : 'R$ 0'}
                 </span>
                 <TrendingUp className="w-3 md:w-4 h-3 md:h-4 text-orange-500" />
              </div>
           </div>
        </div>
      </header>

      {/* Integration of the New Career Dashboard Component */}
      <CareerDashboard influencer={{
        id: data?.profile?.id,
        careerObjective: data?.profile?.careerObjective || 'GROWTH',
        influScore: data?.kpis?.influScore || 0,
        theme: data?.userState?.theme
      }} />

      {/* Footer Branding - Transparent */}
      <footer className="border-t border-white/10 py-12 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
        <div className="flex items-center gap-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
           <span>Ambiente Seguro InfluNext // 2026</span>
        </div>
        <div className="flex items-center gap-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">
           Proteção de Dados Garantida
        </div>
      </footer>
    </div>
  );
}


