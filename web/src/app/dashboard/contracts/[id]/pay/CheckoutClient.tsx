'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function CheckoutClient({ contractId }: { contractId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { api } = await import('@/lib/api');
        const [contractRes, userRes] = await Promise.all([
          api.get(`/contracts/${contractId}`),
          api.get('/auth/me')
        ]);
        setContract(contractRes.data);
        setUser(userRes.data);
      } catch (err) {
        console.error('Erro ao buscar informações do checkout:', err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [contractId]);

  const handlePay = async () => {
    try {
      setIsLoading(true);
      const { api } = await import('@/lib/api');
      
      const res = await api.post('/payments/create-order', {
        contractId
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Erro ao iniciar pagamento:', err);
      alert('Não foi possível iniciar o pagamento. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto bg-[#0a0a0f] rounded-2xl border border-white/5 p-8 shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-4">Carregando detalhes do pagamento...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-2xl mx-auto bg-[#0a0a0f] rounded-2xl border border-white/5 p-8 shadow-2xl text-center">
        <h3 className="text-xl font-black text-white">Contrato não encontrado</h3>
        <p className="text-zinc-400 mt-2">O contrato informado não pôde ser recuperado.</p>
      </div>
    );
  }

  const feeRate = contract.successFeeRate ?? (user?.subscriptionTier === 'PRO' || user?.subscriptionTier === 'MASTER' || user?.subscriptionTier === 'ENTERPRISE' ? 0.07 : 0.15);
  const feePercent = Math.round(feeRate * 100);
  const budget = contract.budget || 0;
  const escrowFee = contract.platformFee ?? (budget * feeRate);
  const totalAmount = budget + escrowFee;
  const isFree = feeRate > 0.07;

  return (
    <div className="max-w-2xl mx-auto bg-[#0a0a0f] rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"></div>

      <div className="mb-8">
        <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest block mb-2">Checkout Seguro</span>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Finalizar Contratação</h2>
        <p className="text-zinc-400 text-xs font-semibold mt-1">
          Campanha: <span className="text-white">{contract.title || contract.campaignName || 'Campanha de Marketing'}</span>
        </p>
      </div>
      
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-lg shadow-amber-500/5">
        <ShieldCheck className="text-amber-400 w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-300 text-sm">Garantia Influnext (Escrow)</h4>
          <p className="text-xs text-zinc-350 leading-relaxed mt-1">
            Seu pagamento ficará retido com segurança e só será liberado para o Creator após você validar e aprovar os entregáveis da campanha.
          </p>
        </div>
      </div>

      {/* Detalhamento dos Valores */}
      <div className="border border-white/5 bg-zinc-950/40 rounded-2xl p-6 mb-8 space-y-4">
        <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Resumo da Fatura</h3>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-medium">Cachê do Creator</span>
          <span className="text-white font-bold">R$ {budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span>Taxa Operacional Escrow</span>
            <span className="text-[10px] text-amber-400 font-bold">({feePercent}%)</span>
          </div>
          <span className="text-white font-bold">R$ {escrowFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        {isFree && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[10px] text-amber-400 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              Você está na conta Free (taxa de {feePercent}%). Assine o <strong>Plano Premium</strong> por apenas R$ 59,90/mês e reduza sua taxa de intermediação para <strong>apenas 7%</strong>!
            </span>
          </div>
        )}

        <div className="h-px bg-white/5 my-2"></div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-zinc-300 font-bold uppercase tracking-wider">Total a Pagar</span>
          <span className="text-2xl font-black text-amber-400">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={handlePay} 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest"
        >
          {isLoading ? 'PROCESSANDO...' : 'EFETUAR PAGAMENTO (STRIPE)'}
        </button>
        
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Pagamento processado com segurança via Stripe</span>
        </div>
      </div>
    </div>
  );
}
