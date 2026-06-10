'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  isDark?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  description,
  trend = 'neutral',
  className = "",
  isDark = true
}: MetricCardProps) {
  const isPositive = change && change > 0;
  
  const cardBg = isDark 
    ? 'bg-white/[0.04] border-white/[0.08] hover:border-violet-500/30 hover:bg-white/[0.06] hover:shadow-[0_20px_50px_-20px_rgba(139,92,246,0.15)]' 
    : 'bg-white border-slate-100 hover:border-purple-500/30 hover:shadow-[0_20px_50px_-20px_rgba(139,92,246,0.1)]';

  const iconBg = isDark
    ? 'bg-white/[0.04] border-white/[0.08] group-hover:bg-violet-500/15 group-hover:border-violet-500/30'
    : 'bg-slate-50 border-slate-100 group-hover:bg-purple-50 border-purple-100';

  const iconColor = isDark
    ? 'text-zinc-400 group-hover:text-violet-400'
    : 'text-slate-400 group-hover:text-purple-600';

  const titleColor = isDark ? 'text-zinc-500' : 'text-slate-400';
  
  const valueColor = isDark 
    ? 'text-white group-hover:text-violet-400' 
    : 'text-slate-900 group-hover:text-purple-700';

  const descColor = isDark ? 'text-zinc-400 border-white/[0.06]' : 'text-slate-500 border-slate-50';

  return (
    <div className={`group relative overflow-hidden rounded-[2rem] border p-4 md:p-6 transition-all duration-500 ${cardBg} ${className}`}>
      {/* Decorative background glow element */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-2xl rounded-full transition-colors duration-500 ${
        isDark ? 'bg-violet-500/5 group-hover:bg-violet-500/10' : 'bg-purple-500/5 group-hover:bg-purple-500/10'
      }`} />
      
      <div className="flex flex-col h-full justify-between gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-2xl border transition-all duration-500 ${iconBg}`}>
            <Icon className={`w-5 h-5 transition-colors duration-500 ${iconColor}`} />
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
              isPositive 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${titleColor}`}>
            {title}
          </p>
          <h4 className={`text-2xl md:text-3xl font-black tracking-tighter transition-colors ${valueColor}`}>
            {value}
          </h4>
        </div>

        {description && (
          <p className={`text-[10px] font-bold leading-relaxed border-t pt-3 transition-colors ${descColor}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
