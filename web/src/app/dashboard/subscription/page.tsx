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

  const isAlreadyPro = user?.role === 'ADMIN' || user?.subscriptionStatus === 'PRO';

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            {isAlreadyPro ? 'Seu Plano InfluNext' : 'Upgrade para o Plano Pro'}
          </h1>
          <p className="text-slate-500 font-bold">
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
            <div key={idx} className="p-8 bg-white border border-slate-100 rounded-[2rem] space-y-4 hover:border-purple-500/50 transition-all group shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/20">
                <benefit.icon className="w-7 h-7 text-purple-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-xl tracking-tight leading-none">{benefit.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed font-bold">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Checkout Card */}
        {!isAlreadyPro ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-white border border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-8 h-full shadow-xl">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                 <Rocket className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-2">
                <span className="text-purple-600 text-[10px] font-black uppercase tracking-[0.3em]">Aceleração de Elite</span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">InfluNext <span className="text-purple-600 italic">PRO</span></h2>
                <div className="flex items-baseline gap-1 justify-center py-6">
                  <span className="text-2xl font-black text-slate-400">R$</span>
                  <span className="text-8xl font-black text-slate-900 tracking-tighter">97</span>
                  <span className="text-xl font-bold text-slate-400">/mês</span>
                </div>
              </div>

              <button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'CARREGANDO...' : 'ASSINAR AGORA'} <CheckCircle2 className="w-5 h-5" />
              </button>

              <div className="space-y-4 pt-4 border-t border-slate-100 w-full">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem fidelidade • Cancele quando quiser</p>
                 <div className="flex items-center justify-center gap-2 opacity-20">
                    <div className="h-6 w-10 bg-slate-100 rounded-md border border-slate-200" />
                    <div className="h-6 w-10 bg-slate-100 rounded-md border border-slate-200" />
                    <div className="h-6 w-10 bg-slate-100 rounded-md border border-slate-200" />
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 bg-gradient-to-br from-emerald-900/20 to-transparent border border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center text-center justify-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Ativo</h3>
              <p className="text-zinc-400 text-sm font-medium">Sua conta possui privilégios de Elite. Aproveite todas as ferramentas!</p>
            </div>
            <Link 
              href="/dashboard/influencer"
              className="px-8 py-3 bg-white text-black font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-colors"
            >
              Ir para o Dashboard
            </Link>
          </div>
        )}

      </div>

      {/* Social Proof Banner */}
      {!isAlreadyPro && (
        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex items-center gap-8 shadow-sm group hover:border-purple-300 transition-all relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <Rocket className="w-20 h-20 text-purple-600" />
           </div>
           <div className="flex -space-x-4 relative z-10">
              <div className="w-14 h-14 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_1_1778513115825.png" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_2_1778513129863.png" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_3_1778513143227.png" className="w-full h-full object-cover" />
              </div>
              <div className="w-14 h-14 rounded-full border-4 border-white bg-slate-100 shadow-xl overflow-hidden">
                <img src="/influencers/brazilian_influencer_4_1778513156892.png" className="w-full h-full object-cover" />
              </div>
           </div>
           <p className="text-sm font-bold text-slate-500 relative z-10">
              Mais de <span className="text-slate-900 font-black">450 influencers brasileiros</span> já escalaram sua carreira com o InfluNext Pro este mês.
           </p>
        </div>
      )}
    </div>
  );
}
