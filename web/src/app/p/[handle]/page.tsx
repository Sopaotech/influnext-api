import { MetricCard } from '@/components/MetricCard';
import { InfluScoreCard } from '@/components/influ-score-card';
import { Users, Target, Activity, Eye, ShieldCheck, Music, Tv, ArrowRight, Zap, Trophy, Link as LinkIcon, DollarSign } from 'lucide-react';
import { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const viewport: Viewport = {
  themeColor: '#131110',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

async function getProfileData(handle: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
  try {
    const res = await fetch(`${apiUrl}/p/${handle}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

export async function generateMetadata(props: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const params = await props.params;
  const profile = await getProfileData(params.handle);
  if (!profile) return { title: 'Perfil Não Encontrado' };

  const scoreLabel = profile.scoreClass || 'BRONZE';
  
  return {
    title: `${profile.handle} | InfluNext [${scoreLabel}]`,
    description: `Métricas auditadas e ROI comprovado de @${profile.handle}. InfluScore: ${profile.influScore}.`,
    openGraph: {
      title: `${profile.handle} | InfluNext Media Kit`,
      description: `ROI Médio: +${((profile.avgROI - 1) * 100).toFixed(0)}% acima do mercado.`,
      images: [profile.profileImageUrl || '/og-default.png'],
    },
  };
}

export default async function PublicProfile(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const profile = await getProfileData(params.handle);

  if (!profile) notFound();

  const latestMetrics = profile.metricsHistory?.[0] || { followers: 0, engagementRate: 0, reachLast30Days: 0, avgViews: 0 };
  const roiPercentage = ((profile.avgROI - 1) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-[#131110] text-[#f5ebe0] selection:bg-orange-500/30 font-sans">
      
      <div className="max-w-[450px] mx-auto px-6 py-12 space-y-10">
        
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
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-[#131110] z-20 shadow-lg">
               <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/10 blur-[50px] rounded-full" />
          </div>

          <div className="space-y-1">
             <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-black tracking-tighter">@{profile.handle}</h1>
                {profile.verifiedMetrics && <ShieldCheck className="w-5 h-5 text-orange-400" />}
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Certificado de Ativo InfluNext</p>
          </div>
        </header>

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
                 <Trophy className="w-3 h-3 text-amber-500" />
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
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tabela de Preços Sugerida</h3>
                 <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {profile.rateCards.map((rate: any, idx: number) => (
                    <div key={idx} className="p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                       <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-zinc-100 uppercase tracking-tight">{rate.serviceName}</p>
                          <p className="text-[9px] text-zinc-500 font-medium">{rate.description || 'Entrega padrão garantida via Escrow'}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-emerald-400">R$ {rate.price.toLocaleString('pt-BR')}</p>
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Budget Base</p>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        )}

      </div>

      {/* Conversion Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#131110] via-[#131110] to-transparent z-50">
        <div className="max-w-[450px] mx-auto">
          <Link 
            href={`/register?influencerId=${profile.id}&role=COMPANY`}
            className="w-full h-16 bg-[#d96b27] text-[#131110] font-black rounded-3xl shadow-[0_20px_40px_rgba(217,107,39,0.25)] transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <ShieldCheck className="w-5 h-5" />
            Contratar via Escrow Seguro 🛡️
          </Link>
          <p className="text-center text-[9px] font-bold text-zinc-600 mt-4 uppercase tracking-[0.2em]">
             Powered by InfluNext High Performance Core
          </p>
        </div>
      </footer>

    </div>
  );
}
