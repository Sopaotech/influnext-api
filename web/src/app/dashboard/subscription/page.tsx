'use client';

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

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Upgrade para o Plano Pro</h1>
          <p className="text-zinc-500 font-medium">Desbloqueie todo o poder da InfluNext e escale sua carreira.</p>
        </div>
        <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
           <span className="text-xs font-black text-purple-400 uppercase tracking-widest italic">Trial de 15 dias ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Benefits Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((benefit, idx) => (
            <div key={idx} className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl space-y-4 hover:border-purple-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <benefit.icon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-white text-lg">{benefit.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Checkout Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#100c1e] border border-purple-500/30 rounded-[2.5rem] p-10 flex flex-col items-center text-center space-y-8 h-full">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_40px_rgba(192,132,252,0.3)]">
              <Rocket className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">Sua jornada começa aqui</span>
              <h2 className="text-2xl font-black text-white">InfluNext PRO</h2>
              <div className="flex items-baseline gap-1 justify-center py-4">
                <span className="text-2xl font-black text-zinc-500">R$</span>
                <span className="text-7xl font-black text-white tracking-tighter">97</span>
                <span className="text-lg font-bold text-zinc-500">/mês</span>
              </div>
            </div>

            <button className="w-full py-5 bg-white text-[#080810] font-black rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-2">
              ASSINAR AGORA <CheckCircle2 className="w-5 h-5" />
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
