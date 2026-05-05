'use client';

import React, { useState } from 'react';

export default function CheckoutClient({ contractId }: { contractId: string }) {
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto bg-[#11111a] rounded-2xl border border-white/10 p-8 shadow-2xl">
      <h2 className="text-2xl font-black text-white mb-6">Finalizar Contratação</h2>
      
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 mb-8 flex items-start gap-4">
        <svg className="text-purple-400 mt-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <div>
          <h4 className="font-bold text-purple-300">Garantia Influnext (Escrow)</h4>
          <p className="text-sm text-purple-200/70 mt-1">Seu dinheiro está protegido pela plataforma até a entrega e aprovação do serviço. Risco zero.</p>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={handlePay} 
          disabled={isLoading}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? 'PROCESSANDO...' : 'PAGAR AGORA (CARTÃO OU PIX)'}
        </button>
        
        <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-widest">
          Pagamento processado com segurança via Stripe
        </p>
      </div>
    </div>
  );
}
