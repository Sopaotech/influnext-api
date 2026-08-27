'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, CreditCard, Copy, Check, Sparkles, Clock, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface CheckoutContract {
  id: string;
  title?: string;
  campaignName?: string;
  budget?: number;
  successFeeRate?: number;
  platformFee?: number;
  escrowStatus?: string;
  [key: string]: unknown;
}

interface CheckoutUser {
  subscriptionTier?: string;
  email?: string;
  [key: string]: unknown;
}

interface PixData {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
  totalAmount: number;
}

export default function CheckoutClient({ contractId }: { contractId: string }) {
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<CheckoutContract | null>(null);
  const [user, setUser] = useState<CheckoutUser | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  // Estados do PIX
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

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

        // Se o contrato já estiver pago, sinaliza
        if (contractRes.data.escrowStatus === 'IN_PROGRESS' || contractRes.data.escrowStatus === 'COMPLETED') {
          setIsPaid(true);
        }
      } catch (err) {
        console.error('Erro ao buscar informações do checkout:', err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [contractId]);

  // Polling automático para detecção em tempo real do PIX
  useEffect(() => {
    if (!pixData?.paymentId || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const { api } = await import('@/lib/api');
        const res = await api.get(`/payments/mercadopago/status/${pixData.paymentId}`);
        if (res.data?.isApproved) {
          setIsPaid(true);
          clearInterval(interval);
          setTimeout(() => {
            window.location.href = `/dashboard/contracts/${contractId}?payment=success`;
          }, 2500);
        }
      } catch (err) {
        console.error('Erro no polling de status do PIX:', err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [pixData?.paymentId, isPaid, contractId]);

  // Gera o PIX dinâmico
  const handleGeneratePix = async () => {
    try {
      setIsLoading(true);
      const { api } = await import('@/lib/api');
      
      const res = await api.post('/payments/mercadopago/pix', {
        contractId,
        email: user?.email
      });

      setPixData(res.data);
    } catch (err: any) {
      console.error('Erro ao gerar PIX:', err);
      alert(err.response?.data?.error || 'Não foi possível gerar a chave PIX no momento.');
    } finally {
      setIsLoading(false);
    }
  };

  // Gera o checkout de Cartão
  const handleCardPayment = async () => {
    try {
      setIsLoading(true);
      const { api } = await import('@/lib/api');
      
      const res = await api.post('/payments/mercadopago/preference', {
        contractId,
        email: user?.email
      });

      if (res.data.initPoint) {
        window.location.href = res.data.initPoint;
      }
    } catch (err: any) {
      console.error('Erro ao iniciar pagamento com cartão:', err);
      alert(err.response?.data?.error || 'Não foi possível gerar o link de pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto bg-[#0a0a0f] rounded-3xl border border-white/5 p-12 shadow-2xl flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-5">Iniciando cofre financeiro...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-2xl mx-auto bg-[#0a0a0f] rounded-3xl border border-white/5 p-10 shadow-2xl text-center">
        <h3 className="text-xl font-black text-white">Contrato não encontrado</h3>
        <p className="text-zinc-400 mt-2 text-sm">O contrato informado não pôde ser recuperado.</p>
      </div>
    );
  }

  // Sucesso de Pagamento (Animação)
  if (isPaid) {
    return (
      <div className="max-w-2xl mx-auto bg-[#0a0a0f] rounded-3xl border border-emerald-500/30 p-10 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>
        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">InfluNext SafePay</span>
        <h2 className="text-2xl md:text-3xl font-black text-white mt-1 uppercase tracking-tight">Pagamento Garantido com Sucesso!</h2>
        <p className="text-zinc-400 text-xs mt-2 max-w-md mx-auto">
          O valor foi depositado no cofre SafePay com custódia segura. O influenciador foi notificado para iniciar a produção imediatamente.
        </p>
        <div className="mt-8 flex justify-center">
          <a 
            href={`/dashboard/contracts/${contractId}`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            Acessar Painel da Campanha <ArrowRight className="w-4 h-4" />
          </a>
        </div>
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
    <div className="max-w-2xl mx-auto bg-[#0a0a0f] rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"></div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
            SafePay Checkout
          </span>
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Via Mercado Pago</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Garantir Pagamento</h2>
        <p className="text-zinc-400 text-xs font-semibold mt-1">
          Campanha: <span className="text-white">{contract.title || contract.campaignName || 'Campanha de Marketing'}</span>
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 md:p-5 mb-8 flex items-start gap-4 shadow-lg shadow-amber-500/5">
        <ShieldCheck className="text-amber-400 w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-300 text-sm">Garantia Financeira InfluNext SafePay</h4>
          <p className="text-xs text-zinc-350 leading-relaxed mt-1">
            Seu pagamento fica retido em custódia segura e <strong>só é repassado ao criador após você validar e aprovar os entregáveis</strong>.
          </p>
        </div>
      </div>

      {/* Seletor de Meio de Pagamento */}
      <div className="mb-6">
        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest block mb-3">Escolha a Forma de Pagamento:</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMethod('pix')}
            className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all relative ${
              method === 'pix'
                ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <QrCode className={`w-5 h-5 ${method === 'pix' ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Aprovação 1s
              </span>
            </div>
            <div className="text-left">
              <span className="block text-xs font-black uppercase tracking-wider text-white">PIX Instantâneo</span>
              <span className="text-[10px] text-zinc-400">QR Code e Copia-e-Cola</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all ${
              method === 'card'
                ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                : 'bg-zinc-950/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <CreditCard className={`w-5 h-5 ${method === 'card' ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                Até 12x
              </span>
            </div>
            <div className="text-left">
              <span className="block text-xs font-black uppercase tracking-wider text-white">Cartão de Crédito</span>
              <span className="text-[10px] text-zinc-400">Checkout Mercado Pago</span>
            </div>
          </button>
        </div>
      </div>

      {/* Detalhamento dos Valores */}
      <div className="border border-white/5 bg-zinc-950/40 rounded-2xl p-6 mb-8 space-y-3.5">
        <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Resumo da Fatura</h3>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-medium">Cachê do Creator</span>
          <span className="text-white font-bold">R$ {budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            <span>Taxa de Proteção SafePay</span>
            <span className="text-[10px] text-amber-400 font-bold">({feePercent}%)</span>
          </div>
          <span className="text-white font-bold">R$ {escrowFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        {isFree && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[10px] text-amber-400 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>
              Você está na conta Free ({feePercent}%). Assine o <strong>Company Premium</strong> por R$ 120/mês e reduza a taxa para <strong>7%</strong>!
            </span>
          </div>
        )}

        <div className="h-px bg-white/5 my-2"></div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-300 font-black uppercase tracking-wider">Total a Pagar</span>
          <span className="text-2xl font-black text-emerald-400">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Bloco PIX Ativo */}
      {method === 'pix' && (
        <div className="space-y-4">
          {!pixData ? (
            <button 
              onClick={handleGeneratePix} 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              <QrCode className="w-4 h-4" />
              {isLoading ? 'GERANDO PIX NO MERCADO PAGO...' : 'GERAR QR CODE PIX'}
            </button>
          ) : (
            <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-5 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>Aguardando Pagamento do PIX...</span>
              </div>

              {pixData.qrCodeBase64 && (
                <div className="flex justify-center p-3 bg-white rounded-2xl max-w-[200px] mx-auto shadow-inner">
                  <Image 
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                    alt="QR Code PIX Mercado Pago" 
                    width={180} 
                    height={180} 
                    className="w-full h-auto"
                    unoptimized
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] text-zinc-400">Ou copie o código Copia-e-Cola abaixo:</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={pixData.qrCode} 
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-[11px] text-zinc-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span>Confirmação automática via Webhook em segundos</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bloco Cartão Ativo */}
      {method === 'card' && (
        <div className="space-y-4">
          <button 
            onClick={handleCardPayment} 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest"
          >
            <CreditCard className="w-4 h-4" />
            {isLoading ? 'PREPARANDO CHECKOUT...' : 'PAGAR COM CARTÃO (MERCADO PAGO)'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-6">
        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Processamento seguro certificado pelo Mercado Pago</span>
      </div>
    </div>
  );
}

