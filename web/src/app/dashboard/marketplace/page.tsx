'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, MapPin, Sparkles, Shield, SlidersHorizontal, ArrowRight, Loader2, Users, Building, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const NICHES = [
  'Todos', 'Moda & Estilo', 'Fitness & Saúde', 'Gastronomia', 'Tech & Gadgets',
  'Gamer', 'Música', 'Arte & Design', 'Lifestyle', 'Viagem', 'Serviços (Fotógrafos, Editores, etc.)', 'Finanças',
  'Educação', 'Humor & Entretenimento', 'Esportes', 'Beleza & Skincare',
  'Negócios & Empreendedorismo',
];

const SEGMENTS = [
  'Todos', 'Tecnologia', 'Moda & Beleza', 'Alimentação & Bebidas', 'Saúde & Fitness',
  'Educação', 'Serviços', 'Varejo', 'Finanças', 'Outros'
];

const SCORE_CLASSES: Record<string, string> = {
  BRONZE: 'text-amber-700 border-amber-200 bg-amber-50',
  SILVER: 'text-slate-600 border-slate-200 bg-slate-50',
  GOLD: 'text-yellow-700 border-yellow-200 bg-yellow-50',
  PLATINUM: 'text-cyan-700 border-cyan-200 bg-cyan-50',
  ELITE: 'text-orange-700 border-orange-200 bg-orange-50',
};

interface Influencer {
  id: string;
  handle: string;
  niche?: string;
  city?: string;
  state?: string;
  influScore: number;
  scoreClass: string;
  verifiedMetrics: boolean;
  metricsHistory?: { followers: number }[];
}

interface Company {
  id: string;
  companyName: string;
  segment?: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  bio?: string;
  campaignBudget?: string;
}

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}K`;
  return num.toLocaleString('pt-BR');
};

export default function MarketplacePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchType, setSearchType] = useState<'influencer' | 'company'>('influencer');
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [niche, setNiche] = useState('Todos');
  const [segment, setSegment] = useState('Todos');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Proposal modal state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [pitch, setPitch] = useState('');
  const [budgetProposed, setBudgetProposed] = useState('');
  const [proposalDeliverables, setProposalDeliverables] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Detect theme on mount and monitor changes
  useEffect(() => {
    const savedTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Interval check to listen to dynamic client theme changes
    const interval = setInterval(() => {
      const currentTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [theme]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (query) {
        const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
        params.set('q', cleanQuery);
      }
      if (city) params.set('city', city);
      if (state) params.set('state', state);

      if (searchType === 'influencer') {
        if (niche && niche !== 'Todos') params.set('niche', niche);
        if (minScore > 0) params.set('minScore', String(minScore));
        const res = await api.get<Influencer[]>(`/influencers/search?${params.toString()}`);
        setInfluencers(res.data);
      } else {
        if (segment && segment !== 'Todos') params.set('segment', segment);
        const res = await api.get<Company[]>(`/influencers/companies/search?${params.toString()}`);
        setCompanies(res.data);
      }
    } catch (err) {
      console.error('[MARKETPLACE]', err);
      if (searchType === 'influencer') {
        setInfluencers([]);
      } else {
        setCompanies([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, city, state, niche, minScore, searchType, segment]);

  // Auto-search on mount or when searchType changes
  useEffect(() => {
    handleSearch();
  }, [searchType]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSendProposal = async () => {
    if (!pitch || !budgetProposed || !proposalDeliverables) {
      toast.error('Por favor, preencha todos os campos da proposta.');
      return;
    }
    setIsSubmittingProposal(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Proposta de parceria enviada com sucesso para ${selectedCompany?.companyName}!`);
      setSelectedCompany(null);
      setPitch('');
      setBudgetProposed('');
      setProposalDeliverables('');
    } catch (err) {
      toast.error('Erro ao enviar proposta comercial.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-[0.2em]">
          {searchType === 'influencer' ? (
            <>
              <Users className="w-3.5 h-3.5" /> Radar de Talentos
            </>
          ) : (
            <>
              <Building className="w-3.5 h-3.5" /> Radar de Marcas & Empresas
            </>
          )}
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-current">
          {searchType === 'influencer' ? (
            <>
              Marketplace de <span className="text-orange-500">Influenciadores</span>
            </>
          ) : (
            <>
              Marketplace de <span className="text-orange-500">Marcas & Empresas</span>
            </>
          )}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
          {searchType === 'influencer'
            ? 'Encontre o talento certo pelo perfil, cidade e nicho. Contrate com segurança via Escrow.'
            : 'Encontre marcas parceiras no ecossistema e proponha novas parcerias comerciais diretamente.'}
        </p>
      </header>

      {/* Seletor de Tipo de Busca */}
      <div className={`flex gap-2 border-b pb-4 ${isDark ? 'border-white/5' : 'border-zinc-200'}`}>
        <button
          onClick={() => {
            setSearchType('influencer');
            setQuery('');
            setHasSearched(false);
          }}
          className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            searchType === 'influencer'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : (isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100')
          }`}
        >
          Influenciadores
        </button>
        <button
          onClick={() => {
            setSearchType('company');
            setQuery('');
            setHasSearched(false);
          }}
          className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            searchType === 'company'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
              : (isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100')
          }`}
        >
          Empresas
        </button>
      </div>

      {/* Search Bar - Theme Adaptive */}
      <div className={`border rounded-[2.5rem] p-4 md:p-6 transition-all space-y-4 shadow-sm ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100'
      }`}>
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Main query input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchType === 'influencer' ? "Buscar por @handle..." : "Buscar por nome da empresa..."}
              className={`rounded-2xl pl-11 pr-4 py-3 text-sm transition-all w-full [color-scheme:dark] ${
                isDark 
                  ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-300 focus:bg-white/10' 
                  : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white'
              }`}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 flex-shrink-0">
            {/* City */}
            <div className="relative md:w-[180px]">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cidade"
                className={`rounded-2xl pl-10 pr-4 py-3 text-sm transition-all w-full [color-scheme:dark] ${
                  isDark 
                    ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-300 focus:bg-white/10' 
                    : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white'
                }`}
              />
            </div>

            {/* State */}
            <div className="md:w-[80px]">
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
                onKeyDown={handleKeyDown}
                placeholder="UF"
                maxLength={2}
                className={`rounded-2xl px-4 py-3 text-sm transition-all w-full text-center font-black uppercase [color-scheme:dark] ${
                  isDark 
                    ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-300 focus:bg-white/10' 
                    : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white'
                }`}
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                showFilters 
                  ? 'border-orange-500 text-orange-500 bg-orange-500/10 shadow-sm' 
                  : (isDark ? 'border-white/10 text-zinc-500 hover:text-white hover:border-white/20' : 'border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:border-zinc-300')
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className={`border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {searchType === 'influencer' ? 'Nicho de Atuação' : 'Segmento de Mercado'}
              </label>
              {searchType === 'influencer' ? (
                <select
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  className={`rounded-2xl px-4 py-3 text-sm transition-all w-full font-bold [color-scheme:dark] ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:border-orange-300' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800 focus:border-orange-400 bg-white'
                  }`}
                >
                  {NICHES.map(n => (
                    <option key={n} value={n} className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-850"}>{n}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={segment}
                  onChange={e => setSegment(e.target.value)}
                  className={`rounded-2xl px-4 py-3 text-sm transition-all w-full font-bold [color-scheme:dark] ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:border-orange-300' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800 focus:border-orange-400 bg-white'
                  }`}
                >
                  {SEGMENTS.map(s => (
                    <option key={s} value={s} className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-850"}>{s}</option>
                  ))}
                </select>
              )}
            </div>
            {searchType === 'influencer' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  InfluScore mínimo: <span className="text-orange-400">{minScore}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="w-full accent-orange-600"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                  <span>0</span><span>500</span><span>1000</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pills de Filtragem Rápida */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {searchType === 'influencer' ? (
          NICHES.map(n => (
            <button
              key={n}
              onClick={() => { setNiche(n === niche ? 'Todos' : n); }}
              className={`flex-none text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest transition-all whitespace-nowrap border
                ${niche === n
                  ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/10'
                  : (isDark 
                      ? 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/20 shadow-sm'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-650 hover:bg-zinc-200 hover:text-zinc-900 shadow-sm')}`}
            >
              {n}
            </button>
          ))
        ) : (
          SEGMENTS.map(s => (
            <button
              key={s}
              onClick={() => { setSegment(s === segment ? 'Todos' : s); }}
              className={`flex-none text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest transition-all whitespace-nowrap border
                ${segment === s
                  ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/10'
                  : (isDark 
                      ? 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:border-white/20 shadow-sm'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-655 hover:bg-zinc-200 hover:text-zinc-900 shadow-sm')}`}
            >
              {s}
            </button>
          ))
        )}
      </div>

      {/* Seção Recomendada de Influenciadores */}
      {searchType === 'influencer' && !isLoading && influencers.length > 0 && !hasSearched && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter text-current">Recomendados para o seu Nicho</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">A inteligência InfluNext filtrou os perfis com maior potencial de conversão para você hoje.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {influencers.slice(0, 3).map((inf, idx) => (
              <div 
                key={`rec-${inf.id}`} 
                className={`rounded-[2rem] p-6 relative overflow-hidden group shadow-xl transition-all border ${
                  isDark 
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-white/5 text-white' 
                    : 'bg-white border-zinc-200/80 text-zinc-800 shadow-zinc-100'
                }`}
              >
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/20 blur-[40px] rounded-full group-hover:bg-amber-500/40 transition-colors" />
                <div className="flex justify-between items-start relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${
                    isDark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-800'
                  }`}>
                    {inf.handle.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Top {idx + 1} Match
                  </span>
                </div>
                <div className="mt-6 relative z-10">
                  <p className="text-xl font-black tracking-tighter">@{inf.handle}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ROI Estimado: <span className="text-emerald-500">+14%</span></p>
                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                      {inf.metricsHistory?.[0]?.followers ? formatNumber(inf.metricsHistory[0].followers) : '---'} segs
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/company/new-contract?influencerId=${inf.id}&handle=${inf.handle}`}
                  className={`mt-6 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center block transition-all relative z-10 border ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 border-white/5 text-white' 
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-250 text-zinc-700'
                  }`}
                >
                  Propor Contrato
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultados de Busca */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Analisando o mercado...</p>
        </div>
      ) : searchType === 'influencer' ? (
        hasSearched && influencers.length === 0 ? (
          <div className={`border-2 border-dashed rounded-[2.5rem] p-16 text-center space-y-4 ${
            isDark ? 'border-white/5 bg-black/35' : 'border-zinc-200 bg-white shadow-sm'
          }`}>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-zinc-200/50">
               <Search size={32} className="text-zinc-550" />
            </div>
            <p className="font-black uppercase tracking-widest text-sm text-current">Nenhum talento encontrado.</p>
            <p className="text-zinc-400 text-xs font-bold">Tente ampliar a busca — remova o filtro de cidade ou nicho.</p>
          </div>
        ) : (
          <>
            {hasSearched && (
              <div className="flex items-center gap-4">
                 <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                   {influencers.length} talento{influencers.length !== 1 ? 's' : ''} disponível{influencers.length !== 1 ? 'is' : ''}
                 </p>
                 <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {influencers.map(inf => (
                <div
                  key={inf.id}
                  className={`group border rounded-[2.5rem] p-6 transition-all duration-500 space-y-6 ${
                    isDark 
                      ? 'bg-black/35 border-white/5 hover:border-orange-500/25 hover:shadow-xl hover:shadow-orange-500/5 text-white' 
                      : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100 hover:border-orange-500/30 hover:shadow-xl hover:shadow-zinc-200/50 text-zinc-800'
                  }`}
                >
                  {/* Avatar & Shield */}
                  <div className="flex items-start justify-between">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-500">
                      {inf.handle.charAt(0).toUpperCase()}
                    </div>
                    {inf.verifiedMetrics && (
                      <div className="p-2 bg-emerald-500/10 rounded-xl" title="Métricas verificadas">
                        <Shield className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <p className="font-black text-current text-xl tracking-tighter group-hover:text-orange-500 transition-colors">@{inf.handle}</p>
                    <div className="flex items-center flex-wrap gap-2">
                      {inf.niche && (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                        }`}>
                          {inf.niche}
                        </span>
                      )}
                      {(inf.city || inf.state) && (
                        <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                          <MapPin className="w-3 h-3" />
                          {[inf.city, inf.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Followers */}
                  <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">InfluScore / Seguidores</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black tracking-tighter text-current">{inf.influScore}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">
                          • {inf.metricsHistory?.[0]?.followers ? formatNumber(inf.metricsHistory[0].followers) : '---'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${SCORE_CLASSES[inf.scoreClass] || SCORE_CLASSES['BRONZE']}`}>
                      {inf.scoreClass}
                    </span>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/dashboard/company/new-contract?influencerId=${inf.id}&handle=${inf.handle}`}
                    className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                      isDark 
                        ? 'bg-white/5 text-zinc-400 hover:bg-orange-600 hover:text-white border border-transparent' 
                        : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                    }`}
                  >
                    Propor Contrato <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        // Seção Empresas
        hasSearched && companies.length === 0 ? (
          <div className={`border-2 border-dashed rounded-[2.5rem] p-16 text-center space-y-4 ${
            isDark ? 'border-white/5 bg-black/35' : 'border-zinc-200 bg-white shadow-sm'
          }`}>
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-zinc-200/50">
               <Building size={32} className="text-zinc-550" />
            </div>
            <p className="font-black uppercase tracking-widest text-sm text-current">Nenhuma empresa encontrada.</p>
            <p className="text-zinc-400 text-xs font-bold">Tente ampliar a busca — remova o filtro de cidade ou segmento.</p>
          </div>
        ) : (
          <>
            {hasSearched && (
              <div className="flex items-center gap-4">
                 <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                   {companies.length} empresa{companies.length !== 1 ? 's' : ''} encontrada{companies.length !== 1 ? 's' : ''}
                 </p>
                 <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {companies.map(comp => (
                <div
                  key={comp.id}
                  className={`group border rounded-[2.5rem] p-6 transition-all duration-500 flex flex-col justify-between space-y-6 ${
                    isDark 
                      ? 'bg-black/35 border-white/5 hover:border-orange-500/25 hover:shadow-xl hover:shadow-orange-500/5 text-white' 
                      : 'bg-white border-zinc-200/80 shadow-md shadow-zinc-100 hover:border-orange-500/30 hover:shadow-xl hover:shadow-zinc-200/50 text-zinc-800'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Logo & Building Icon */}
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                        {comp.logoUrl ? (
                          <img src={comp.logoUrl} alt={comp.companyName} className="w-full h-full object-cover" />
                        ) : (
                          comp.companyName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="p-2 bg-orange-500/10 rounded-xl" title="Parceira Registrada">
                        <Building className="w-4 h-4 text-orange-400" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <p className="font-black text-current text-xl tracking-tighter group-hover:text-orange-500 transition-colors">{comp.companyName}</p>
                      <div className="flex items-center flex-wrap gap-2">
                        {comp.segment && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-650'
                          }`}>
                            {comp.segment}
                          </span>
                        )}
                        {(comp.city || comp.state) && (
                          <span className="text-[9px] text-zinc-500 font-bold flex items-center gap-1 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" />
                            {[comp.city, comp.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                      {comp.bio && (
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium line-clamp-2 mt-1">
                          {comp.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Budget */}
                    <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Budget Médio / Campanha</p>
                        <span className="text-sm font-black text-emerald-500 tracking-tighter">
                          {comp.campaignBudget ? `R$ ${parseFloat(comp.campaignBudget).toLocaleString('pt-BR')}` : 'Sob consulta'}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => setSelectedCompany(comp)}
                      className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                        isDark 
                          ? 'bg-white/5 text-zinc-400 hover:bg-orange-600 hover:text-white border border-transparent' 
                          : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                      }`}
                    >
                      Propor Parceria <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      )}

      {/* Modal de Envio de Proposta Comercial */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`border rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-300 ${
            isDark ? 'bg-[#0f0e0f] border-white/10' : 'bg-white border-zinc-200'
          }`}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedCompany(null)}
              className={`absolute right-6 top-6 p-2 rounded-xl transition-colors ${
                isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-950'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <header className="space-y-2">
              <div className="flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                <Building className="w-4 h-4" /> Proposta Comercial
              </div>
              <h2 className="text-2xl font-black text-current tracking-tighter">
                Parceria com {selectedCompany.companyName}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                Descreva seus termos e envie seu pitch diretamente para a equipe de marketing da marca.
              </p>
            </header>

            <div className="space-y-4">
              {/* Pitch */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Apresentação / Pitch</label>
                <textarea
                  value={pitch}
                  onChange={e => setPitch(e.target.value)}
                  placeholder="Olá! Gostaria de colaborar com sua marca pois meu público-alvo tem sinergia com o seu produto..."
                  rows={4}
                  className={`rounded-2xl p-4 text-sm transition-all w-full resize-none [color-scheme:dark] ${
                    isDark 
                      ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:bg-white/10' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white'
                  }`}
                />
              </div>

              {/* Budget & Deliverables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Orçamento Pretendido (R$)</label>
                  <input
                    type="number"
                    value={budgetProposed}
                    onChange={e => setBudgetProposed(e.target.value)}
                    placeholder="Ex: 1500"
                    className={`rounded-2xl px-4 py-3.5 text-sm transition-all w-full [color-scheme:dark] ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:bg-white/10' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white'
                    }`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Entregáveis Planejados</label>
                  <input
                    type="text"
                    value={proposalDeliverables}
                    onChange={e => setProposalDeliverables(e.target.value)}
                    placeholder="Ex: 1x Reels + 3x Stories"
                    className={`rounded-2xl px-4 py-3.5 text-sm transition-all w-full [color-scheme:dark] ${
                      isDark 
                        ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:bg-white/10' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>
            </div>

            <footer className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedCompany(null)}
                className={`flex-1 py-4 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  isDark ? 'border-white/10 text-zinc-450 hover:text-white hover:bg-white/5' : 'border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendProposal}
                disabled={isSubmittingProposal}
                className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
              >
                {isSubmittingProposal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Enviar Proposta
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
