'use client';

import React, { useState } from 'react';
import { ShieldCheck, Zap, X, Lock, CheckCircle, ArrowRight, Loader2, Building, Mail, Sparkles } from 'lucide-react';

interface RateCardItem {
  id: string;
  serviceName: string;
  price: number;
  description?: string;
}

interface InstantCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
  selectedRateCard?: RateCardItem | null;
  rateCards?: RateCardItem[];
}

export function InstantCheckoutModal({
  isOpen,
  onClose,
  handle,
  selectedRateCard,
  rateCards = [],
}: InstantCheckoutModalProps) {
  const [activeRateCard, setActiveRateCard] = useState<RateCardItem | null>(selectedRateCard || rateCards[0] || null);
  const [brandEmail, setBrandEmail] = useState('');
  const [brandName, setBrandName] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza pacote selecionado quando a modal abre
  React.useEffect(() => {
    if (selectedRateCard) {
      setActiveRateCard(selectedRateCard);
    } else if (rateCards.length > 0) {
      setActiveRateCard(rateCards[0]);
    }
  }, [selectedRateCard, rateCards]);

  if (!isOpen) return null;

  const currentPrice = activeRateCard ? activeRateCard.price : 500;
  const escrowFee = currentPrice * 0.07;
  const totalPrice = currentPrice + escrowFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandEmail || !campaignTitle) {
      setError('Por favor preencha seu e-mail e o título da campanha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
      const response = await fetch(`${apiUrl}/p/instant-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          rateCardId: activeRateCard?.id,
          brandEmail,
          brandName,
          campaignTitle,
          briefing,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar checkout instantâneo.');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('URL de checkout não retornada pela API.');
      }
    } catch (err: any) {
      console.error('[INSTANT CHECKOUT ERROR]', err);
      setError(err.message || 'Falha ao conectar com o serviço de pagamento.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#181615] border border-orange-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-[#f5ebe0] max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-full transition-all hover:rotate-90"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-black shadow-lg shrink-0">
            <Zap className="w-7 h-7 fill-black" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
              Contratação 1-Clique em Escrow
            </span>
            <h2 className="text-lg font-black tracking-tight mt-1">Contratar @{handle}</h2>
            <p className="text-xs text-zinc-400">Garantia total de entrega Influnext Escrow 🛡️</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs rounded-xl font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Service Selection */}
          {rateCards.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Selecione o Entregável / Pacote
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-1">
                {rateCards.map((rate) => {
                  const isSelected = activeRateCard?.id === rate.id;
                  return (
                    <div
                      key={rate.id}
                      onClick={() => setActiveRateCard(rate)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg'
                          : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black uppercase">{rate.serviceName}</p>
                        {rate.description && (
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{rate.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-black text-emerald-400">
                        R$ {rate.price.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-orange-400" /> E-mail da Marca *
                </label>
                <input
                  type="email"
                  required
                  placeholder="suaempresa@marca.com"
                  value={brandEmail}
                  onChange={(e) => setBrandEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  <Building className="w-3 h-3 text-orange-400" /> Nome da Empresa / Marca
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nike, Startup X"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" /> Título da Campanha *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Lançamento Coleção Verão 2026"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Briefing Resumido (Objetivos & Links)
              </label>
              <textarea
                rows={2}
                placeholder="Descreva resumidamente a mensagem principal e objetivos da postagem..."
                value={briefing}
                onChange={(e) => setBriefing(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-all resize-none"
              />
            </div>
          </div>

          {/* Pricing Breakdown & Escrow Guarantee */}
          <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
              <span>Cachê do Criador:</span>
              <span className="text-zinc-200">R$ {currentPrice.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Proteção Escrow (7%):
              </span>
              <span className="text-zinc-200">R$ {escrowFee.toLocaleString('pt-BR')}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-zinc-300">Total Retido em Garantia:</span>
              <span className="text-base font-black text-emerald-400">R$ {totalPrice.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium px-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>O dinheiro fica retido em custódia até você aprovar o conteúdo entregue.</span>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#d96b27] hover:bg-orange-500 text-black font-black text-sm rounded-2xl shadow-[0_10px_30px_rgba(217,107,39,0.3)] transition-all active:scale-98 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando Checkout Stripe/Pix...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Pagar com Garantia em Escrow 🛡️
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
