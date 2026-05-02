'use client';

import React, { useState, useEffect } from 'react';

export default function CheckoutClient({ contractId }: { contractId: string }) {
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'paid'>('pending');

  const handleGeneratePix = async () => {
    // Simula requisição para /v1/payments/create-order
    setPixCode('00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5915INFLUNEXT SA6009SAO PAULO62070503***6304');
    
    // Inicia Polling fake
    const interval = setInterval(() => {
      // Aqui faríamos fetch GET /v1/contracts/:id para checar se virou IN_PROGRESS
      // Simulando pagamento após 5 segundos
      setTimeout(() => {
        setStatus('paid');
        clearInterval(interval);
      }, 5000);
    }, 2000);
  };

  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#11111a] rounded-xl border border-green-500/30 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Pagamento Confirmado!</h2>
        <p className="text-zinc-400">O valor está protegido no Escrow. O influenciador já foi notificado ("Plim!") para iniciar o projeto.</p>
      </div>
    );
  }

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

      {!pixCode ? (
        <button onClick={handleGeneratePix} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors">
          Pagar via PIX (Instantâneo)
        </button>
      ) : (
        <div className="flex flex-col items-center p-6 bg-[#080810] rounded-xl border border-white/5">
          <div className="w-48 h-48 bg-white p-2 rounded-xl mb-6">
            <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-xs text-black font-bold text-center">
              [QR CODE SIMULADO]
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-4 text-center">Escaneie o QR Code ou copie a chave abaixo. Aguardando pagamento...</p>
          <div className="flex w-full gap-2">
             <input type="text" readOnly value={pixCode} className="flex-1 bg-[#11111a] border border-white/10 rounded-lg px-4 text-sm text-zinc-400" />
             <button className="bg-purple-600 px-4 py-2 rounded-lg font-bold">Copiar</button>
          </div>
        </div>
      )}
    </div>
  );
}
