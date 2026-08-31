'use client';

import React from 'react';
import { ShieldCheck, Coins, Sparkles, UserCheck } from 'lucide-react';

export function EscrowExplanatoryCard() {
  const steps = [
    {
      icon: <Coins className="w-5 h-5 text-orange-600" />,
      title: '1. Depósito Garantido',
      description: 'A empresa deposita o orçamento contratado na plataforma antes da produção começar.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
      title: '2. Proteção SafePay',
      description: 'O valor fica 100% protegido na custódia segura do InfluNext SafePay.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-orange-600" />,
      title: '3. Validação por IA',
      description: 'O criador posta e entrega o link. Nossa IA audita o conteúdo e valida a publicação.',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      title: '4. Pagamento Liberado',
      description: 'O cachê cai direto na conta do criador e a nota fiscal correspondente é gerada.',
    },
  ];

  return (
    <div className="relative p-6 md:p-8 rounded-[2.5rem] border border-slate-200/90 bg-white overflow-hidden shadow-sm">
      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
        
        {/* Lado Esquerdo: Resumo & Badge */}
        <div className="md:w-1/3 flex flex-col gap-2.5 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider self-center md:self-start">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Transação 100% Protegida
          </div>
          <h3 className="text-xl font-black text-slate-950 tracking-tight leading-snug">
            Como funciona o nosso Escrow Seguro?
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Eliminamos calotes e permutas sem valor. Criadores produzem protegidos sabendo que o saldo existe, e marcas pagam pelo resultado entregue.
          </p>
        </div>

        {/* Lado Direito: 4 Etapas */}
        <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-orange-300 transition-all flex gap-3.5 group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200 bg-white shadow-sm group-hover:scale-105 transition-transform">
                {step.icon}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{step.title}</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
