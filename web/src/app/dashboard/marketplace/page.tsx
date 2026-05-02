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
  BRONZE: 'text-amber-600 border-amber-600/30 bg-amber-600/8',
  SILVER: 'text-zinc-300 border-zinc-400/30 bg-zinc-400/8',
  GOLD: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/8',
  PLATINUM: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/8',
  ELITE: 'text-purple-400 border-purple-400/30 bg-purple-400/8',
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

  const inputClass = "bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/40 transition-all w-full";

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">
          <Users className="w-3.5 h-3.5" /> Radar de Talentos
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Marketplace de <span style={{ color: '#c084fc' }}>Influenciadores</span>
        </h1>
        <p className="text-zinc-500 text-sm">
          Encontre o talento certo pelo perfil, cidade e nicho. Contrate com segurança via Escrow.
        </p>
      </header>

      {/* Search Bar */}
      <div className="bg-[#0d0b18] border border-white/[0.06] rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Handle search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar por @handle..."
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/40 transition-all w-full"
            />
          </div>

          {/* City */}
          <div className="relative md:w-[180px]">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cidade"
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/40 transition-all w-full"
            />
          </div>

          {/* State */}
          <div className="md:w-[100px]">
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
              onKeyDown={handleKeyDown}
              placeholder="UF"
              maxLength={2}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/40 transition-all w-full text-center font-bold"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(192,132,252,0.2)] flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${showFilters ? 'border-purple-500/40 text-purple-400 bg-purple-500/8' : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.15]'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="border-t border-white/[0.05] pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Nicho</label>
              <select
                value={niche}
                onChange={e => setNiche(e.target.value)}
                className="bg-[#080810] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/40 transition-all w-full"
              >
                {NICHES.map(n => (
                  <option key={n} value={n} className="bg-zinc-900">{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
                InfluScore mínimo: <span className="text-purple-400">{minScore}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1000}
                step={50}
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-700 mt-1">
                <span>0</span><span>500</span><span>1000</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Niche Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {NICHES.slice(0, 8).map(n => (
          <button
            key={n}
            onClick={() => { setNiche(n === niche ? 'Todos' : n); }}
            className={`flex-none text-[11px] px-4 py-1.5 rounded-full font-bold transition-all whitespace-nowrap
              ${niche === n
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(192,132,252,0.3)]'
                : 'bg-white/[0.04] border border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.15]'}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Varrendo o mercado...</p>
        </div>
      ) : hasSearched && influencers.length === 0 ? (
        <div className="border border-dashed border-white/[0.06] rounded-2xl p-16 text-center space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-zinc-500 font-bold">Nenhum talento encontrado com esses filtros.</p>
          <p className="text-zinc-700 text-sm">Tente ampliar a busca — remova o filtro de cidade ou nicho.</p>
        </div>
      ) : (
        <>
          {hasSearched && (
            <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest">
              {influencers.length} talento{influencers.length !== 1 ? 's' : ''} encontrado{influencers.length !== 1 ? 's' : ''}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {influencers.map(inf => (
              <div
                key={inf.id}
                className="group bg-[#0d0b18] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/[0.25] hover:bg-[#110e1f] transition-all duration-300 space-y-4"
              >
                {/* Avatar */}
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(192,132,252,0.2)]">
                    {inf.handle.charAt(0).toUpperCase()}
                  </div>
                  {inf.verifiedMetrics && (
                    <Shield className="w-4 h-4 text-emerald-400" title="Métricas verificadas" />
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <p className="font-black text-white text-lg tracking-tight">@{inf.handle}</p>
                  <div className="flex items-center flex-wrap gap-2">
                    {inf.niche && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/[0.08] border border-purple-500/[0.15] text-purple-400">
                        {inf.niche}
                      </span>
                    )}
                    {(inf.city || inf.state) && (
                      <span className="text-[10px] text-zinc-600 font-bold flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {[inf.city, inf.state].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">InfluScore</p>
                    <p className="text-2xl font-black text-white">{inf.influScore}</p>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${SCORE_CLASSES[inf.scoreClass] || SCORE_CLASSES.BRONZE}`}>
                    {inf.scoreClass}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={`/dashboard/company/new-contract?influencerId=${inf.id}&handle=${inf.handle}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 text-xs font-bold hover:bg-purple-500/[0.08] hover:border-purple-500/[0.25] hover:text-purple-300 transition-all group-hover:border-purple-500/[0.15]"
                >
                  Propor Contrato <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
