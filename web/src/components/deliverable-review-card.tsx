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
    <div className="bg-zinc-900/50 border border-amber-500/30 rounded-xl p-5 shadow-lg flex flex-col gap-4 transition-all hover:border-amber-500/50">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-bold uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
            Revisão Pendente
          </span>
          <h3 className="text-lg font-bold text-zinc-100 mt-3 truncate">{contractTitle}</h3>
          <p className="text-sm text-zinc-400 mt-1">
            Enviado por: <span className="text-purple-400 font-semibold">@{influencerHandle}</span>
          </p>
        </div>
      </div>

      <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 flex items-center justify-between mt-2">
        <span className="text-sm text-zinc-300 truncate max-w-[70%]">{proofUrl}</span>
        <a 
          href={proofUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2.5 py-1.5 rounded-md border border-blue-500/20 transition-colors"
        >
          Visualizar <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {error && (
        <div className="text-red-400 text-xs font-medium bg-red-500/10 p-2 rounded border border-red-500/20 text-center animate-in fade-in">
          {error}
        </div>
      )}

      {isRejecting ? (
        <div className="space-y-3 mt-2 animate-in fade-in zoom-in-95 duration-200">
          <textarea 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Descreva o que o influenciador precisa ajustar (ex: A logo não apareceu no vídeo)..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all resize-none"
            rows={3}
            disabled={loading}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => { setIsRejecting(false); setError(''); }} 
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleRejectSubmit} 
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white flex justify-center items-center gap-2 transition-all shadow-[0_0_15px_-3px_rgba(220,38,38,0.4)]"
            >
              {loading ? 'Processando...' : 'Confirmar Rejeição'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 mt-2">
          <button 
            onClick={() => setIsRejecting(true)} 
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 flex justify-center items-center gap-2 transition-colors"
          >
            <XCircle className="w-4 h-4" /> Solicitar Ajuste
          </button>
          <button 
            onClick={handleApprove} 
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white flex justify-center items-center gap-2 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] transition-all"
          >
            <CheckCircle className="w-4 h-4" /> Aprovar Pagamento
          </button>
        </div>
      )}
    </div>
  );
}
