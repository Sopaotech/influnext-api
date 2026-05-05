'use client';

import React from 'react';
import { Trophy, Info, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface InfluScoreCardProps {
  score: number;
}

export function InfluScoreCard({ score }: InfluScoreCardProps) {
  // Define o tier baseado no score (Unificado 0-100)
  const getTier = (s: number) => {
    if (s <= 30) return "BRONZE";
    if (s <= 60) return "SILVER";
    if (s <= 85) return "GOLD";
    return "ELITE";
  };

  const tier = getTier(score);

  // Configurações visuais por Tier - Premium Palette
  const configs = {
    BRONZE: {
      bg: "from-[#1a110a] to-[#26180e]",
      border: "border-orange-900/30",
      glow: "shadow-orange-900/10",
      bar: "bg-gradient-to-r from-orange-700 to-orange-400",
      text: "text-orange-200",
      icon: "text-orange-500"
    },
    SILVER: {
      bg: "from-[#0f172a] to-[#1e293b]",
      border: "border-slate-800",
      glow: "shadow-slate-900/20",
      bar: "bg-gradient-to-r from-slate-500 to-slate-300",
      text: "text-slate-200",
      icon: "text-slate-400"
    },
    GOLD: {
      bg: "from-[#1a1600] to-[#2b2400]",
      border: "border-yellow-900/30",
      glow: "shadow-yellow-900/10",
      bar: "bg-gradient-to-r from-yellow-600 to-yellow-300",
      text: "text-yellow-100",
      icon: "text-yellow-500"
    },
    ELITE: {
      bg: "from-[#0f0b1a] to-[#1a0b2e]",
      border: "border-purple-500/20",
      glow: "shadow-purple-500/10",
      bar: "bg-gradient-to-r from-purple-600 to-indigo-400",
      text: "text-purple-200",
      icon: "text-purple-500"
    }
  };

  const config = configs[tier];

  return (
    <div className={`
      relative overflow-hidden rounded-3xl p-6 border bg-gradient-to-br ${config.bg} ${config.border} shadow-2xl ${config.glow}
      flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-700
    `}>
      {/* Premium Decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/5 to-transparent blur-3xl -mr-10 -mt-10 rounded-full" />
      
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${config.icon} shadow-inner`}>
            {tier === 'ELITE' ? <Sparkles className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">Classificação Atual</span>
               {tier === 'ELITE' && (
                 <div className="bg-purple-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-500/20">
                    <Zap className="w-2.5 h-2.5 text-purple-400" />
                    <span className="text-[8px] font-black text-purple-300 uppercase">Top 1%</span>
                 </div>
               )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black tracking-tighter ${tier === 'ELITE' ? 'text-white' : 'text-zinc-100'}`}>
                {tier}
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400/80" />
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="relative inline-block">
             <div className={`text-5xl font-black tracking-tighter ${tier === 'ELITE' ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-400' : 'text-white'}`}>
               {score}
             </div>
             <div className="absolute -top-1 -right-4">
                <span className="text-zinc-500 font-bold text-xs">/100</span>
             </div>
          </div>
          <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Pontuação Global</div>
        </div>
      </div>

      <div className="space-y-3 z-10">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">
          <span>Sincronização Ativa</span>
          <span>Próximo Nível: {tier === 'ELITE' ? 'MAX' : tier === 'GOLD' ? '86+' : tier === 'SILVER' ? '61+' : '31+'}</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
          <div 
            className={`h-full ${config.bar} rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(139,92,246,0.3)]`} 
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <footer className="flex items-center gap-3 pt-4 border-t border-white/5 z-10 opacity-60 hover:opacity-100 transition-opacity">
        <div className="bg-zinc-800/50 p-1.5 rounded-lg">
           <Info className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <p className="text-[9px] leading-relaxed text-zinc-500 font-bold uppercase tracking-tight">
          O InfluScore é dinâmico e reflete sua autoridade digital nos últimos 30 dias.
        </p>
      </footer>
    </div>
  );
}
