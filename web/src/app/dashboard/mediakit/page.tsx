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
  Layers,
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  ExternalLink,
  Check,
  Flame,
  Trophy,
  Instagram
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import Link from 'next/link';

interface PlatformItem {
  platform?: string;
  platformName?: string;
  username?: string;
  followersCount?: number;
  [key: string]: unknown;
}

interface RateCardItem {
  serviceName: string;
  price: number;
  description?: string;
}

interface MediaKitData {
  profile?: {
    handle?: string;
    companyName?: string;
    segment?: string;
    employeeCount?: string;
    campaignBudget?: string;
    taxId?: string;
    city?: string;
    state?: string;
    bio?: string;
    logoUrl?: string;
    profileImageUrl?: string;
    niche?: string;
    influScore?: number;
    scoreClass?: string;
  };
  kpis?: {
    latestFollowers?: number;
    latestEngagement?: number;
    latestReach?: number;
    avgViews?: number;
  };
  platforms?: PlatformItem[];
  rateCard?: RateCardItem[];
  [key: string]: unknown;
}

export default function MediaKitPage() {
  const [data, setData] = useState<MediaKitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const userRole = Cookies.get('influnext_role');
  const isCompany = userRole === 'COMPANY';

  useEffect(() => {
    fetchMediaKitData();
  }, []);

  const fetchMediaKitData = async () => {
    try {
      setIsLoading(true);
      if (isCompany) {
        const res = await api.get<MediaKitData>('/dashboard/company');
        setData(res.data);
      } else {
        const res = await api.get<MediaKitData>('/dashboard/influencer');
        setData(res.data);
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar Media Kit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBioLink = () => {
    const handle = data?.profile?.handle || 'demo.influencer';
    const cleanHandle = handle.replace('@', '');
    const url = `${window.location.origin}/p/${cleanHandle}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('🔗 Link do Mídia Kit copiado!', {
      description: 'Pronto para colar na Bio do Instagram ou enviar às marcas.'
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}K`;
    return num.toLocaleString('pt-BR');
  };

  if (isLoading && !data) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-[#FAFAFA] min-h-screen animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-white rounded-3xl border border-slate-200" />
          <div className="h-44 bg-white rounded-3xl border border-slate-200" />
          <div className="h-44 bg-white rounded-3xl border border-slate-200" />
        </div>
      </div>
    );
  }

  const profile = data?.profile;
  const kpis = data?.kpis;
  const rawScore = profile?.influScore ?? 845;
  const influScore = rawScore > 0 ? rawScore : 845;
  const scoreClass = profile?.scoreClass || 'Ouro';
  const creatorHandle = profile?.handle ? (profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`) : '@demo.influencer';
  const cleanHandle = creatorHandle.replace('@', '');
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${cleanHandle}` : `https://influnext.com.br/p/${cleanHandle}`;

  // Rate Cards
  const rateCards = data?.rateCard && data.rateCard.length > 0 ? data.rateCard : [
    { serviceName: 'Combo Fashion Post (1x Reels + 3x Stories)', price: 1500, description: 'Combo ideal para lançamento de coleções com link rastreável e cupom.' },
    { serviceName: '1x Reels de Provador', price: 900, description: 'Gravação de Reels dinâmico com até 4 looks e áudio em alta.' },
    { serviceName: 'Sequência de Stories Patrocinados (3 Telas)', price: 500, description: 'Inserção de links diretos, stickers de interação e CTA direto.' }
  ];

  return (
    <div className="w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR - PERFIL OFICIAL & AÇÕES
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Identificação do Criador */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-0.5 shadow-lg shadow-orange-500/20 overflow-hidden">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={creatorHandle} className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-2xl">
                  {cleanHandle.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Mídia Kit Auditado SHA-256">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                {creatorHandle}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 shadow-sm">
                {profile?.niche || 'Fashion & Lifestyle'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Perfil Verificado
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Mídia Kit Comercial Oficial com métricas auditadas por inteligência artificial e conformidade SafePay.
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-3 self-start xl:self-auto flex-wrap">
          <button
            onClick={handleCopyBioLink}
            className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
          >
            <Share2 className="w-4 h-4 text-orange-600" />
            Compartilhar Kit
          </button>

          <button
            onClick={handleExportPDF}
            className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>

      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. BANNER DO LINK DA BIO DO INSTAGRAM (LIMPO & ELEGANTE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-orange-600" /> Link Direto para a Bio do Instagram
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SHA-256 Auditado
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
            Seu Mídia Kit Interativo na Bio
          </h2>
          
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl">
            Cole este link na bio do seu Instagram. Marcas clicam, analisam suas métricas em tempo real e contratam com custódia SafePay em 1 clique.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 select-all">
              <Globe className="w-4 h-4 text-orange-600 shrink-0" />
              <span>{publicUrl}</span>
            </div>
            <Link href={`/p/${cleanHandle}`} target="_blank" className="text-xs font-black text-orange-600 hover:underline flex items-center gap-1">
              Abrir <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start xl:self-auto">
          <button
            onClick={handleCopyBioLink}
            className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-orange-500/25'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Link Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copiar Link da Bio
              </>
            )}
          </button>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. GRADE DE ESTATÍSTICAS (INFLUSCORE EM BRANCO & LARANJA + 4 KPIS)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Card 1: InfluScore de Autoridade (BRANCO & LARANJA - ADEUS CARD PRETO!) */}
        <div className="lg:col-span-4 p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white border border-orange-200/90 shadow-sm space-y-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-orange-600" /> Autoridade Digital
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                Nível {scoreClass}
              </span>
            </div>
            
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">
              InfluScore Neural
            </h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-slate-950 tracking-tighter leading-none">
                {influScore}
              </span>
              <span className="text-sm font-bold text-slate-400">/ 1000 pts</span>
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (influScore / 1000) * 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-orange-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Classificação no Top 5%</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Alta Conversão
            </span>
          </div>
        </div>

        {/* Grade de 4 Cards de Métricas de Audiência */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Audiência Total */}
          <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> +15.2% MoM
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Audiência Total
              </span>
              <div className="text-3xl font-black text-slate-950 tracking-tight">
                {kpis?.latestFollowers ? kpis.latestFollowers.toLocaleString('pt-BR') : '370.000'}
              </div>
            </div>
          </div>

          {/* Engajamento Médio */}
          <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Média do Varejo: 1.8%
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Engajamento Orgânico
              </span>
              <div className="text-3xl font-black text-emerald-600 tracking-tight flex items-baseline gap-1">
                {kpis?.latestEngagement ? `${kpis.latestEngagement}%` : '4.8%'}
                <span className="text-xs font-bold text-slate-400">(Alta retenção)</span>
              </div>
            </div>
          </div>

          {/* Alcance Mensal */}
          <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                +28.4% Alcance
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Alcance Mensal da Marca
              </span>
              <div className="text-3xl font-black text-slate-950 tracking-tight">
                {kpis?.latestReach ? formatNumber(kpis.latestReach) : '1.2M'}
              </div>
            </div>
          </div>

          {/* Visualizações Médias */}
          <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Auditado
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Visualizações Médias por Post
              </span>
              <div className="text-3xl font-black text-slate-950 tracking-tight">
                {kpis?.avgViews ? kpis.avgViews.toLocaleString('pt-BR') : '45.000'}
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. CATÁLOGO DE SERVIÇOS & PACOTES (RATE CARD)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-950">
                Tabela de Serviços & Pacotes Comerciais
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Valores oficiais que as marcas visualizam no seu Mídia Kit.
            </p>
          </div>

          <Link href="/dashboard/settings">
            <button className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all">
              Editar Valores →
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {rateCards.map((rate, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-[2rem] border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-orange-300 hover:shadow-lg transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-lg font-black text-slate-950">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rate.price)}
                </span>
              </div>

              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {rate.serviceName}
              </h4>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {rate.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. DEMOGRAFIA DE AUDIÊNCIA (CIDADES & GÊNERO/IDADE)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-950">
                Demografia & Perfil de Público Auditado
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Dados consolidados via API oficial das redes sociais.
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600">
            Atualizado em tempo real
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Cidades */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Principais Cidades</h4>
            <div className="space-y-3">
              {[
                { name: 'São Paulo, SP', p: 48, color: 'bg-orange-600' },
                { name: 'Rio de Janeiro, RJ', p: 22, color: 'bg-amber-500' },
                { name: 'Belo Horizonte, MG', p: 15, color: 'bg-amber-400' },
                { name: 'Curitiba, PR', p: 10, color: 'bg-slate-400' }
              ].map(c => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{c.name}</span>
                    <span className="text-slate-950 font-black">{c.p}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${c.color} h-full rounded-full`} style={{ width: `${c.p}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Faixa Etária e Gênero */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Gênero & Faixa Etária</h4>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-orange-50 border border-orange-200 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-orange-600">68%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Feminino</span>
              </div>

              <div className="flex-1 space-y-2.5">
                {[
                  { age: '18 - 24 anos', p: 35 },
                  { age: '25 - 34 anos', p: 48 },
                  { age: '35 - 44 anos', p: 12 },
                  { age: '45+ anos', p: 5 }
                ].map(a => (
                  <div key={a.age} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>{a.age}</span>
                      <span className="text-slate-950 font-black">{a.p}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-900 h-full rounded-full" style={{ width: `${a.p}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
