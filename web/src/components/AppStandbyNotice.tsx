'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function AppStandbyNotice() {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Check if dismissed
    const isDismissed = localStorage.getItem('influnext_app_standby_dismissed');
    if (isDismissed) return;

    // Show after 1.5 seconds
    const timer = setTimeout(() => {
      setShowNotice(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('influnext_app_standby_dismissed', 'true');
    setShowNotice(false);
  };

  if (!showNotice) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100%-2rem)] max-w-sm sm:w-96 animate-in fade-in slide-in-from-bottom-5 duration-300 md:right-6 md:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0">
      {/* Container de Glassmorphism Premium */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/85 p-5 shadow-2xl backdrop-blur-xl">
        {/* Glow de Fundo Sutil */}
        <div className="absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-orange-500/10 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 -z-10 h-40 w-40 rounded-full bg-pink-500/10 blur-[80px]" />

        {/* Botão de Fechar */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors duration-200"
          aria-label="Fechar"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Conteúdo */}
        <div className="flex gap-4">
          {/* Favicon / Logo da Plataforma */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900 shadow-md overflow-hidden">
            <img 
              src="/icon.png" 
              alt="InfluNext Logo" 
              className="h-10 w-10 rounded-lg object-cover" 
            />
          </div>

          <div className="flex-1 pr-6">
            <h4 className="font-outfit text-sm font-semibold tracking-wide text-white">
              Aplicativo InfluNext
            </h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed font-semibold">
              Nosso app está em fase de desenvolvimento pelos nossos desenvolvedores da InfluNext.
            </p>
          </div>
        </div>

        {/* Área de Ação */}
        <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/[0.06] pt-3">
          <button
            onClick={handleDismiss}
            className="rounded-lg bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
