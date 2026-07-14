import React, { useState } from 'react';
import { approveDeliverable, rejectDeliverable } from '@/lib/api';
import { ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  deliverableId: string;
  contractTitle: string;
  influencerHandle: string;
  proofUrl: string;
  onSuccess: () => void;
}

export function DeliverableReviewCard({ deliverableId, contractTitle, influencerHandle, proofUrl, onSuccess }: Props) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    try {
      setLoading(true);
      await approveDeliverable(deliverableId);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao aprovar entrega.');
      setLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!reason) {
      setError('O motivo do ajuste é obrigatório.');
      return;
    }
    try {
      setLoading(true);
      await rejectDeliverable(deliverableId, reason);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao rejeitar entrega.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-orange-100 rounded-[2rem] p-6 shadow-sm flex flex-col gap-5 transition-all hover:border-orange-200 hover:shadow-md group animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
            Revisão Pendente
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight truncate max-w-[200px]">{contractTitle}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Influenciador: <span className="text-slate-900">@{influencerHandle}</span>
          </p>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 truncate flex-1">{proofUrl}</span>
        <a 
          href={proofUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-orange-600 px-4 py-2 rounded-xl transition-all shadow-sm"
        >
          Visualizar <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {error && (
        <div className="text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100 text-center animate-in fade-in">
          {error}
        </div>
      )}

      {isRejecting ? (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Descreva o que o influenciador precisa ajustar..." 
            className="w-full bg-white border border-red-100 rounded-2xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-400 transition-all resize-none shadow-sm"
            rows={3}
            disabled={loading}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => { setIsRejecting(false); setError(''); }} 
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 text-slate-400 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleRejectSubmit} 
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white flex justify-center items-center gap-2 transition-all shadow-lg shadow-red-600/20"
            >
              {loading ? 'Processando...' : 'Confirmar Rejeição'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button 
            onClick={() => setIsRejecting(true)} 
            disabled={loading}
            className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 flex justify-center items-center gap-2 transition-all"
          >
            <XCircle className="w-4 h-4" /> Solicitar Ajuste
          </button>
          <button 
            onClick={handleApprove} 
            disabled={loading}
            className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white flex justify-center items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <CheckCircle className="w-4 h-4" /> Aprovar Pagamento
          </button>
        </div>
      )}
    </div>
  );
}
