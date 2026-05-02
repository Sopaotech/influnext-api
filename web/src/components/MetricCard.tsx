'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number | null | undefined;
  icon: LucideIcon;
  change?: number; // Variação em porcentagem
  highlightColor?: string;
}

export function MetricCard({ title, value, icon: Icon, change, highlightColor }: MetricCardProps) {
  const isSyncing = value === null || value === undefined || value === 0;
  const displayValue = isSyncing ? "--" : value;
  
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-[#100c1e] border border-[#1e1430] p-4 md:p-5 rounded-2xl shadow-xl space-y-4 group transition-all hover:border-purple-500/30">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-[#080810] rounded-xl border border-[#1e1430] group-hover:border-purple-500/20 transition-colors">
          <Icon className="w-4 h-4 text-purple-400" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isPositive ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20' : 
            isNegative ? 'bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20' :
            'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}>
            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : isNegative ? <TrendingDown className="w-2.5 h-2.5" /> : null}
            {isPositive ? '+' : ''}{change}%
          </div>
        )}
        {isSyncing && !change && (
          <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">
            Sincronizando...
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-0.5">
          {title}
        </p>
        <h4 
          className={`text-xl md:text-2xl font-black text-[#e8e0f5] tracking-tighter ${highlightColor ? 'animate-pulse' : ''}`}
          style={highlightColor ? { color: highlightColor } : {}}
        >
          {displayValue}
        </h4>
      </div>
    </div>
  );
}
