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

  // Configurações visuais por Tier - Light Mode Premium Palette (100% Branco e Laranja Oficial)
  const configs = {
    BRONZE: {
      bg: "from-white via-slate-50 to-white",
      border: "border-orange-200/60",
      glow: "shadow-sm",
      bar: "bg-gradient-to-r from-orange-400 to-amber-300",
      text: "text-slate-900",
      icon: "text-orange-500",
      iconBg: "bg-orange-50 border-orange-100"
    },
    SILVER: {
      bg: "from-white via-slate-50 to-white",
      border: "border-slate-200",
      glow: "shadow-sm",
      bar: "bg-gradient-to-r from-slate-400 to-slate-300",
      text: "text-slate-900",
      icon: "text-slate-600",
      iconBg: "bg-slate-100 border-slate-200"
    },
    GOLD: {
      bg: "from-white via-amber-50/40 to-white",
      border: "border-amber-200",
      glow: "shadow-md shadow-amber-500/5",
      bar: "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400",
      text: "text-slate-950",
      icon: "text-amber-600",
      iconBg: "bg-amber-50 border-amber-200"
    },
    ELITE: {
      bg: "from-orange-500/10 via-amber-500/5 to-white",
      border: "border-orange-300/80",
      glow: "shadow-lg shadow-orange-500/10",
      bar: "bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400",
      text: "text-slate-950",
      icon: "text-orange-600",
      iconBg: "bg-orange-100 border-orange-200"
    }
  };

  const config = configs[tier];

  return (
    <div className={`
      relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 border bg-gradient-to-br ${config.bg} ${config.border} ${config.glow}
      flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-700
    `}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 blur-3xl -mr-10 -mt-10 rounded-full bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
      
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${config.iconBg} ${config.icon} shadow-sm`}>
            {tier === 'ELITE' ? <Sparkles className="w-7 h-7" /> : <Trophy className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Classificação Atual</span>
               {tier === 'ELITE' && (
                 <div className="bg-orange-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-orange-200">
                    <Zap className="w-2.5 h-2.5 text-orange-500" />
                    <span className="text-[8px] font-black text-orange-600 uppercase">Top 1% Elite</span>
                 </div>
               )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black tracking-tighter ${config.text}`}>
                {tier}
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="flex items-baseline justify-end gap-0.5">
             <div className="text-5xl font-black tracking-tighter leading-none text-slate-950">
               {normalizedScore}
             </div>
             <div className="text-slate-400 font-bold text-sm leading-none">
                /100
             </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest mt-2 text-slate-400">Pontuação Global</div>
        </div>
      </div>

      <div className="space-y-3 z-10">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-1 text-slate-400">
          <span>Sincronização Ativa</span>
          <span>Próximo Nível: {tier === 'ELITE' ? 'MAX' : tier === 'GOLD' ? '86+' : tier === 'SILVER' ? '61+' : '31+'}</span>
        </div>
        <div className="h-2.5 w-full rounded-full overflow-hidden border p-[1px] bg-slate-100 border-slate-200">
          <div 
            className={`h-full ${config.bar} rounded-full transition-all duration-1000 ease-out shadow-sm`} 
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
      </div>

      <footer className="flex items-center gap-3 pt-4 border-t border-slate-100 z-10 opacity-80 hover:opacity-100 transition-opacity">
        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400">
           <Info className="w-3.5 h-3.5" />
        </div>
        <p className="text-[9px] leading-relaxed font-bold uppercase tracking-tight text-slate-500">
          O InfluScore é dinâmico e reflete sua autoridade digital nos últimos 30 dias.
        </p>
      </footer>
    </div>
  );
}
