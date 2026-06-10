'use client';

import React, { useState, useEffect } from 'react';
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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { api } = await import('@/lib/api');
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    };
    fetchUser();
  }, []);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { api } = await import('@/lib/api');
      
      const isCompany = user?.role === 'COMPANY';
      const planId = isCompany ? 'plan_brand_enterprise_1' : 'plan_pro_influencer_1';

      const res = await api.post('/payments/create-subscription', {
        planId
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

  const isAlreadyPro = user?.role === 'ADMIN' || user?.subscriptionStatus === 'ACTIVE';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            {isAlreadyPro ? 'Seu Plano InfluNext' : 'Upgrade para o Plano Pro'}
          </h1>
          <p className="text-zinc-400 font-bold">
            {isAlreadyPro 
              ? 'Você já possui acesso total a todos os recursos de elite.' 
              : 'Desbloqueie todo o poder da InfluNext e escale sua carreira.'}
          </p>
        </div>
        {!isAlreadyPro && (
          <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Teste Grátis de 7 dias disponível</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Benefits Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((benefit, idx) => (
            <div key={idx} className="p-8 bg-black/35 border border-white/5 rounded-[2rem] space-y-4 hover:border-purple-500/50 transition-all group shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/20">
                <benefit.icon className="w-7 h-7 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-white text-xl tracking-tight leading-none">{benefit.title}</h3>
                <p className="text-[13px] text-zinc-400 leading-relaxed font-bold">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Ecosystem Model Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-black/35 border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-8 h-full shadow-xl">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/20">
               <ShieldCheck className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Modelo de Parceria</span>
              <h2 className="text-3xl font-black text-white tracking-tighter">Crescemos <span className="text-zinc-400 italic">Juntos</span></h2>
              
              <div className="py-6 space-y-4">
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black text-white tracking-tighter">15%</span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Comissão por Job Fechado</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                  Você não paga mensalidade para usar as ferramentas de elite. Nós só ganhamos quando você ganha. Risco zero para sua carreira.
                </p>
              </div>
            </div>

            <div className="w-full p-6 bg-white/5 rounded-2xl border border-white/10 text-left space-y-3">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Plano Grátis</span>
               </div>
               <p className="text-[10px] font-bold text-zinc-500">Acesso a todas as ferramentas (IA, Media Kit, Contratos) sem custo fixo.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10 w-full">
               <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Upgrade Opcional</p>
               <p className="text-[10px] text-zinc-400 font-bold">
                 {user?.role === 'COMPANY' 
                   ? 'Plano de R$497/mês para remover todas as taxas de transação.' 
                   : 'Plano de R$97/mês para reduzir a comissão para 5% e acesso total.'}
               </p>
               {!isAlreadyPro && (
                 <button
                   onClick={handleSubscribe}
                   disabled={isLoading}
                   className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-450 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] disabled:opacity-50"
                 >
                   {isLoading ? 'Processando...' : 'Fazer Upgrade Agora'}
                 </button>
               )}
            </div>
          </div>
        </div>

      </div>

      {/* Social Proof Banner */}
      {!isAlreadyPro && (
        <div className="p-8 bg-black/35 border border-white/5 rounded-[2.5rem] flex items-center gap-8 shadow-sm group hover:border-purple-500/25 transition-all relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Rocket className="w-20 h-20 text-purple-600" />
           </div>
           <div className="flex -space-x-4 relative z-10">
              <div className="w-14 h-14 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_1_1778513115825.png" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_2_1778513129863.png" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_3_1778513143227.png" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-slate-900 bg-slate-800 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_4_1778513156892.png" className="w-full h-full object-cover" />
              </div>
           </div>
           <p className="text-sm font-bold text-zinc-400 relative z-10">
              Mais de <span className="text-white font-black">450 influencers brasileiros</span> já escalaram sua carreira com o InfluNext Pro este mês.
           </p>
        </div>
      )}
    </div>
  );
}
