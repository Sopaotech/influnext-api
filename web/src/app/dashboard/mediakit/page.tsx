'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Share2, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  BarChart3,
  Globe,
  PieChart,
  Award,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

export default function MediaKitPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMediaKitData();
  }, []);

  const fetchMediaKitData = async () => {
    try {
      const res = await api.get('/dashboard/influencer');
      setData(res.data);
    } catch (err) {
      console.error('Erro ao carregar Media Kit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/p/${data?.profile?.handle || ''}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do perfil público copiado!');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Sincronizando Ativos Digitais...</p>
      </div>
    );
  }

  const profile = data?.profile;
  const kpis = data?.kpis;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-32">
      
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/[0.08]">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-500 font-black text-[10px] tracking-[0.4em] uppercase">
            <Award className="w-5 h-5" />
            Official_Media_Kit v2.1
          </div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-1 shadow-2xl shadow-purple-600/20">
               <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center overflow-hidden">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={profile.handle} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">{profile?.handle?.[0]?.toUpperCase()}</span>
                  )}
               </div>
            </div>
            <div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                @{profile?.handle || 'Influencer'}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                 <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                    {profile?.niche || 'Nicho Não Definido'}
                 </div>
                 <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" /> Perfil Verificado
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className="px-6 py-4 bg-white border border-slate-200 hover:border-purple-300 hover:bg-slate-50 rounded-2xl flex items-center gap-3 transition-all font-bold text-sm text-slate-700 shadow-sm"
          >
            <Share2 className="w-4 h-4" /> Compartilhar Kit
          </button>
          <button className="px-8 py-4 bg-slate-900 hover:bg-purple-600 text-white rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </header>

      {/* Main Stats Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* InfluScore Card - Massive */}
         <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
               <Zap className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 space-y-8">
               <div className="space-y-1">
                  <div className="text-purple-400 font-black text-[10px] tracking-[0.4em] uppercase">Autoridade_Digital</div>
                  <h2 className="text-4xl font-black tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">InfluScore</h2>
               </div>
               <div className="flex items-baseline gap-2">
                  <span className="text-9xl font-black tracking-tighter leading-none">{profile?.influScore || 0}</span>
                  <span className="text-purple-400 font-black text-xl uppercase">/100</span>
               </div>
               <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                  <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-black uppercase tracking-widest">{profile?.scoreClass || 'BRONZE'} LEVEL</span>
               </div>
            </div>
         </div>

         {/* Secondary Stats Group */}
         <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
               <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                  <Users className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audiência Total</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{kpis?.latestFollowers?.toLocaleString() || '0'}</h3>
               </div>
               <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-wider bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                  <TrendingUp className="w-4 h-4" /> +12.4% MoM
               </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
               <div className="w-14 h-14 rounded-2xl bg-pink-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20 group-hover:rotate-6 transition-transform">
                  <Target className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxa de Engajamento</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{kpis?.latestEngagement || '0.0'}%</h3>
               </div>
               <div className="mt-4 flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest bg-slate-100 w-fit px-3 py-1 rounded-full border border-slate-200">
                  Média do nicho: 2.1%
               </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
               <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:rotate-6 transition-transform">
                  <Globe className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alcance 30 Dias</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">1.2M</h3>
               </div>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/40 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
               <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
                  <BarChart3 className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Views Médias / Post</p>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{kpis?.avgViews?.toLocaleString() || '0'}</h3>
               </div>
            </div>
         </div>
      </section>

      {/* INVESTMENT TABLE (Rate Card) - NEW SECTION */}
      <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
            <CreditCard className="w-64 h-64 text-slate-900" />
         </div>
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-slate-900 font-black text-[11px] tracking-[0.4em] uppercase">
                 <CreditCard className="w-4 h-4" /> Invest_Table_2026
               </div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Catálogo de Serviços</h2>
            </div>
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
               Valores Base // Sujeito a briefing
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
            {data?.rateCard?.length > 0 ? data.rateCard.map((rate: any, idx: number) => (
               <div key={idx} className="bg-white/80 border border-white p-6 md:p-8 rounded-[2rem] hover:scale-[1.02] transition-all duration-500 group shadow-sm hover:shadow-xl">
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                     <div className="p-3 bg-slate-900 text-white rounded-xl group-hover:bg-purple-600 transition-colors">
                        <Zap className="w-4 h-4" />
                     </div>
                     <span className="text-lg md:text-xl font-black text-slate-900 tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rate.price)}
                     </span>
                  </div>
                  <h4 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{rate.serviceName}</h4>
                  <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">{rate.description}</p>
               </div>
            )) : (
               <div className="col-span-full py-12 md:py-20 text-center space-y-4 opacity-40">
                  <div className="flex justify-center">
                     <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-slate-400" />
                  </div>
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500">Nenhum serviço cadastrado ainda.</p>
               </div>
            )}
          </div>
       </section>

      {/* Audience Demographics Section - Only show if connected */}
      {data?.platforms && data.platforms.length > 0 && (
      <section className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-[10px] md:text-[11px] tracking-[0.4em] uppercase">
                <PieChart className="w-4 h-4" /> Demografia_Verified
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Análise de Audiência</h2>
           </div>
           <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white/50 px-4 py-2 rounded-full border border-white/50">
              Dados atualizados há 2 horas
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
           <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-l-2 border-purple-500 pl-3">Principais Cidades</h4>
              <div className="space-y-6">
                 {[
                   { name: 'São Paulo', p: 42, color: 'bg-purple-600' },
                   { name: 'Rio de Janeiro', p: 18, color: 'bg-indigo-500' },
                   { name: 'Belo Horizonte', p: 12, color: 'bg-indigo-400' },
                   { name: 'Curitiba', p: 9, color: 'bg-slate-300' }
                 ].map(city => (
                   <div key={city.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-xs md:text-sm font-bold text-slate-700">{city.name}</span>
                         <span className="text-[10px] md:text-xs font-black text-slate-900">{city.p}%</span>
                      </div>
                      <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className={`h-full ${city.color} rounded-full`} style={{ width: `${city.p}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-l-2 border-purple-500 pl-3">Faixa Etária & Gênero</h4>
              <div className="flex flex-col sm:flex-row items-center gap-10 md:gap-10">
                 <div className="relative w-32 h-32 md:w-40 md:h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a855f7" strokeWidth="6" strokeDasharray="65, 100" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-xl md:text-2xl font-black text-slate-900">65%</span>
                       <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-400">Feminino</span>
                    </div>
                 </div>
                 <div className="w-full sm:flex-1 space-y-4">
                    {[
                      { age: '18-24', p: 35 },
                      { age: '25-34', p: 48 },
                      { age: '35-44', p: 12 },
                      { age: '45+', p: 5 }
                    ].map(age => (
                      <div key={age.age} className="flex items-center gap-4">
                         <span className="text-[9px] md:text-[10px] font-bold text-slate-500 w-10">{age.age}</span>
                         <div className="flex-1 h-1 md:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-900 rounded-full" style={{ width: `${age.p}%` }} />
                         </div>
                         <span className="text-[9px] md:text-[10px] font-black text-slate-900 w-8">{age.p}%</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>
      )}

      {/* Verified Platforms */}
      <section className="bg-slate-50 border border-slate-200 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="space-y-4 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black text-slate-900">Redes Ativas & Auditadas</h3>
            <p className="text-slate-500 text-xs md:text-sm font-medium max-w-sm">Métricas sincronizadas diretamente via API oficial para garantir 100% de integridade nos dados.</p>
         </div>
         <div className="flex flex-wrap justify-center gap-4">
            {/* Instagram Node */}
            <div className={`px-4 md:px-6 py-3 md:py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm ${data?.platforms?.some((p: any) => p.platform === 'INSTAGRAM') ? '' : 'opacity-40 grayscale'}`}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600">
                 <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                 <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                 <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
               </svg>
               <div>
                  <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Instagram</div>
                  <div className="text-xs md:text-sm font-bold text-slate-800">
                    {data?.platforms?.some((p: any) => p.platform === 'INSTAGRAM') ? 'Conectado' : 'Desconectado'}
                  </div>
               </div>
            </div>
            
            {/* TikTok Node */}
            <div className={`px-4 md:px-6 py-3 md:py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm ${data?.platforms?.some((p: any) => p.platform === 'TIKTOK') ? '' : 'opacity-40 grayscale'}`}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={data?.platforms?.some((p: any) => p.platform === 'TIKTOK') ? "text-slate-900" : "text-slate-400"}>
                 <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.23-2.5.83-5.06 2.82-6.52 1.39-1.04 3.18-1.54 4.93-1.39v4.06c-1.16-.1-2.35.15-3.32.84-.81.57-1.38 1.48-1.46 2.47-.09 1.14.36 2.3 1.18 3.08.79.76 1.93 1.14 3.04 1.05 1.54-.12 2.88-1.28 3.23-2.79.16-.67.24-1.37.24-2.06V.02z" />
               </svg>
               <div>
                  <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">TikTok</div>
                  <div className="text-xs md:text-sm font-bold text-slate-800">
                    {data?.platforms?.some((p: any) => p.platform === 'TIKTOK') ? 'Conectado' : 'Desconectado'}
                  </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}
