import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

interface InstagramOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'personal' | 'business' | 'simulate', username?: string) => void;
}

export function InstagramOnboardingModal({ isOpen, onClose, onConfirm }: InstagramOnboardingModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [statusStep, setStatusStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const steps = [
    'Autenticando com Meta Graph API...',
    'Buscando estatísticas e engajamento...',
    'Rastreando últimas 15 publicações...',
    'Consolidando InfluScore e mentorias...',
    'Conexão ativa com sucesso!'
  ];

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsConnecting(true);
    setStatusStep(0);

    // Simula as etapas de sincronização em tempo real (micro-animação premium)
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatusStep(i + 1);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    onConfirm('simulate', username);
    setIsConnecting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={!isConnecting ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#110c26] border border-[#2e2452] w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-white/10 border border-white/20 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Meta API Verified</span>
            </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            Vincular <span className="text-purple-200">Instagram</span>
          </h2>
          <p className="text-[10px] text-zinc-300 font-medium mt-1">
            Conecte sua conta em segundos para auditar métricas e liberar saldo.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {!isConnecting ? (
            <form onSubmit={handleConnect} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Nome de Usuário (@handle)</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-zinc-500 font-bold text-sm">@</span>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                    placeholder="o_melhor_criador"
                    className="w-full h-12 pl-8 pr-4 bg-[#181236] border border-[#2e2452] rounded-xl text-white font-bold text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Senha do Instagram</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-12 px-4 bg-[#181236] border border-[#2e2452] rounded-xl text-white font-bold text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-zinc-500 px-1">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[9px] font-semibold">Suas credenciais são transmitidas com segurança de ponta a ponta.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-1/3 h-12 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/5"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-12 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-purple-600/20"
                >
                  Autenticar Conta <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
              <div className="relative">
                {statusStep < steps.length ? (
                  <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-black text-sm uppercase tracking-wider">
                  {statusStep < steps.length ? 'Sincronizando...' : 'Sincronizado!'}
                </h4>
                <p className="text-zinc-400 text-[11px] font-semibold min-h-[16px]">
                  {steps[Math.min(statusStep, steps.length - 1)]}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="flex gap-1.5 w-32">
                {steps.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx < statusStep ? 'bg-purple-500' : 'bg-[#181236]'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

