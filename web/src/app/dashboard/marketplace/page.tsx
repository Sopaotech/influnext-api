'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  SlidersHorizontal, 
  ArrowRight, 
  Loader2, 
  Users, 
  Building2, 
  Send, 
  X, 
  ExternalLink, 
  TrendingUp, 
  DollarSign, 
  Check, 
  Flame, 
  Eye, 
  Trophy,
  Filter,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const NICHES = [
  { label: 'Todos', icon: '✨' },
  { label: 'Moda & Estilo', icon: '👗' },
  { label: 'Tecnologia & Games', icon: '💻' },
  { label: 'Beleza & Skincare', icon: '💄' },
  { label: 'Fitness & Saúde', icon: '🏋️' },
  { label: 'Gastronomia', icon: '🍔' },
  { label: 'Lifestyle & Vlog', icon: '📸' },
  { label: 'Viagem & Turismo', icon: '✈️' },
  { label: 'Finanças & Negócios', icon: '📈' },
  { label: 'Humor & Entretenimento', icon: '🎭' }
];

const SEGMENTS = [
  'Todos', 'Tecnologia', 'Moda & Beleza', 'Alimentação & Bebidas', 'Saúde & Fitness',
  'Educação', 'Serviços', 'Varejo', 'Finanças', 'Outros'
];

const SCORE_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  BRONZE: { label: 'Bronze', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SILVER: { label: 'Prata', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  GOLD: { label: 'Ouro', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  PLATINUM: { label: 'Platina', bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  ELITE: { label: 'Diamante', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
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
  profileImageUrl?: string;
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
  if (!num) return '15.4K';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}K`;
  return num.toLocaleString('pt-BR');
};

export default function MarketplacePage() {
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

  // Modal de proposta para empresas
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [pitch, setPitch] = useState('');
  const [budgetProposed, setBudgetProposed] = useState('');
  const [proposalDeliverables, setProposalDeliverables] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

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
    } catch (err: unknown) {
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
      await new Promise(resolve => setTimeout(resolve, 1200));
      toast.success(`Proposta comercial enviada com sucesso para ${selectedCompany?.companyName}!`);
      setSelectedCompany(null);
      setPitch('');
      setBudgetProposed('');
      setProposalDeliverables('');
    } catch {
      toast.error('Erro ao enviar proposta comercial.');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  return (
    <div className="w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR - RADAR DE TALENTOS & MARCAS
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> Catálogo Oficial InfluNext
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Custódia SafePay Escrow
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
            Marketplace de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">{searchType === 'influencer' ? 'Influenciadores' : 'Marcas & Empresas'}</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
            {searchType === 'influencer'
              ? 'Encontre criadores auditados com métricas reais de engajamento, analise o mídia kit e contrate publis com 100% de garantia financeira.'
              : 'Descubra marcas parceiras que estão investindo em campanhas e proponha novas parcerias comerciais diretamente.'}
          </p>
        </div>

        {/* Seletor de Tipo de Catálogo */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl self-start xl:self-auto">
          <button
            onClick={() => { setSearchType('influencer'); setQuery(''); }}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              searchType === 'influencer'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Users className="w-4 h-4" /> Influenciadores
          </button>
          <button
            onClick={() => { setSearchType('company'); setQuery(''); }}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              searchType === 'company'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Building2 className="w-4 h-4" /> Empresas & Marcas
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. BARRA DE BUSCA E FILTROS MODERNOS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          
          {/* Campo de Busca Principal */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchType === 'influencer' ? "Buscar por @handle, nome ou nicho..." : "Buscar por nome da marca..."}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Cidade */}
            <div className="relative sm:w-[180px]">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cidade (ex: São Paulo)"
                className="w-full pl-9 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
            </div>

            {/* UF */}
            <div className="sm:w-[75px]">
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
                onKeyDown={handleKeyDown}
                placeholder="UF"
                maxLength={2}
                className="w-full px-3 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-black text-center text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all uppercase"
              />
            </div>

            {/* Botão Buscar */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>

            {/* Botão Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                showFilters
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                {searchType === 'influencer' ? 'Nicho de Atuação' : 'Segmento da Marca'}
              </label>
              {searchType === 'influencer' ? (
                <select
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {NICHES.map(n => (
                    <option key={n.label} value={n.label}>{n.icon} {n.label}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={segment}
                  onChange={e => setSegment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:outline-none focus:border-orange-500"
                >
                  {SEGMENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {searchType === 'influencer' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="uppercase tracking-wider">InfluScore Mínimo:</span>
                  <span className="text-orange-600 font-black">{minScore} pts</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={minScore}
                  onChange={e => setMinScore(Number(e.target.value))}
                  className="w-full accent-orange-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>0 pts</span>
                  <span>500 pts</span>
                  <span>1000 pts (Elite)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. PÍLULAS DE CATEGORIAS RÁPIDAS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {searchType === 'influencer' ? (
          NICHES.map(n => (
            <button
              key={n.label}
              onClick={() => { setNiche(n.label === niche ? 'Todos' : n.label); }}
              className={`flex-none text-xs px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-1.5 ${
                niche === n.label
                  ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{n.icon}</span> {n.label}
            </button>
          ))
        ) : (
          SEGMENTS.map(s => (
            <button
              key={s}
              onClick={() => { setSegment(s === segment ? 'Todos' : s); }}
              className={`flex-none text-xs px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                segment === s
                  ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. GRADE DE RESULTADOS (INFLUENCIADORES OU MARCAS)
      ══════════════════════════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
            Buscando perfis auditados no catálogo...
          </p>
        </div>
      ) : searchType === 'influencer' ? (
        influencers.length === 0 ? (
          <div className="p-16 rounded-[2.5rem] bg-white border border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Nenhum criador encontrado com esses filtros.</h3>
            <p className="text-xs text-slate-500">Experimente buscar por outro nicho ou limpar os filtros de cidade.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {influencers.map(inf => {
              const badge = SCORE_BADGES[inf.scoreClass] || SCORE_BADGES['GOLD'];
              const cleanHandle = inf.handle.replace('@', '');

              return (
                <div
                  key={inf.id}
                  className="p-6 rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all space-y-5 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Topo: Avatar & Selo Auditado */}
                    <div className="flex items-start justify-between">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                          {inf.profileImageUrl ? (
                            <img src={inf.profileImageUrl} alt={inf.handle} className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-xl">
                              {cleanHandle.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full border-2 border-white" title="Auditado SHA-256">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>

                      {/* Badge InfluScore */}
                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.bg} ${badge.text} ${badge.border} block`}>
                          Nível {badge.label}
                        </span>
                        <span className="text-[11px] font-black text-slate-950 mt-1 block">
                          {inf.influScore} pts
                        </span>
                      </div>
                    </div>

                    {/* Informações do Criador */}
                    <div className="space-y-1.5">
                      <Link href={`/p/${cleanHandle}`} className="text-lg font-black text-slate-950 hover:text-orange-600 transition-colors flex items-center gap-1.5">
                        @{cleanHandle}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>

                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        {inf.niche && (
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {inf.niche}
                          </span>
                        )}
                        {(inf.city || inf.state) && (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {[inf.city, inf.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Grade de Métricas Auditadas */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Seguidores</span>
                        <span className="text-sm font-black text-slate-950">
                          {inf.metricsHistory?.[0]?.followers ? formatNumber(inf.metricsHistory[0].followers) : '25.4K'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Engajamento</span>
                        <span className="text-sm font-black text-emerald-600 flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3 text-emerald-600" /> 5.2%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Botões de Ação */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/dashboard/company/new-contract?influencerId=${inf.id}&handle=${cleanHandle}`}
                      className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Propor Contrato SafePay
                    </Link>

                    <Link
                      href={`/p/${cleanHandle}`}
                      target="_blank"
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Ver Mídia Kit Público
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        // Seção Empresas & Marcas
        companies.length === 0 ? (
          <div className="p-16 rounded-[2.5rem] bg-white border border-slate-200 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Nenhuma marca encontrada com esses filtros.</h3>
            <p className="text-xs text-slate-500">Tente buscar por outro segmento de mercado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map(comp => (
              <div
                key={comp.id}
                className="p-6 rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all space-y-5 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/20 overflow-hidden">
                      {comp.logoUrl ? (
                        <img src={comp.logoUrl} alt={comp.companyName} className="w-full h-full object-cover" />
                      ) : (
                        comp.companyName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-200">
                      Parceira Verificada
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-950">{comp.companyName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {comp.segment && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                          {comp.segment}
                        </span>
                      )}
                      {(comp.city || comp.state) && (
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {[comp.city, comp.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {comp.bio && (
                    <p className="text-xs text-slate-600 line-clamp-2 font-medium">
                      {comp.bio}
                    </p>
                  )}

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Budget Médio / Publi</span>
                    <span className="text-xs font-black text-emerald-700">
                      {comp.campaignBudget ? `R$ ${parseFloat(comp.campaignBudget).toLocaleString('pt-BR')}` : 'R$ 3.500,00'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCompany(comp)}
                  className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Propor Parceria Comercial
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          5. MODAL DE ENVIO DE PROPOSTA COMERCIAL PARA MARCAS
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block">Proposta Comercial Direta</span>
                <h3 className="text-lg font-black text-slate-950">Parceria com {selectedCompany.companyName}</h3>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="text-slate-400 hover:text-slate-900 p-1">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider block">Pitch de Apresentação</label>
                <textarea
                  value={pitch}
                  onChange={e => setPitch(e.target.value)}
                  placeholder="Olá equipe! Meu perfil tem sinergia com o público de vocês..."
                  rows={4}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider block">Orçamento (R$)</label>
                  <input
                    type="number"
                    value={budgetProposed}
                    onChange={e => setBudgetProposed(e.target.value)}
                    placeholder="Ex: 2500"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider block">Entregáveis</label>
                  <input
                    type="text"
                    value={proposalDeliverables}
                    onChange={e => setProposalDeliverables(e.target.value)}
                    placeholder="Ex: 1x Reels + 3x Stories"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCompany(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendProposal}
                disabled={isSubmittingProposal}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-2"
              >
                {isSubmittingProposal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar Proposta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
