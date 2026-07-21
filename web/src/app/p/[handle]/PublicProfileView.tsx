'use client';

import React, { useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { InfluScoreCard } from '@/components/influ-score-card';
import { Users, Target, Activity, Eye, ShieldCheck, ArrowRight, Zap, Trophy, Link as LinkIcon, DollarSign, Lock, Sparkles, Copy, Check } from 'lucide-react';

import { SHA256AuditModal } from '@/components/SHA256AuditModal';
import { InstantCheckoutModal } from '@/components/InstantCheckoutModal';

interface PublicProfileViewProps {
  profile: any;
}

export function PublicProfileView({ profile }: PublicProfileViewProps) {
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

  const handleOpenCheckout = (rateCard?: any) => {
    setSelectedRateCard(rateCard || null);
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#131110] text-[#f5ebe0] selection:bg-orange-500/30 font-sans pb-32">
      
      <div className="max-w-[450px] mx-auto px-6 py-12 space-y-8">
        
        {/* Certificate Header */}
        <header className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-zinc-800 p-1 relative z-10">
               {profile.profileImageUrl ? (
                 <img src={profile.profileImageUrl} alt={profile.handle} className="w-full h-full rounded-full object-cover" />
               ) : (
                 <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-4xl font-black text-zinc-600">
                    {profile.handle.charAt(0).toUpperCase()}
                 </div>
               )}
            </div>
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-400 rounded-full p-1.5 border-4 border-[#131110] z-20 shadow-lg transition-transform hover:scale-110"
              title="Clique para abrir auditoria criptográfica SHA-256"
            >
               <ShieldCheck className="w-5 h-5 text-white" />
            </button>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/10 blur-[50px] rounded-full" />
          </div>

          <div className="space-y-1">
             <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-black tracking-tighter">@{profile.handle}</h1>
                {profile.verifiedMetrics && (
                  <button 
                    onClick={() => setIsAuditModalOpen(true)}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                  </button>
                )}
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Certificado de Ativo InfluNext</p>
          </div>
        </header>

        {/* SHA-256 Audit Badge Banner */}
        <div 
          onClick={() => setIsAuditModalOpen(true)}
          className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-orange-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-500/60 transition-all group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                API Oficial (SHA-256 Verified) <Sparkles className="w-3 h-3 text-orange-400" />
              </p>
              <p className="text-[9px] text-zinc-400 font-medium">Métricas auditadas com carimbo imutável.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 group-hover:text-emerald-300 transition-colors">
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
        <section className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-12 h-12 text-emerald-400" />
           </div>
           <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Métrica de Impacto Real</h3>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-emerald-400 tracking-tighter">+{roiPercentage}%</span>
                 <span className="text-xs font-bold text-zinc-400">Eficiência vs Mercado</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                 Baseado em telemetria de ROI das últimas campanhas auditadas via IA.
              </p>
           </div>
        </section>

        {/* Core Metrics Grid */}
        <main className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
           <MetricCard title="Seguidores" value={latestMetrics.followers.toLocaleString('pt-BR')} icon={Users} />
           <MetricCard title="Engajamento" value={`${latestMetrics.engagementRate}%`} icon={Activity} />
           <MetricCard title="Alcance" value={latestMetrics.reachLast30Days.toLocaleString('pt-BR')} icon={Target} />
           <MetricCard title="Views Médias" value={latestMetrics.avgViews.toLocaleString('pt-BR')} icon={Eye} />
        </main>

        {/* Proof of Performance Gallery */}
        {profile.tasks && profile.tasks.length > 0 && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Galeria de Provas (ROI+)</h3>
                 <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="space-y-3">
                 {profile.tasks.map((task: any, idx: number) => (
                    <a 
                      key={idx} 
                      href={task.proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-orange-500/50 transition-all group"
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                             <LinkIcon className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-zinc-200 uppercase truncate max-w-[150px]">{task.title}</p>
                             <p className="text-[8px] font-bold text-emerald-500 uppercase">Impacto: {task.performanceMultiplier.toFixed(1)}x</p>
                          </div>
                       </div>
                       <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                    </a>
                 ))}
              </div>
           </section>
        )}

        {/* Rate Card Section */}
        {profile.rateCards && profile.rateCards.length > 0 && (
           <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tabela de Preços (Rate Cards)</h3>
                 <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {profile.rateCards.map((rate: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex justify-between items-center group hover:border-orange-500/40 transition-all"
                    >
                       <div className="space-y-0.5 max-w-[65%]">
                          <p className="text-xs font-black text-zinc-100 uppercase tracking-tight">{rate.serviceName}</p>
                          <p className="text-[9px] text-zinc-500 font-medium">{rate.description || 'Entrega padrão garantida via Escrow'}</p>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-sm font-black text-emerald-400">R$ {rate.price.toLocaleString('pt-BR')}</p>
                          <button
                            onClick={() => handleOpenCheckout(rate)}
                            className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500 hover:text-black border border-orange-500/40 text-orange-400 text-[9px] font-black rounded-lg transition-all"
                          >
                            Contratar ⚡
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        )}

      </div>

      {/* Conversion Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#131110] via-[#131110] to-transparent z-40">
        <div className="max-w-[450px] mx-auto">
          <button 
            onClick={() => handleOpenCheckout()}
            className="w-full h-16 bg-[#d96b27] hover:bg-orange-500 text-[#131110] font-black rounded-3xl shadow-[0_20px_40px_rgba(217,107,39,0.25)] transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <ShieldCheck className="w-5 h-5" />
            Contratar via Escrow Seguro 🛡️
          </button>
          <p className="text-center text-[9px] font-bold text-zinc-600 mt-4 uppercase tracking-[0.2em]">
             Powered by Influnext High Performance Core
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

