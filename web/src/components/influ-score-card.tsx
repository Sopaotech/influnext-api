'use client';

import React from 'react';
import { Trophy, Info, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface InfluScoreCardProps {
  score: number;
}

export function InfluScoreCard({ score }: InfluScoreCardProps) {
  // Normaliza o score para a escala 0-100 se vier na escala 0-1000 do backend
  const normalizedScore = Math.min(100, Math.max(0, score > 100 ? Math.round(score / 10) : Math.round(score)));

  // Define o tier baseado no score (Unificado 0-100)
  const getTier = (s: number) => {
    if (s <= 30) return "BRONZE";
    if (s <= 60) return "SILVER";
    if (s <= 85) return "GOLD";
    return "ELITE";
  };

  const tier = getTier(normalizedScore);

  // Configurações visuais por Tier - Light Mode Premium Palette
  const configs = {
    BRONZE: {
      bg: "from-white to-slate-50",
      border: "border-orange-200/50",
      glow: "shadow-[0_10px_40px_-15px_rgba(249,115,22,0.15)]",
      bar: "bg-gradient-to-r from-orange-400 to-orange-300",
      text: "text-slate-800",
      icon: "text-orange-500",
      iconBg: "bg-orange-50 border-orange-100"
    },
    SILVER: {
      bg: "from-white to-slate-50",
      border: "border-slate-200",
      glow: "shadow-[0_10px_40px_-15px_rgba(148,163,184,0.2)]",
      bar: "bg-gradient-to-r from-slate-400 to-slate-300",
      text: "text-slate-800",
      icon: "text-slate-500",
      iconBg: "bg-slate-100 border-slate-200"
    },
    GOLD: {
      bg: "from-white to-amber-50/30",
      border: "border-amber-200/60",
      glow: "shadow-[0_10px_40px_-15px_rgba(245,158,11,0.15)]",
      bar: "bg-gradient-to-r from-amber-400 to-amber-300",
      text: "text-slate-800",
      icon: "text-amber-500",
      iconBg: "bg-amber-50 border-amber-100"
    },
    ELITE: {
      bg: "from-slate-900 to-black",
      border: "border-slate-800",
      glow: "shadow-[0_15px_50px_-15px_rgba(249,115,22,0.4)]",
      bar: "bg-gradient-to-r from-orange-500 to-amber-400",
      text: "text-white",
      icon: "text-orange-500",
      iconBg: "bg-white/5 border-white/10"
    }
  };

  const config = configs[tier];

  return (
    <div className={`
      relative overflow-hidden rounded-[2rem] p-6 border bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
      flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-700
    `}>
      {/* Premium Decorative elements */}
      <div className={`absolute top-0 right-0 w-48 h-48 blur-3xl -mr-10 -mt-10 rounded-full ${tier === 'ELITE' ? 'bg-gradient-to-br from-orange-500/10 to-transparent' : 'bg-gradient-to-br from-slate-200/50 to-transparent'}`} />
      
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${config.iconBg} ${config.icon} shadow-sm`}>
            {tier === 'ELITE' ? <Sparkles className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${tier === 'ELITE' ? 'text-zinc-400' : 'text-slate-400'}`}>Classificação Atual</span>
               {tier === 'ELITE' && (
                 <div className="bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-500/20">
                    <Zap className="w-2.5 h-2.5 text-orange-400" />
                    <span className="text-[8px] font-black text-orange-500 uppercase">Top 1%</span>
                 </div>
               )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black tracking-tighter ${config.text}`}>
                {tier}
              </span>
              <ShieldCheck className={`w-5 h-5 ${tier === 'ELITE' ? 'text-orange-500' : 'text-emerald-500'}`} />
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="flex items-baseline justify-end gap-0.5">
             <div className={`text-5xl font-black tracking-tighter leading-none ${tier === 'ELITE' ? 'text-transparent bg-clip-text bg-gradient-to-br from-white to-orange-200' : 'text-slate-900'}`}>
               {normalizedScore}
             </div>
             <div className={`${tier === 'ELITE' ? 'text-zinc-500' : 'text-slate-400'} font-bold text-sm leading-none`}>
                /100
             </div>
          </div>
          <div className={`text-[10px] font-black uppercase tracking-widest mt-2 ${tier === 'ELITE' ? 'text-zinc-500' : 'text-slate-400'}`}>Pontuação Global</div>
        </div>
      </div>

      <div className="space-y-3 z-10">
        <div className={`flex justify-between text-[10px] font-black uppercase tracking-widest px-1 ${tier === 'ELITE' ? 'text-zinc-500' : 'text-slate-400'}`}>
          <span>Sincronização Ativa</span>
          <span>Próximo Nível: {tier === 'ELITE' ? 'MAX' : tier === 'GOLD' ? '86+' : tier === 'SILVER' ? '61+' : '31+'}</span>
        </div>
        <div className={`h-2.5 w-full rounded-full overflow-hidden border p-[1px] ${tier === 'ELITE' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
          <div 
            className={`h-full ${config.bar} rounded-full transition-all duration-1000 ease-out shadow-sm`} 
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
      </div>

      <footer className={`flex items-center gap-3 pt-4 border-t z-10 transition-opacity ${tier === 'ELITE' ? 'border-white/10 opacity-70 hover:opacity-100' : 'border-slate-100 opacity-80 hover:opacity-100'}`}>
        <div className={`p-1.5 rounded-lg ${tier === 'ELITE' ? 'bg-zinc-800/50' : 'bg-slate-50'}`}>
           <Info className={`w-3.5 h-3.5 ${tier === 'ELITE' ? 'text-zinc-400' : 'text-slate-400'}`} />
        </div>
        <p className={`text-[9px] leading-relaxed font-bold uppercase tracking-tight ${tier === 'ELITE' ? 'text-zinc-400' : 'text-slate-500'}`}>
          O InfluScore é dinâmico e reflete sua autoridade digital nos últimos 30 dias.
        </p>
      </footer>
    </div>
  );
}
