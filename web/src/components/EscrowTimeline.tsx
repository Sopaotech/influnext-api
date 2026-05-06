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
    <div className="flex items-center gap-1.5">
      {STEPS.map((step, i) => {
        const state = getStepState(step.statuses, i);
        const isLast = i === STEPS.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center group relative">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 border-2
                ${state === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' : 
                  state === 'active' ? 'bg-purple-600 border-purple-600 text-white animate-pulse shadow-md shadow-purple-600/20' : 
                  state === 'error' ? 'bg-red-500 border-red-500 text-white' :
                  'bg-white border-slate-100 text-slate-200'}
              `}>
                {state === 'completed' ? <CheckCircle2 size={12} /> : 
                 state === 'active' ? <Clock size={12} /> : 
                 state === 'error' ? <AlertCircle size={12} /> :
                 <Circle size={8} fill="currentColor" />}
              </div>
              
              {/* Tooltip - Dark High Contrast */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 whitespace-nowrap pointer-events-none z-10 shadow-xl">
                {step.label}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            </div>
            {!isLast && (
              <div className={`h-[3px] w-6 rounded-full transition-colors duration-1000 ${i < STEPS.findIndex(s => s.statuses.includes(status)) ? 'bg-emerald-200' : 'bg-slate-100'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
