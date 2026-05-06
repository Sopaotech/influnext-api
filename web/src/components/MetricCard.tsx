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
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  description,
  trend = 'neutral',
  className = ""
}: MetricCardProps) {
  const isPositive = change && change > 0;
  
  return (
    <div className={`group relative overflow-hidden rounded-[2rem] bg-white border border-slate-100 p-4 md:p-6 hover:border-purple-500/30 transition-all duration-500 hover:shadow-[0_20px_50px_-20px_rgba(139,92,246,0.1)] ${className}`}>
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full group-hover:bg-purple-500/10 transition-colors duration-500" />
      
      <div className="flex flex-col h-full justify-between gap-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-purple-50 border-purple-100 transition-all duration-500">
            <Icon className="w-5 h-5 text-slate-400 group-hover:text-purple-600" />
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
              isPositive 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                : 'bg-rose-50 border-rose-100 text-rose-600'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {title}
          </p>
          <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter group-hover:text-purple-700 transition-colors">
            {value}
          </h4>
        </div>

        {description && (
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed border-t border-slate-50 pt-3">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
