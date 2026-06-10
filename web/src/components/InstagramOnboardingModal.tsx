import React from 'react';
import { ShieldCheck, Info, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface InstagramOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'personal' | 'business' | 'simulate') => void;
}

export function InstagramOnboardingModal({ isOpen, onClose, onConfirm }: InstagramOnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="px-3 py-1 bg-white/20 border border-white/20 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Conexão 100% Segura</span>
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight">
            Vincular Conta do <span className="text-purple-200">Instagram</span>
          </h2>
        </div>

        <div className="p-8 space-y-6">
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            Escolha o método de conexão de acordo com o seu perfil do Instagram:
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => onConfirm('personal')}
              className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-between px-6 group"
            >
              <div className="text-left">
                <span className="block text-white font-black">Conexão Direta (Recomendada)</span>
                <span className="text-[8px] text-zinc-400 font-bold lowercase">Login direto no Instagram • Qualquer conta</span>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => onConfirm('business')}
              className="w-full h-16 bg-white border border-slate-200 hover:border-purple-300 hover:bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-between px-6 group"
            >
              <div className="text-left">
                <span className="block text-slate-900 font-black">Conexão Profissional</span>
                <span className="text-[8px] text-zinc-450 font-bold lowercase">Meta Graph API • Exige Página do Facebook</span>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => onConfirm('simulate')}
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-600/10 flex items-center justify-between px-6 group"
            >
              <div className="text-left">
                <span className="block text-white font-black">Simular Conexão (Demo Rápida)</span>
                <span className="text-[8px] text-emerald-250 font-bold lowercase">Criar perfil de teste instantâneo</span>
              </div>
              <Sparkles className="w-4 h-4 animate-pulse text-white" />
            </button>

            <button 
              onClick={onClose}
              className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-slate-100 mt-2"
            >
              Agora Não / Voltar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
