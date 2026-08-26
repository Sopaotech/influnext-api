'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { InfluScoreCard } from '@/components/influ-score-card';
import { Users, Target, Activity, Eye, ShieldCheck, ArrowRight, Zap, Trophy, Link as LinkIcon, DollarSign, Lock, Sparkles, Copy, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-slate-200 font-sans pb-40">
      
      <div className="max-w-[450px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
        
        {/* Certificate Header */}
        <header className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-white border border-slate-200 shadow-sm p-1 relative z-10">
               {profile.profileImageUrl ? (
                 <img src={profile.profileImageUrl} alt={profile.handle} className="w-full h-full rounded-full object-cover" />
               ) : (
                 <div className="w-full h-full rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl font-black text-slate-400">
                    {profile.handle.charAt(0).toUpperCase()}
                 </div>
               )}
            </div>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="absolute -bottom-2 -right-2 bg-white hover:bg-slate-50 rounded-full p-1.5 border border-slate-200 z-20 shadow-md transition-transform hover:scale-110"
              title="Clique para abrir auditoria criptográfica SHA-256"
            >
               <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </button>
            {/* Background Soft Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/10 blur-[50px] rounded-full" />
          </div>

          <div className="space-y-1">
             <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">@{profile.handle}</h1>
                {profile.verifiedMetrics && (
                  <button 
                    onClick={() => setIsAuditModalOpen(true)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                  </button>
                )}
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Certificado de Ativo Digital</p>
          </div>

          {/* Otimização: Informações adicionais do influenciador condensadas (Bio, Nicho, Localização) */}
          {(profile.niche || profile.city || profile.bio) && (
            <div className="flex flex-col items-center space-y-3 pt-2 w-full animate-in fade-in slide-in-from-top-4 duration-1000 delay-100">
              <div className="flex flex-wrap justify-center gap-2">
                {profile.niche && (
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                    {profile.niche}
                  </span>
                )}
                {(profile.city || profile.state) && (
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                    📍 {profile.city}{profile.city && profile.state ? ', ' : ''}{profile.state}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="text-[11px] text-slate-500 max-w-[90%] md:max-w-[80%] leading-relaxed font-medium">
                  "{profile.bio}"
                </p>
              )}
            </div>
          )}
        </header>

        {/* SHA-256 Audit Badge Banner */}
        <div 
          onClick={() => setIsAuditModalOpen(true)}
          className="p-3.5 bg-white border border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.08)] rounded-2xl flex items-center justify-between cursor-pointer hover:border-orange-200 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                Autenticado (SHA-256) <Sparkles className="w-3 h-3 text-orange-400" />
              </p>
              <p className="text-[9px] text-slate-400 font-medium">Métricas validadas criptograficamente.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-orange-500 group-hover:text-orange-600 transition-colors">
            Verificar →
          </span>
        </div>

        {/* Link na Bio Notification Card */}
        <BioLinkNotificationCard handle={profile.handle} />

        {/* Authority Section */}
        <div className="animate-in fade-in zoom-in-95 duration-700 delay-200">
           <InfluScoreCard score={profile.influScore} />
        </div>


        {/* ROI Impact Card */}
        <section className="bg-white border border-slate-200 p-6 rounded-3xl relative overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-12 h-12 text-orange-500" />
           </div>
           <div className="space-y-4 relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Impacto Estimado (ROI)</h3>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-orange-500 tracking-tighter">+{roiPercentage}%</span>
                 <span className="text-xs font-bold text-slate-500">Eficiência</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                 Desempenho superando a média do mercado com base em ativações anteriores.
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

        {/* Proof of Performance Gallery */}
        {profile.tasks && profile.tasks.length > 0 && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provas de Resultado</h3>
                 <Trophy className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="space-y-3">
                 {profile.tasks.map((task: any, idx: number) => (
                    <a 
                      key={idx} 
                      href={task.proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-orange-200 hover:shadow-md transition-all group"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                             <LinkIcon className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[150px]">{task.title}</p>
                             <p className="text-[8px] font-bold text-orange-500 uppercase mt-0.5">Retorno: {task.performanceMultiplier.toFixed(1)}x</p>
                          </div>
                       </div>
                       <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </a>
                 ))}
              </div>
           </section>
        )}

        {/* Reviews / Feedbacks Section */}
        {profile.reviews && profile.reviews.length > 0 && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avaliações das Marcas</h3>
                   <div className="px-2 py-0.5 bg-orange-500/10 rounded-full border border-orange-500/20">
                     <span className="text-[8px] font-black text-orange-500 uppercase tracking-wider">Verificadas</span>
                   </div>
                 </div>
                 <div className="flex text-orange-400">
                   {[1, 2, 3, 4, 5].map((star) => (
                     <svg key={star} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                     </svg>
                   ))}
                 </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {profile.reviews.map((review: any) => (
                    <div 
                      key={review.id} 
                      className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col gap-3 group hover:border-orange-200 transition-all"
                    >
                       <div className="flex items-center gap-3">
                          {review.company.logoUrl ? (
                            <img src={review.company.logoUrl} alt={review.company.companyName} className="w-8 h-8 rounded-full border border-slate-100 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">
                              {review.company.companyName.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-slate-800 uppercase">{review.company.companyName}</p>
                             <div className="flex text-orange-400 mt-0.5">
                               {[...Array(review.rating)].map((_, i) => (
                                 <svg key={i} className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                                   <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                 </svg>
                               ))}
                             </div>
                          </div>
                       </div>
                       {review.comment && (
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                           "{review.comment}"
                         </p>
                       )}
                    </div>
                 ))}
              </div>
           </section>
        )}

        {/* Rate Card Section */}
        {profile.rateCards && profile.rateCards.length > 0 && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pacotes Comerciais</h3>
                 <DollarSign className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {profile.rateCards.map((rate: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl flex justify-between items-center group hover:border-orange-300 hover:shadow-md transition-all"
                    >
                       <div className="space-y-0.5 max-w-[65%]">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{rate.serviceName}</p>
                          <p className="text-[9px] text-slate-500 font-medium">{rate.description || 'Execução ponta-a-ponta garantida'}</p>
                       </div>
                       <div className="text-right space-y-2">
                          <p className="text-sm font-black text-slate-900">R$ {rate.price.toLocaleString('pt-BR')}</p>
                          <button
                            onClick={() => handleOpenCheckout(rate)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-orange-500 text-white hover:text-white text-[9px] font-black rounded-lg transition-all shadow-md active:scale-95"
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
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-white/0 z-40">
        <div className="max-w-[450px] mx-auto">
          <button 
            onClick={() => handleOpenCheckout()}
            className="w-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-[2rem] shadow-[0_20px_40px_rgba(249,115,22,0.25)] transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
            Contratar (Garantia Escrow)
          </button>
          <p className="text-center text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">
             Powered by InfluNext
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
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative overflow-hidden p-5 bg-gradient-to-br from-orange-950/40 via-zinc-900 to-black border border-orange-500/30 rounded-3xl space-y-3 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black tracking-widest text-orange-400 uppercase bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
              Receba Propostas 24/7 📲
            </span>
            <h3 className="text-xs font-black tracking-tight text-white mt-1">
              Coloque este Mídia Kit na sua Bio!
            </h3>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
        Adicione este link no perfil do Instagram/TikTok. Marcas interessadas poderão ver suas métricas auditadas e contratar seus pacotes diretamente por aqui com pagamento seguro via Escrow.
      </p>

      <div className="pt-1 flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-black/60 border border-zinc-800 rounded-xl text-[10px] font-mono text-zinc-300 truncate select-all">
          influnext.com.br/p/{handle}
        </div>
        <button
          onClick={handleCopyLink}
          className="px-3.5 py-2 bg-[#d96b27] hover:bg-orange-500 text-black text-[10px] font-black rounded-xl transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-md"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> Link Copiado!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copiar para Bio
            </>
          )}
        </button>
      </div>
    </div>
  );
}

