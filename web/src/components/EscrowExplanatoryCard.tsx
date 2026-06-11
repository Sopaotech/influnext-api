'use client';

import React from 'react';
import { ShieldCheck, Coins, Sparkles, ArrowRightLeft, UserCheck } from 'lucide-react';

export function EscrowExplanatoryCard() {
  const steps = [
    {
      icon: <Coins className="w-5 h-5 text-violet-400" />,
      title: '1. Depósito Garantido',
      description: 'A empresa deposita o orçamento contratado na plataforma antes da produção começar.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      title: '2. Saldo Retido',
      description: 'O valor fica retido com total segurança em uma conta de garantia (Escrow) da InfluNext.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-pink-400" />,
      title: '3. Validação por IA',
      description: 'O criador posta e entrega o link. Nossa IA audita o conteúdo e valida a publicação.',
    },
    {
      icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
      title: '4. Pagamento Liberado',
      description: 'O cachê cai direto na conta do criador e a nota fiscal correspondente é gerada.',
    },
  ];

  return (
    <div className="relative p-6 md:p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[250px] h-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-pink-600/5 blur-[70px] pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
        {/* Left Side: Intro and badge */}
        <div className="md:w-1/3 flex flex-col gap-3 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest self-center md:self-start">
            <ShieldCheck className="w-3.5 h-3.5" />
            Transação 100% Protegida
          </div>
          <h3 className="text-lg font-black text-white leading-tight">
            Como funciona o nosso Escrow Seguro?
          </h3>
          <p className="text-zinc-400 text-xs font-bold leading-relaxed">
            Eliminamos calotes e permutas sem valor. Criadores produzem protegidos sabendo que o saldo existe, e marcas pagam pelo resultado entregue.
          </p>
        </div>

        {/* Right Side: Grid of steps */}
        <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-2xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-950/70 transition-all duration-350 flex gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center flex-shrink-0">
                {step.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">{step.title}</h4>
                <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
