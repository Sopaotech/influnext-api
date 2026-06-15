'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share2 } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Verificar se o app já está rodando em modo standalone (instalado)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 2. Verificar se o usuário já dispensou o prompt nesta sessão de navegação
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    // 3. Detectar se o usuário está em um dispositivo iOS (iPhone/iPad/iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(ios);

    // 4. Capturar o evento beforeinstallprompt para navegadores baseados em Chromium (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar o prompt após 3 segundos
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Se for iOS, mostramos o prompt guiado após 6 segundos
    if (ios) {
      const iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 6000);
      return () => clearTimeout(iosTimer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Disparar o prompt nativo do navegador
    deferredPrompt.prompt();

    // Esperar pela resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Escolha de instalação do usuário: ${outcome}`);

    // Limpar o prompt e ocultar o popup
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Salvar na sessão para não incomodar o usuário na navegação imediata
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Container de Glassmorphism Premium */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/85 p-5 shadow-2xl backdrop-blur-xl">
        {/* Glow de Fundo Sutil */}
        <div className="absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-purple-500/10 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 -z-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-[80px]" />

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
              Instalar InfluNext App
            </h4>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              {isIos 
                ? "Adicione o InfluNext à tela inicial do seu iPhone para ter acesso mais rápido e insights em tempo real."
                : "Instale nosso aplicativo no seu dispositivo para ter a melhor experiência de gestão de carreira e dados analíticos."
              }
            </p>
          </div>
        </div>

        {/* Área de Ação */}
        <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/[0.06] pt-3">
          {isIos ? (
            /* Guia de Instalação para iOS */
            <div className="flex w-full items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                Toque em <Share2 className="h-3.5 w-3.5 text-indigo-400" /> na barra inferior
              </span>
              <span className="font-medium text-slate-300">
                e escolha 'Adicionar à Tela de Início'
              </span>
            </div>
          ) : (
            /* Botão de Download/Instalação para Android/Desktop */
            <>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors duration-200"
              >
                Agora não
              </button>
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] transition-all duration-200"
              >
                <Download className="h-3.5 w-3.5" />
                Instalar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
