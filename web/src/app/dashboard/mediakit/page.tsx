'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Share2, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  BarChart3,
  Globe,
  PieChart,
  Award,
  CreditCard,
  Building,
  Activity,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export default function MediaKitPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userRole = Cookies.get('influnext_role');
  const isCompany = userRole === 'COMPANY';

  // Monitor theme updates
  useEffect(() => {
    const savedTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const interval = setInterval(() => {
      const currentTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [theme]);

  useEffect(() => {
    fetchMediaKitData();
  }, []);

  const fetchMediaKitData = async () => {
    try {
      setIsLoading(true);
      if (isCompany) {
        const res = await api.get('/dashboard/company');
        setData(res.data);
      } else {
        const res = await api.get('/dashboard/influencer');
        setData(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar Media Kit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const handle = isCompany ? 'marca.premium' : data?.profile?.handle || '';
    const url = `${window.location.origin}/p/${handle}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do perfil público copiado!');
  };

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-zinc-550 text-[10px] uppercase font-black tracking-widest">Sincronizando Ativos Digitais...</p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}K`;
    return num.toLocaleString('pt-BR');
  };

  // Mapeamentos para influenciador
  const profile = data?.profile;
  const kpis = data?.kpis;
  const instagramPlatform = data?.platforms?.find((p: any) => p.platformName === 'INSTAGRAM' || p.platform === 'INSTAGRAM');
  const tiktokPlatform = data?.platforms?.find((p: any) => p.platformName === 'TIKTOK' || p.platform === 'TIKTOK');

  // Mapeamentos simulados para Empresa (Caso logado como COMPANY)
  const companyProfile = isCompany ? {
    name: profile?.companyName || 'Marca Premium Ltda',
    segment: profile?.segment || 'Fashion',
    employees: profile?.employeeCount || '51-200',
    budget: profile?.campaignBudget || 'R$ 50k - R$ 200k',
    taxId: profile?.taxId || '00.000.000/0001-91',
    city: profile?.city || 'São Paulo',
    state: profile?.state || 'SP',
    bio: profile?.bio || 'Marca pioneira em alfaiataria sustentável de linho e algodão orgânico.',
    logoUrl: profile?.logoUrl || 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=400&auto=format&fit=crop',
    instagramUsername: 'marca.premium',
    tiktokUsername: 'marca.premium'
  } : null;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32">
      
      {/* Premium Header */}
      <header className={`flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b ${
        isDark ? 'border-white/[0.08]' : 'border-zinc-200'
      }`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] tracking-[0.4em] uppercase">
            <Award className="w-5 h-5" />
            {isCompany ? 'Corporate_Brand_Kit v2.1' : 'Official_Media_Kit v2.1'}
          </div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 p-1 shadow-2xl shadow-orange-600/20">
               <div className={`w-full h-full rounded-[1.4rem] flex items-center justify-center overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                  {isCompany ? (
                    companyProfile?.logoUrl ? (
                      <img src={companyProfile.logoUrl} alt={companyProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-orange-500">M</span>
                    )
                  ) : profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt={profile.handle} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">{profile?.handle?.[0]?.toUpperCase()}</span>
                  )}
               </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-current tracking-tighter">
                {isCompany ? companyProfile?.name : `@${profile?.handle || 'Influencer'}`}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                 <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                   isDark ? 'bg-white/5 text-zinc-400 border-white/10' : 'bg-zinc-100 text-zinc-650 border-zinc-250'
                 }`}>
                    {isCompany ? companyProfile?.segment : (profile?.niche || 'Nicho Não Definido')}
                 </div>
                 <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" /> {isCompany ? 'Marca Homologada' : 'Perfil Verificado'}
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleShare}
            className={`px-6 py-4 border rounded-2xl flex items-center gap-3 transition-all font-bold text-sm shadow-sm ${
              isDark ? 'bg-white/5 border-white/10 hover:border-orange-500/50 hover:bg-white/10 text-white' : 'bg-white border-zinc-200 hover:border-orange-500 hover:bg-zinc-50 text-zinc-700'
            }`}
          >
            <Share2 className="w-4 h-4" /> Compartilhar Kit
          </button>
          <button className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl ${
            isDark ? 'bg-white/10 hover:bg-orange-600 text-white' : 'bg-slate-900 hover:bg-orange-600 text-white shadow-zinc-250/20'
          }`}>
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </header>

      {/* Main Stats Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* InfluScore/Brand Positioning Card */}
         <div className={`rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group ${
           isCompany 
             ? 'bg-gradient-to-br from-amber-600 to-orange-600' 
             : 'bg-gradient-to-br from-slate-900 to-slate-800'
         }`}>
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
               <Zap className="w-64 h-64 text-white" />
            </div>
            <div className="relative z-10 space-y-8">
               <div className="space-y-1">
                  <div className="text-white/80 font-black text-[10px] tracking-[0.4em] uppercase">
                    {isCompany ? 'Posicionamento_Mercado' : 'Autoridade_Digital'}
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter drop-shadow-sm">
                    {isCompany ? 'Brand Index' : 'InfluScore'}
                  </h2>
               </div>
               <div className="flex items-baseline gap-2">
                  <span className="text-9xl font-black tracking-tighter leading-none">
                    {isCompany ? '92' : (profile?.influScore || 0)}
                  </span>
                  <span className="text-white/80 font-black text-xl uppercase">/100</span>
               </div>
               <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
                  <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-black uppercase tracking-widest">
                    {isCompany ? 'PREMIUM BRAND' : `${profile?.scoreClass || 'BRONZE'} LEVEL`}
                  </span>
               </div>
            </div>
         </div>

         {/* Secondary Stats Group */}
         <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className={`border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group ${
              isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200'
            }`}>
               <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                  <Users className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Audiência da Marca</p>
                  <h3 className="text-5xl font-black text-current tracking-tighter">
                    {isCompany ? '85.000' : (kpis?.latestFollowers?.toLocaleString() || '0')}
                  </h3>
               </div>
               <div className="mt-4 flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-wider bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" /> +15.2% MoM
               </div>
            </div>

            <div className={`border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group ${
              isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200'
            }`}>
               <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
                  <Target className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Engajamento Orgânico</p>
                  <h3 className="text-5xl font-black text-current tracking-tighter">
                    {isCompany ? '3.6%' : `${kpis?.latestEngagement || '0.0'}%`}
                  </h3>
               </div>
               <div className={`mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest w-fit px-3 py-1 rounded-full border ${
                 isDark ? 'text-zinc-400 bg-white/5 border-white/10' : 'text-zinc-600 bg-zinc-50 border-zinc-200'
               }`}>
                  Média do varejo: 1.8%
               </div>
            </div>

            <div className={`border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group ${
              isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200'
            }`}>
               <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform">
                  <Globe className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Alcance Mensal da Marca</p>
                  <h3 className="text-5xl font-black text-current tracking-tighter">
                    {isCompany ? '95K' : formatNumber(kpis?.latestReach || 0)}
                  </h3>
               </div>
            </div>

            <div className={`border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group ${
              isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200'
            }`}>
               <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
                  <BarChart3 className="w-7 h-7" />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Visualizações Médias</p>
                  <h3 className="text-5xl font-black text-current tracking-tighter">
                    {isCompany ? '15.000' : (kpis?.avgViews?.toLocaleString() || '0')}
                  </h3>
               </div>
            </div>
         </div>
      </section>

      {/* INVESTMENT TABLE / BRAND SERVICES RATE CARD */}
      <section className={`border rounded-[3rem] p-10 shadow-2xl relative overflow-hidden ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200'
      }`}>
         <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
            <CreditCard className="w-64 h-64 text-zinc-700" />
         </div>
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-zinc-400 font-black text-[11px] tracking-[0.4em] uppercase">
                 <Building className="w-4 h-4 text-orange-500" /> {isCompany ? 'Brand_Assets_2026' : 'Invest_Table_2026'}
               </div>
               <h2 className="text-4xl font-black text-current tracking-tighter">
                 {isCompany ? 'Ativos da Marca & Orçamento' : 'Catálogo de Serviços'}
               </h2>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md">
               {isCompany ? 'Marca Parceira Oficial' : 'Valores Base // Sujeito a briefing'}
            </div>
         </div>

         {isCompany ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
             <div className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-300 ${
               isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-250'
             }`}>
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-orange-600 text-white rounded-xl">
                      <Building className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                     Cadastro CNPJ
                   </span>
                </div>
                <h4 className="text-base md:text-lg font-black text-current uppercase tracking-tight mb-2">Detalhes Corporativos</h4>
                <div className="space-y-1 text-xs text-zinc-550 dark:text-zinc-400 font-medium">
                  <p>CNPJ: {companyProfile?.taxId}</p>
                  <p>Colaboradores: {companyProfile?.employees}</p>
                  <p>Cidade/UF: {companyProfile?.city}/{companyProfile?.state}</p>
                </div>
             </div>

             <div className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-300 ${
               isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-250'
             }`}>
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-emerald-600 text-white rounded-xl">
                      <Activity className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                     Verificado
                   </span>
                </div>
                <h4 className="text-base md:text-lg font-black text-current uppercase tracking-tight mb-2">Budget Anual de Marketing</h4>
                <div className="space-y-1 text-xs text-zinc-550 dark:text-zinc-400 font-medium">
                  <p>Faixa: {companyProfile?.budget}</p>
                  <p>Foco: Tráfego Pago & Influenciadores</p>
                  <p>Taxa de Conversão Alvo: 3.5%</p>
                </div>
             </div>

             <div className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-300 ${
               isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-250'
             }`}>
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-purple-600 text-white rounded-xl">
                      <Layers className="w-4 h-4" />
                   </div>
                   <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                     Branding IA
                   </span>
                </div>
                <h4 className="text-base md:text-lg font-black text-current uppercase tracking-tight mb-2">Posicionamento Estético</h4>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium leading-relaxed">
                  {companyProfile?.bio}
                </p>
             </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 relative z-10">
              {data?.rateCard?.length > 0 ? data.rateCard.map((rate: any, idx: number) => (
                 <div key={idx} className={`p-6 md:p-8 rounded-[2rem] hover:scale-[1.02] transition-all duration-500 group shadow-sm hover:shadow-xl border ${
                   isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-250 shadow-zinc-100/50'
                 }`}>
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                       <div className="p-3 bg-white/10 text-current rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                          <Zap className="w-4 h-4" />
                       </div>
                       <span className="text-lg md:text-xl font-black text-current tracking-tighter">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rate.price)}
                       </span>
                    </div>
                    <h4 className="text-base md:text-lg font-black text-current uppercase tracking-tight mb-2">{rate.serviceName}</h4>
                    <p className="text-[11px] md:text-xs text-zinc-550 dark:text-zinc-400 font-medium leading-relaxed">{rate.description}</p>
                 </div>
              )) : (
                 <div className="col-span-full py-12 md:py-20 text-center space-y-4 opacity-40">
                    <div className="flex justify-center">
                       <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-zinc-500" />
                    </div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-500">Nenhum serviço cadastrado ainda.</p>
                 </div>
              )}
            </div>
         )}
       </section>

       {/* Audience Demographics Section */}
       <section className={`border rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm relative z-10 ${
         isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-zinc-100/50'
       }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
           <div className="space-y-1">
              <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] md:text-[11px] tracking-[0.4em] uppercase">
                <PieChart className="w-4 h-4" /> {isCompany ? 'Consumo_Demographics_2026' : 'Demografia_Verified'}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-current tracking-tighter">
                {isCompany ? 'Demografia de Clientes e Público' : 'Análise de Audiência'}
              </h2>
           </div>
           <div className={`flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border ${
             isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-250 text-zinc-550'
           }`}>
              Dados atualizados há 2 horas
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
           <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-orange-500 pl-3">Principais Cidades</h4>
              <div className="space-y-6">
                 {[
                   { name: 'São Paulo', p: isCompany ? 52 : 42, color: 'bg-orange-600' },
                   { name: 'Rio de Janeiro', p: isCompany ? 20 : 18, color: 'bg-amber-500' },
                   { name: 'Belo Horizonte', p: isCompany ? 10 : 12, color: 'bg-amber-400' },
                   { name: 'Curitiba', p: isCompany ? 8 : 9, color: 'bg-zinc-700' }
                 ].map(city => (
                   <div key={city.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-xs md:text-sm font-bold text-zinc-550 dark:text-zinc-300">{city.name}</span>
                         <span className="text-[10px] md:text-xs font-black text-current">{city.p}%</span>
                      </div>
                      <div className="h-1.5 md:h-2 w-full bg-white/10 dark:bg-white/10 rounded-full overflow-hidden">
                         <div className={`h-full ${city.color} rounded-full`} style={{ width: `${city.p}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-l-2 border-orange-500 pl-3">Faixa Etária & Gênero</h4>
              <div className="flex flex-col sm:flex-row items-center gap-10 md:gap-10">
                 <div className="relative w-32 h-32 md:w-40 md:h-40">
                    <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
                       <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#a855f7" strokeWidth="6" strokeDasharray={isCompany ? "75, 100" : "65, 100"} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-xl md:text-2xl font-black text-current">{isCompany ? '75%' : '65%'}</span>
                       <span className="text-[7px] md:text-[8px] font-black uppercase text-zinc-500">Feminino</span>
                    </div>
                 </div>
                 <div className="w-full sm:flex-1 space-y-4">
                    {[
                      { age: '18-24', p: isCompany ? 30 : 35 },
                      { age: '25-34', p: isCompany ? 55 : 48 },
                      { age: '35-44', p: isCompany ? 10 : 12 },
                      { age: '45+', p: isCompany ? 5 : 5 }
                    ].map(age => (
                      <div key={age.age} className="flex items-center gap-4">
                         <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 w-10">{age.age}</span>
                         <div className="flex-1 h-1 md:h-1.5 bg-white/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-900 dark:bg-white rounded-full" style={{ width: `${age.p}%` }} />
                         </div>
                         <span className="text-[9px] md:text-[10px] font-black text-current w-8">{age.p}%</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Verified Platforms */}
      <section className={`border rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10 ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-zinc-100/50'
      }`}>
         <div className="space-y-4 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black text-current uppercase tracking-tighter">Canais de Comunicação da Marca</h3>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs md:text-sm font-medium max-w-sm leading-relaxed">Dados de engajamento social da própria marca para validação corporativa e co-branding.</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Instagram Node */}
            <div className={`px-6 py-4 border rounded-2xl flex items-center gap-4 shadow-sm flex-1 md:flex-initial transition-all ${
              isCompany ? 'border-pink-500/20' : (instagramPlatform ? 'border-pink-500/20' : 'opacity-40 grayscale')
            } ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-250'}`}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 flex-shrink-0">
                 <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                 <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                 <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
               </svg>
               <div className="text-left">
                  <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Instagram</div>
                  <div className="text-xs font-bold text-zinc-650 dark:text-zinc-200 mt-0.5">
                    {isCompany ? (
                      <span>@{companyProfile?.instagramUsername} • <span className="text-pink-500 font-black">85K</span></span>
                    ) : instagramPlatform ? (
                      <span>@{instagramPlatform.username} • <span className="text-pink-400 font-black">{formatNumber(instagramPlatform.followersCount)}</span></span>
                    ) : 'Desconectado'}
                  </div>
               </div>
            </div>
            
            {/* TikTok Node */}
            <div className={`px-6 py-4 border rounded-2xl flex items-center gap-4 shadow-sm flex-1 md:flex-initial transition-all ${
              isCompany ? 'border-orange-500/20' : (tiktokPlatform ? 'border-orange-500/20' : 'opacity-40 grayscale')
            } ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-250'}`}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={`flex-shrink-0 ${isCompany || tiktokPlatform ? "text-orange-400" : "text-zinc-550"}`}>
                 <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.23-2.5.83-5.06 2.82-6.52 1.39-1.04 3.18-1.54 4.93-1.39v4.06c-1.16-.1-2.35.15-3.32.84-.81.57-1.38 1.48-1.46 2.47-.09 1.14.36 2.3 1.18 3.08.79.76 1.93 1.14 3.04 1.05 1.54-.12 2.88-1.28 3.23-2.79.16-.67.24-1.37.24-2.06V.02z" />
               </svg>
               <div className="text-left">
                  <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">TikTok</div>
                  <div className="text-xs font-bold text-zinc-650 dark:text-zinc-200 mt-0.5">
                    {isCompany ? (
                      <span>@{companyProfile?.tiktokUsername} • <span className="text-orange-400 font-black">120K</span></span>
                    ) : tiktokPlatform ? (
                      <span>@{tiktokPlatform.username} • <span className="text-orange-400 font-black">{formatNumber(tiktokPlatform.followersCount)}</span></span>
                    ) : 'Desconectado'}
                  </div>
               </div>
            </div>
         </div>
      </section>
 
    </div>
  );
}
