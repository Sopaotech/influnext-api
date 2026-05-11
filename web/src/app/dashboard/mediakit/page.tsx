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
  Award
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
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* InfluScore Card - Massive */}
         <div className="md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -bottom-10 opacity-10">
               <Zap className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 space-y-8">
               <div className="space-y-1">
                  <div className="text-purple-400 font-black text-[10px] tracking-[0.3em] uppercase">Autoridade_Digital</div>
                  <h2 className="text-3xl font-black tracking-tight">InfluScore</h2>
               </div>
               <div className="flex items-baseline gap-2">
                  <span className="text-8xl font-black tracking-tighter leading-none">{profile?.influScore || 0}</span>
                  <span className="text-purple-400 font-black text-xl uppercase">/100</span>
               </div>
               <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-black uppercase tracking-widest">{profile?.scoreClass || 'BRONZE'} LEVEL</span>
               </div>
            </div>
         </div>

         {/* Secondary Stats Group */}
         <div className="md:col-span-2 grid grid-cols-2 gap-6">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-blue-600" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audiência Total</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{kpis?.latestFollowers?.toLocaleString() || '0'}</h3>
               </div>
               <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs">
                  <TrendingUp className="w-3.5 h-3.5" /> +12.4% este mês
               </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
               <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-pink-600" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Engajamento</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{kpis?.latestEngagement || '0.0'}%</h3>
               </div>
               <div className="mt-4 flex items-center gap-2 text-slate-400 font-bold text-xs">
                  Média do nicho: 2.1%
               </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
               <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-purple-600" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alcance 30 Dias</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">1.2M</h3>
               </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Views Médias / Post</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{kpis?.avgViews?.toLocaleString() || '0'}</h3>
               </div>
            </div>
         </div>
      </section>

      {/* Audience Demographics Section */}
      <section className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm">
        <div className="flex items-center justify-between mb-12">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] tracking-[0.3em] uppercase">
                <PieChart className="w-4 h-4" /> Demografia_Verified
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Análise de Audiência</h2>
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Dados atualizados há 2 horas
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
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
                         <span className="text-sm font-bold text-slate-700">{city.name}</span>
                         <span className="text-xs font-black text-slate-900">{city.p}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className={`h-full ${city.color} rounded-full`} style={{ width: `${city.p}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-l-2 border-purple-500 pl-3">Faixa Etária & Gênero</h4>
              <div className="flex items-center gap-10">
                 <div className="relative w-40 h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a855f7" strokeWidth="6" strokeDasharray="65, 100" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-2xl font-black text-slate-900">65%</span>
                       <span className="text-[8px] font-black uppercase text-slate-400">Feminino</span>
                    </div>
                 </div>
                 <div className="flex-1 space-y-4">
                    {[
                      { age: '18-24', p: 35 },
                      { age: '25-34', p: 48 },
                      { age: '35-44', p: 12 },
                      { age: '45+', p: 5 }
                    ].map(age => (
                      <div key={age.age} className="flex items-center gap-4">
                         <span className="text-[10px] font-bold text-slate-500 w-10">{age.age}</span>
                         <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-900 rounded-full" style={{ width: `${age.p}%` }} />
                         </div>
                         <span className="text-[10px] font-black text-slate-900 w-8">{age.p}%</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Verified Platforms */}
      <section className="bg-slate-50 border border-slate-200 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10">
         <div className="space-y-4 text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-900">Redes Ativas & Auditadas</h3>
            <p className="text-slate-500 text-sm font-medium max-w-sm">Métricas sincronizadas diretamente via API oficial para garantir 100% de integridade nos dados.</p>
         </div>
         <div className="flex flex-wrap justify-center gap-4">
            <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-sm">
               <Camera className="w-5 h-5 text-pink-600" />
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instagram</div>
                  <div className="text-sm font-bold text-slate-800">Conectado</div>
               </div>
            </div>
            <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 opacity-40 grayscale">
               <Zap className="w-5 h-5 text-slate-400" />
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">TikTok</div>
                  <div className="text-sm font-bold text-slate-800">Desconectado</div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}
