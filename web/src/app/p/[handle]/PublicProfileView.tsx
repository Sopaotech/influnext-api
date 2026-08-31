'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { InfluScoreCard } from '@/components/influ-score-card';
import { Users, Target, Activity, Eye, ShieldCheck, ArrowRight, Zap, Trophy, Link as LinkIcon, DollarSign, Lock, Sparkles, Copy, Check, CheckCircle2 } from 'lucide-react';

import { SHA256AuditModal } from '@/components/SHA256AuditModal';
import { InstantCheckoutModal } from '@/components/InstantCheckoutModal';
import { toast } from 'sonner';

interface PublicProfileViewProps {
  profile: any;
  checkoutStatus?: string;
}

export function PublicProfileView({ profile, checkoutStatus }: PublicProfileViewProps) {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedRateCard, setSelectedRateCard] = useState<any | null>(null);

  const latestMetrics = profile.metricsHistory?.[0] || {
    followers: 0,
    engagementRate: 0,
    reachLast30Days: 0,
    avgViews: 0,
    integrityHash: undefined,
    capturedAt: undefined,
  };

  const roiPercentage = ((profile.avgROI - 1) * 100).toFixed(0);

  React.useEffect(() => {
    if (checkoutStatus === 'success') {
      toast.success('Pagamento efetuado com sucesso!', {
        description: 'O valor está seguro no Escrow e o influenciador foi notificado.',
        duration: 5000,
      });
    } else if (checkoutStatus === 'simulated') {
      toast.success('Checkout Simulado Concluído!', {
        description: 'O contrato foi gerado em modo de simulação (Stripe não configurada).',
        duration: 5000,
      });
    } else if (checkoutStatus === 'canceled') {
      toast.error('Pagamento cancelado.', {
        description: 'O pagamento não foi concluído e nenhum valor foi debitado.',
        duration: 5000,
      });
    }
  }, [checkoutStatus]);

  const handleOpenCheckout = (rateCard?: any) => {
    setSelectedRateCard(rateCard || null);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-orange-100 font-sans pb-40">
      
      <div className="max-w-[480px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
        
        {/* Certificate Header */}
        <header className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-0.5 shadow-xl shadow-orange-500/20 relative z-10 overflow-hidden">
               {profile.profileImageUrl ? (
                 <img src={profile.profileImageUrl} alt={profile.handle} className="w-full h-full rounded-full object-cover" />
               ) : (
                 <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-4xl font-black text-white">
                    {profile.handle.charAt(0).toUpperCase()}
                 </div>
               )}
            </div>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="absolute -bottom-1 -right-1 bg-white hover:bg-slate-50 rounded-full p-1.5 border border-slate-200 z-20 shadow-md transition-transform hover:scale-110"
              title="Clique para abrir auditoria criptográfica SHA-256"
            >
               <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </button>
            {/* Background Soft Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-orange-500/10 blur-[50px] rounded-full" />
          </div>

          <div className="space-y-1.5">
             <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-950">@{profile.handle}</h1>
                {profile.verifiedMetrics && (
                  <button 
                    onClick={() => setIsAuditModalOpen(true)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <ShieldCheck className="w-5 h-5 text-orange-600" />
                  </button>
                )}
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 w-fit mx-auto">
               Mídia Kit Oficial Auditado
             </p>
          </div>

          {/* Informações adicionais do influenciador condensadas (Bio, Nicho, Localização) */}
          {(profile.niche || profile.city || profile.bio) && (
            <div className="flex flex-col items-center space-y-3 pt-2 w-full animate-in fade-in slide-in-from-top-4 duration-1000 delay-100">
              <div className="flex flex-wrap justify-center gap-2">
                {profile.niche && (
                  <span className="px-3 py-1 bg-white text-slate-700 text-xs font-bold rounded-full border border-slate-200 shadow-sm">
                    {profile.niche}
                  </span>
                )}
                {(profile.city || profile.state) && (
                  <span className="px-3 py-1 bg-white text-slate-700 text-xs font-bold rounded-full border border-slate-200 shadow-sm">
                    📍 {profile.city}{profile.city && profile.state ? ', ' : ''}{profile.state}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-xs text-slate-600 max-w-[90%] leading-relaxed font-medium">
                  "{profile.bio}"
                </p>
              )}
            </div>
          )}
        </header>

        {/* SHA-256 Audit Badge Banner */}
        <div 
          onClick={() => setIsAuditModalOpen(true)}
          className="p-4 bg-white border border-slate-200/90 shadow-sm rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                Autenticado SHA-256 <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Métricas validadas criptograficamente.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-600 group-hover:text-orange-700 transition-colors">
            Verificar →
          </span>
        </div>

        {/* Link na Bio Card (Branco e Laranja Oficial) */}
        <BioLinkNotificationCard handle={profile.handle} />

        {/* Authority Section */}
        <div className="animate-in fade-in zoom-in-95 duration-700 delay-200">
           <InfluScoreCard score={profile.influScore} />
        </div>

        {/* ROI Impact Card */}
        <section className="bg-white border border-slate-200/90 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-12 h-12 text-orange-600" />
           </div>
           <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Impacto Estimado nas Vendas</h3>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Alta Conversão
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-orange-600 tracking-tight">+{roiPercentage}%</span>
                 <span className="text-xs font-bold text-slate-500">ROI acima da média do nicho</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                 Desempenho superando a média do mercado com base nas campanhas auditadas via SafePay.
              </p>
           </div>
        </section>

        {/* Core Metrics Grid */}
        <main className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
           <MetricCard title="Seguidores" value={latestMetrics.followers.toLocaleString('pt-BR')} icon={Users} isDark={false} />
           <MetricCard title="Engajamento" value={`${latestMetrics.engagementRate}%`} icon={Activity} isDark={false} />
           <MetricCard title="Alcance" value={latestMetrics.reachLast30Days.toLocaleString('pt-BR')} icon={Target} isDark={false} />
           <MetricCard title="Views Médias" value={latestMetrics.avgViews.toLocaleString('pt-BR')} icon={Eye} isDark={false} />
        </main>

        {/* Rate Card Section */}
        {profile.rateCards && profile.rateCards.length > 0 && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pacotes Comerciais Disponíveis</h3>
                 <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
              <div className="grid grid-cols-1 gap-3.5">
                 {profile.rateCards.map((rate: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex justify-between items-center group hover:border-orange-300 hover:shadow-md transition-all"
                    >
                       <div className="space-y-1 max-w-[65%]">
                          <p className="text-sm font-black text-slate-950 uppercase tracking-tight">{rate.serviceName}</p>
                          <p className="text-xs text-slate-500 font-medium">{rate.description || 'Execução ponta-a-ponta com garantia SafePay'}</p>
                       </div>
                       <div className="text-right space-y-2">
                          <p className="text-base font-black text-slate-950">R$ {rate.price.toLocaleString('pt-BR')}</p>
                          <button
                            onClick={() => handleOpenCheckout(rate)}
                            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95"
                          >
                            Contratar →
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        )}

      </div>

      {/* Conversion Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-40">
        <div className="max-w-[480px] mx-auto">
          <button 
            onClick={() => handleOpenCheckout()}
            className="w-full h-16 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider rounded-[2rem] shadow-xl shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
            Contratar Publi (SafePay 🛡️)
          </button>
          <p className="text-center text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
             Garantia de Entrega ou 100% de Reembolso
          </p>
        </div>
      </footer>

      {/* Modals */}
      <SHA256AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        handle={profile.handle}
        integrityHash={latestMetrics.integrityHash}
        capturedAt={latestMetrics.capturedAt}
      />

      <InstantCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        handle={profile.handle}
        selectedRateCard={selectedRateCard}
        rateCards={profile.rateCards || []}
      />

    </div>
  );
}

function BioLinkNotificationCard({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  const getMediaKitUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/p/${handle}`;
    }
    return `https://influnext.com.br/p/${handle}`;
  };

  const handleCopyLink = () => {
    const url = getMediaKitUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('🔗 Link copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative overflow-hidden p-5 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white border border-orange-200 rounded-[2rem] space-y-3 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              Receba Propostas 24/7 📲
            </span>
            <h3 className="text-sm font-black tracking-tight text-slate-900 mt-1">
              Coloque este Mídia Kit na sua Bio!
            </h3>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 font-medium leading-relaxed">
        Adicione este link no perfil do Instagram/TikTok. Marcas analisam suas métricas e contratam seus pacotes com garantia total via SafePay.
      </p>

      <div className="pt-1 flex items-center gap-2">
        <div className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate select-all">
          influnext.com.br/p/{handle}
        </div>
        <button
          onClick={handleCopyLink}
          className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-md shadow-orange-500/20"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copiar Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
