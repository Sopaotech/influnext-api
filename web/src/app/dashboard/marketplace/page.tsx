'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, MapPin, Sparkles, Shield, SlidersHorizontal, ArrowRight, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NICHES = [
  'Todos', 'Moda & Estilo', 'Fitness & Saúde', 'Gastronomia', 'Tech & Gadgets',
  'Gamer', 'Música', 'Arte & Design', 'Lifestyle', 'Viagem', 'Finanças',
  'Educação', 'Humor & Entretenimento', 'Esportes', 'Beleza & Skincare',
  'Negócios & Empreendedorismo',
];

const SCORE_CLASSES: Record<string, string> = {
  BRONZE: 'text-amber-700 border-amber-200 bg-amber-50',
  SILVER: 'text-slate-600 border-slate-200 bg-slate-50',
  GOLD: 'text-yellow-700 border-yellow-200 bg-yellow-50',
  PLATINUM: 'text-cyan-700 border-cyan-200 bg-cyan-50',
  ELITE: 'text-purple-700 border-purple-200 bg-purple-50',
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
}

export default function MarketplacePage() {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [niche, setNiche] = useState('Todos');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (city) params.set('city', city);
      if (state) params.set('state', state);
      if (niche && niche !== 'Todos') params.set('niche', niche);
      if (minScore > 0) params.set('minScore', String(minScore));

      const res = await api.get<Influencer[]>(`/influencers/search?${params.toString()}`);
      setInfluencers(res.data);
    } catch (err) {
      console.error('[MARKETPLACE]', err);
      setInfluencers([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, city, state, niche, minScore]);

  // Auto-search on mount to show all
  useEffect(() => {
    handleSearch();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const inputClass = "bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-300 focus:bg-white focus:shadow-sm transition-all w-full";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-[0.2em]">
          <Users className="w-3.5 h-3.5" /> Radar de Talentos
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Marketplace de <span className="text-slate-400">Influenciadores</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Encontre o talento certo pelo perfil, cidade e nicho. Contrate com segurança via Escrow.
        </p>
      </header>

      {/* Search Bar - Premium White */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-4 md:p-6 shadow-sm hover:shadow-md transition-all space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Handle search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por @handle..."
              className="bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-300 focus:bg-white focus:shadow-sm transition-all w-full"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-3 flex-shrink-0">
            {/* City */}
            <div className="relative md:w-[180px]">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cidade"
                className="bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-300 focus:bg-white focus:shadow-sm transition-all w-full"
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
                className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-300 focus:bg-white focus:shadow-sm transition-all w-full text-center font-black uppercase"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showFilters ? 'border-purple-500 text-purple-600 bg-purple-50 shadow-sm' : 'border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="border-t border-slate-50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nicho de Atuação</label>
              <select
                value={niche}
                onChange={e => setNiche(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-purple-300 transition-all w-full font-bold"
              >
                {NICHES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                InfluScore mínimo: <span className="text-purple-600">{minScore}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1000}
                step={50}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                <span>0</span><span>500</span><span>1000</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Niche Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {NICHES.slice(0, 10).map(n => (
          <button
            key={n}
            onClick={() => { setNiche(n === niche ? 'Todos' : n); }}
            className={`flex-none text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest transition-all whitespace-nowrap border
              ${niche === n
                ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/10'
                : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200 shadow-sm'}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Analisando o mercado...</p>
        </div>
      ) : hasSearched && influencers.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
             <Search size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-900 font-black uppercase tracking-widest text-sm">Nenhum talento encontrado.</p>
          <p className="text-slate-400 text-xs font-bold">Tente ampliar a busca — remova o filtro de cidade ou nicho.</p>
        </div>
      ) : (
        <>
          {hasSearched && (
            <div className="flex items-center gap-4">
               <div className="h-px bg-slate-100 flex-1" />
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                 {influencers.length} talento{influencers.length !== 1 ? 's' : ''} disponível{influencers.length !== 1 ? 'is' : ''}
               </p>
               <div className="h-px bg-slate-100 flex-1" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {influencers.map(inf => (
              <div
                key={inf.id}
                className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-500 space-y-6"
              >
                {/* Avatar & Shield */}
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-500">
                    {inf.handle.charAt(0).toUpperCase()}
                  </div>
                  {inf.verifiedMetrics && (
                    <div className="p-2 bg-emerald-50 rounded-xl" title="Métricas verificadas">
                      <Shield className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2">
                  <p className="font-black text-slate-900 text-xl tracking-tighter group-hover:text-purple-600 transition-colors">@{inf.handle}</p>
                  <div className="flex items-center flex-wrap gap-2">
                    {inf.niche && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                        {inf.niche}
                      </span>
                    )}
                    {(inf.city || inf.state) && (
                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {[inf.city, inf.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">InfluScore</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">{inf.influScore}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${SCORE_CLASSES[inf.scoreClass] || SCORE_CLASSES.BRONZE}`}>
                    {inf.scoreClass}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={`/dashboard/company/new-contract?influencerId=${inf.id}&handle=${inf.handle}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm group-hover:border-purple-100"
                >
                  Propor Contrato <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
