import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

interface InstagramOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'personal' | 'business' | 'simulate', username?: string, followersRange?: string) => void;
}

export function InstagramOnboardingModal({ isOpen, onClose, onConfirm }: InstagramOnboardingModalProps) {
  const [username, setUsername] = useState('');
  const [followersRange, setFollowersRange] = useState('10k-50k');
  const [statusStep, setStatusStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const steps = [
    'Conectando com Meta Graph API...',
    'Buscando estatísticas da audiência...',
    'Avaliando taxa de engajamento médio...',
    'Consolidando InfluScore e histórico...',
    'Perfil verificado com sucesso!'
  ];

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsConnecting(true);
    setStatusStep(0);

    // Simula as etapas de sincronização em tempo real
    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatusStep(i + 1);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
    onConfirm('simulate', username, followersRange);
    setIsConnecting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={!isConnecting ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#1a1716] border border-[#2e2724] w-full max-w-md rounded-[2px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-[#131110] to-[#241f1c] p-8 text-[#f5ebe0] relative border-b border-[#2e2724]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-24 h-24 text-amber-500" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Meta API Verified</span>
            </div>
          </div>
          <h2 className="text-2xl font-serif text-[#f5ebe0] tracking-tight leading-tight">
            Vincular <span className="text-[#d96b27]">Instagram</span>
          </h2>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">
            Conecte sua conta em segundos de forma segura, sem precisar de senha.
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
                    className="w-full h-12 pl-8 pr-4 bg-[#131110] border border-[#2e2724] rounded-[2px] text-[#f5ebe0] font-bold text-sm focus:outline-none focus:border-[#d96b27] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Tamanho da Audiência (Faixa de Seguidores)</label>
                <select
                  value={followersRange}
                  onChange={(e) => setFollowersRange(e.target.value)}
                  className="w-full h-12 px-4 bg-[#131110] border border-[#2e2724] rounded-[2px] text-[#f5ebe0] font-bold text-sm focus:outline-none focus:border-[#d96b27] transition-colors appearance-none cursor-pointer"
                >
                  <option value="10k-50k">10k — 50k seguidores (Micro)</option>
                  <option value="50k-100k">50k — 100k seguidores (Medium)</option>
                  <option value="100k-500k">100k — 500k seguidores (Macro)</option>
                  <option value="500k+">500k+ seguidores (Mega)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-zinc-400 px-1 pt-1">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 text-[#d96b27]" />
                <span className="text-[9px] font-semibold">Fluxo sem senha: Apenas leitura pública de métricas de engajamento de acordo com a Meta.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-1/3 h-12 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded-[2px] transition-all border border-white/5"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-12 bg-[#d96b27] hover:bg-[#c25a1e] text-[#131110] font-black text-[10px] uppercase tracking-widest rounded-[2px] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-amber-950/20"
                >
                  Confirmar Conexão <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
              <div className="relative">
                {statusStep < steps.length ? (
                  <Loader2 className="w-12 h-12 text-[#d96b27] animate-spin" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-amber-500 animate-bounce" />
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-[#f5ebe0] font-black text-sm uppercase tracking-wider">
                  {statusStep < steps.length ? 'Sincronizando...' : 'Conectado!'}
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
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx < statusStep ? 'bg-[#d96b27]' : 'bg-[#131110]'}`}
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

