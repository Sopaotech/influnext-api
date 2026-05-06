"use client";
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Sparkles, Wallet, LogOut, Bell, Settings } from 'lucide-react';
import { CareerDashboard } from '@/components/dashboard/CareerDashboard';
import { Button } from '@/components/ui/button';

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
      <div className="min-h-screen bg-slate-50 p-10 space-y-10 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-12 w-64 bg-slate-200 rounded-2xl" />
          <div className="h-12 w-32 bg-slate-200 rounded-2xl" />
        </div>
        <div className="h-[300px] bg-slate-200 rounded-[2.5rem]" />
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 h-[500px] bg-slate-200 rounded-[2.5rem]" />
          <div className="h-[500px] bg-slate-200 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const escrowBalance = data?.kpis?.escrowBalance ?? 0;

  return (
    <div className="space-y-12 pb-20">
      
      {/* Header Summary */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Gestão Inteligente</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Seu Escritório <span className="text-slate-400 font-medium">Digital</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white border border-slate-100 px-6 md:px-8 py-5 rounded-[2.5rem] flex items-center gap-6 shadow-sm hover:border-purple-200 transition-all group">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                 </div>
                 <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Saldo Disponível</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(escrowBalance)}
                    </span>
                 </div>
              </div>
              <Button className="rounded-full bg-slate-900 text-white font-black text-[10px] uppercase h-10 px-6 hover:bg-purple-600 transition-colors">Sacar</Button>
           </div>
        </div>
      </header>

      {/* Integration of the New Career Dashboard Component */}
      <CareerDashboard influencer={{
        id: data?.profile?.id,
        careerObjective: data?.profile?.careerObjective || 'GROWTH',
        influScore: data?.kpis?.influScore || 0
      }} />

      {/* Footer Branding - Soft & Professional */}
      <footer className="border-t border-slate-100 py-12 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
        <div className="flex items-center gap-10">
           <div className="space-y-1">
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Proteção de Dados</span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase">Ambiente Seguro</span>
              </div>
           </div>
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
           <span>InfluNext // Ecossistema Digital</span>
           <div className="h-1 w-1 bg-slate-200 rounded-full" />
           <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}

