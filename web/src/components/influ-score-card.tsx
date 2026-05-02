'use client';

import React from 'react';
import { Trophy, Info, Sparkles, ShieldCheck } from 'lucide-react';

interface InfluScoreCardProps {
  score: number;
}

export function InfluScoreCard({ score }: InfluScoreCardProps) {
  // Define o tier baseado no score
  const getTier = (s: number) => {
    if (s <= 300) return "BRONZE";
    if (s <= 600) return "SILVER";
    if (s <= 850) return "GOLD";
    return "ELITE";
  };

  const tier = getTier(score);

  // Configurações visuais por Tier
  const configs = {
    BRONZE: {
      bg: "from-[#2d1a0e] to-[#3d2410]",
      border: "border-[#8B4513]",
      glow: "shadow-[#CD7F3260]",
      bar: "bg-gradient-to-r from-[#8B4513] to-[#CD7F32]",
      text: "text-orange-200",
      icon: "text-[#CD7F32]"
    },
    SILVER: {
      bg: "from-[#1a1a1e] to-[#2a2a32]",
      border: "border-[#9E9E9E]",
      glow: "shadow-[#C0C0C060]",
      bar: "bg-gradient-to-r from-[#757575] to-[#C0C0C0]",
      text: "text-zinc-200",
      icon: "text-[#C0C0C0]"
    },
    GOLD: {
      bg: "from-[#1f1800] to-[#2e2200]",
      border: "border-[#D4AF37]",
      glow: "shadow-[#FFD70070]",
      bar: "bg-gradient-to-r from-[#D4AF37] to-[#FFD700]",
      text: "text-yellow-100",
      icon: "text-[#FFD700]"
    },
    ELITE: {
      bg: "from-[#1a0533] to-[#2d0a4e]",
      border: "border-[#C026D3]",
      glow: "shadow-[#C026D380]",
      bar: "bg-gradient-to-r from-[#C026D3] to-[#E879F9]",
      text: "text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-purple-400 font-black",
      icon: "text-[#C026D3]"
    }
  };

  const config = configs[tier];

  return (
    <div className={`
      relative overflow-hidden rounded-[14px] p-[20px_24px] border bg-gradient-to-br ${config.bg} ${config.border} shadow-2xl ${config.glow}
      flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500
    `}>
      {/* Background Decorative Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 rounded-full ${config.icon.replace('text-', 'bg-')}`} />

      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${config.icon}`}>
            {tier === 'ELITE' ? <Sparkles className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
          </div>
          <div>
            <h3 className={`text-xs font-black tracking-widest uppercase opacity-70 ${tier === 'ELITE' ? 'text-purple-300' : 'text-white'}`}>
              InfluScore Status
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black tracking-tighter ${tier === 'ELITE' ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400' : 'text-white'}`}>
                {tier}
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-4xl font-black tracking-tighter ${tier === 'ELITE' ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400' : 'text-white'}`}>
            {score}
          </div>
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pontos</div>
        </div>
      </div>

      <div className="space-y-2 z-10">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          <span>Nível Atual: {tier}</span>
          <span>Meta: {tier === 'ELITE' ? '1000' : tier === 'GOLD' ? '851+' : tier === 'SILVER' ? '601+' : '301+'}</span>
        </div>
        <div className="h-[5px] w-full bg-white/15 rounded-full overflow-hidden">
          <div 
            className={`h-full ${config.bar} transition-all duration-1000 ease-out`} 
            style={{ width: `${(score / 1000) * 100}%` }}
          />
        </div>
      </div>

      <footer className="flex items-start gap-2 pt-2 border-t border-white/5 z-10">
        <Info className="w-3 h-3 text-zinc-500 mt-0.5 shrink-0" />
        <p className="text-[10px] leading-relaxed text-zinc-500 font-medium">
          Score calculado com base em seguidores, engajamento, consistência e avaliações dos últimos 30 dias.
        </p>
      </footer>
    </div>
  );
}
