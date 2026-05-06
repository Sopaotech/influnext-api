'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Rocket, 
  BarChart3, 
  Clock, 
  Target 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const BENEFITS = [
  {
    title: 'Media Kit Dinâmico',
    description: 'Suas métricas atualizadas em tempo real. Nunca mais envie um PDF desatualizado.',
    icon: BarChart3
  },
  {
    title: 'Cérebro de IA',
    description: 'Roteiros, briefings e sugestões de conteúdo baseados em tendências globais.',
    icon: Zap
  },
  {
    title: 'Marketplace VIP',
    description: 'Prioridade na visualização do seu perfil pelas marcas que buscam contratar.',
    icon: Target
  },
  {
    title: 'Contratos & Escrow',
    description: 'Garantia de recebimento. O dinheiro fica seguro até você entregar o trabalho.',
    icon: ShieldCheck
  },
  {
    title: 'Agenda Inteligente',
    description: 'Organização automática de prazos, entregas e reuniões com marcas.',
    icon: Clock
  },
  {
    title: 'Suporte 24/7',
    description: 'Atendimento prioritário para resolver qualquer dúvida ou problema na hora.',
    icon: Crown
  }
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { api } = await import('@/lib/api');
      
      const res = await api.post('/payments/create-subscription', {
        planId: 'plan_pro_influencer_1'
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Erro ao iniciar checkout:', err);
      alert('Não foi possível iniciar o checkout. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Upgrade para o Plano Pro</h1>
          <p className="text-zinc-500 font-medium">Desbloqueie todo o poder da InfluNext e escale sua carreira.</p>
        </div>
        <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/5">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Teste Grátis de 7 dias disponível</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Benefits Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((benefit, idx) => (
            <div key={idx} className="p-8 bg-slate-900/50 border border-white/[0.03] rounded-[2rem] space-y-4 hover:border-purple-500/30 transition-all group shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/10">
                <benefit.icon className="w-7 h-7 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-white text-xl tracking-tight leading-none">{benefit.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed font-bold">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Checkout Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-white border border-purple-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-8 h-full shadow-2xl shadow-purple-500/5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
               <Rocket className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Aceleração de Elite</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">InfluNext <span className="text-purple-500 italic">PRO</span></h2>
              <div className="flex items-baseline gap-1 justify-center py-6">
                <span className="text-2xl font-black text-slate-400">R$</span>
                <span className="text-8xl font-black text-slate-900 tracking-tighter">97</span>
                <span className="text-xl font-bold text-slate-400">/mês</span>
              </div>
            </div>

            <button 
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-5 bg-white text-[#080810] font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'CARREGANDO...' : 'ASSINAR AGORA'} <CheckCircle2 className="w-5 h-5" />
            </button>

            <div className="space-y-4 pt-4 border-t border-white/5 w-full">
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sem fidelidade • Cancele quando quiser</p>
               <div className="flex items-center justify-center gap-2 opacity-40">
                  <div className="h-6 w-10 bg-zinc-700 rounded-md" />
                  <div className="h-6 w-10 bg-zinc-700 rounded-md" />
                  <div className="h-6 w-10 bg-zinc-700 rounded-md" />
               </div>
            </div>
          </div>
        </div>

      </div>

      {/* Social Proof Banner */}
      <div className="p-8 bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 rounded-2xl flex items-center gap-6">
         <div className="flex -space-x-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-[#080810] bg-zinc-800" />
            ))}
         </div>
         <p className="text-sm font-medium text-zinc-300">
            Mais de <span className="text-white font-black">450 influencers</span> já escalaram sua carreira com o InfluNext Pro só este mês.
         </p>
      </div>
    </div>
  );
}
