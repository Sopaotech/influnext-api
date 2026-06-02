import React from 'react';
import { ShieldCheck, Info, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface InstagramOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'real' | 'simulate') => void;
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
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        
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
            Desbloqueie o Poder Máximo da sua <span className="text-purple-200">Análise de Dados</span>
          </h2>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Why Section */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                <Info className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Por que pedimos o login do Facebook?</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para que nossa IA consiga puxar suas <b>visualizações de vídeo, alcance e engajamento</b>, a Meta exige que sua conta seja Profissional e esteja vinculada a uma Página do Facebook. É uma regra técnica de segurança deles.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-black">1</div>
              <p className="text-[10px] font-black uppercase text-slate-400">Conta Pro</p>
              <p className="text-[11px] font-bold text-slate-700 leading-snug">Seu Instagram deve ser Criador ou Empresa.</p>
            </div>
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[10px] font-black">2</div>
              <p className="text-[10px] font-black uppercase text-slate-400">Página FB</p>
              <p className="text-[11px] font-bold text-slate-700 leading-snug">Vincule seu Instagram a uma Página (mesmo vazia).</p>
            </div>
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black">3</div>
              <p className="text-[10px] font-black uppercase text-slate-400">Sincronizar</p>
              <p className="text-[11px] font-bold text-slate-700 leading-snug">Nossa IA fará o resto por você automaticamente.</p>
            </div>
          </div>

          {/* Security Banner */}
          <div className="flex items-center gap-3 py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Não postamos nada nem acessamos sua senha.</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => onConfirm('real')}
                className="flex-1 h-14 bg-slate-900 hover:bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group"
              >
                Conexão Real <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => onConfirm('simulate')}
                className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-600/10 flex items-center justify-center gap-2 group"
              >
                Simular Conexão (Demo) <Sparkles className="w-4 h-4 animate-pulse" />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-slate-100"
            >
              Agora Não / Voltar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
