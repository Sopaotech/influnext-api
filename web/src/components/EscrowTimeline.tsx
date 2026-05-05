'use client';

import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Coins } from 'lucide-react';

export type EscrowStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'DISPUTE';

interface EscrowTimelineProps {
  status: EscrowStatus;
}

const STEPS = [
  { id: 'DEPOSIT', label: 'Depósito', statuses: ['DRAFT', 'PENDING_PAYMENT'] },
  { id: 'WORK', label: 'Produção', statuses: ['IN_PROGRESS'] },
  { id: 'REVIEW', label: 'Revisão', statuses: ['UNDER_REVIEW'] },
  { id: 'RELEASE', label: 'Liberação', statuses: ['COMPLETED'] },
];

export function EscrowTimeline({ status }: EscrowTimelineProps) {
  const getStepState = (stepStatuses: string[], index: number) => {
    const currentIndex = STEPS.findIndex(s => s.statuses.includes(status));
    
    if (status === 'DISPUTE') return 'error';
    if (stepStatuses.includes(status)) return 'active';
    if (index < currentIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const state = getStepState(step.statuses, i);
        const isLast = i === STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center group relative">
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500
                ${state === 'completed' ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 
                  state === 'active' ? 'bg-purple-600 text-white animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 
                  state === 'error' ? 'bg-red-500 text-white' :
                  'bg-zinc-800 text-zinc-600 border border-zinc-700'}
              `}>
                {state === 'completed' ? <CheckCircle2 size={12} /> : 
                 state === 'active' ? <Clock size={12} /> : 
                 state === 'error' ? <AlertCircle size={12} /> :
                 <Circle size={10} fill="currentColor" opacity={0.2} />}
              </div>
              
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[8px] font-black uppercase tracking-widest text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {step.label}
              </div>
            </div>
            {!isLast && (
              <div className={`h-[2px] w-4 rounded-full transition-colors duration-1000 ${i < STEPS.findIndex(s => s.statuses.includes(status)) ? 'bg-emerald-500/50' : 'bg-zinc-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
