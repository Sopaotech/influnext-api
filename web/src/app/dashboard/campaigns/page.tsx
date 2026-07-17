'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Radio, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Link as LinkIcon, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Building,
  Activity,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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
    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
        <p className="text-zinc-550 text-[10px] uppercase font-black tracking-widest">Carregando Esteira de Campanhas...</p>
      </div>
    );
  }

  // MOCK CORPORATE CAMPAIGN DATA
  const companyCampaigns = [
    {
      id: 'c1',
      influencer: 'demo.influencer',
      influencerName: 'Alice Souza',
      niche: 'Fashion & Lifestyle',
      campaignTitle: 'Campanha Summer Collection 2026',
      status: 'POSTED', // POSTED, SCHEDULED
      escrowStatus: 'COMPLETED',
      deliverableType: '1x Reels + 3x Stories',
      instagramLink: 'https://instagram.com',
      metrics: {
        views: 18500,
        likes: 1240,
        comments: 85,
        engagementRate: '4.8%',
        linkClicks: 8540,
        salesCount: 124,
        revenue: 12450.00
      },
      couponCode: 'SUMMER10',
      commissionRate: '10%',
      payoutStatus: 'Pago (Escrow Liberado)'
    },
    {
      id: 'c2',
      influencer: 'pedro_ph',
      influencerName: 'Pedro Santos',
      niche: 'Fotografia & Estética',
      campaignTitle: 'Branding Audiovisual outono 2026',
      status: 'SCHEDULED',
      escrowStatus: 'IN_PROGRESS',
      deliverableType: '1x Reels Conceitual',
      instagramLink: '',
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        engagementRate: '0.0%',
        linkClicks: 142,
        salesCount: 0,
        revenue: 0.00
      },
      couponCode: 'PEDRO15',
      commissionRate: '12%',
      payoutStatus: 'Em Garantia (Escrow Retido)'
    }
  ];

  // MOCK CREATOR CAMPAIGN DATA
  const influencerCampaigns = [
    {
      id: 'c1',
      brandName: 'Marca Premium Ltda',
      segment: 'Moda & E-commerce',
      campaignTitle: 'Campanha Summer Collection 2026',
      status: 'POSTED',
      escrowStatus: 'COMPLETED',
      deliverableType: '1x Reels + 3x Stories',
      instagramLink: 'https://instagram.com',
      metrics: {
        views: 18500,
        likes: 1240,
        comments: 85,
        engagementRate: '4.8%',
        linkClicks: 8540,
        salesCount: 124,
        revenue: 12450.00,
        myEarnings: 1245.00
      },
      couponCode: 'SUMMER10',
      commissionRate: '10%'
    },
    {
      id: 'c2',
      brandName: 'Marca Premium Ltda',
      segment: 'Moda & E-commerce',
      campaignTitle: 'Branding Audiovisual outono 2026',
      status: 'APPROVED', // APPROVED AND WAITING POST
      escrowStatus: 'IN_PROGRESS',
      deliverableType: '1x Reels Conceitual',
      instagramLink: '',
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        engagementRate: '0.0%',
        linkClicks: 142,
        salesCount: 0,
        revenue: 0.00,
        myEarnings: 0.00
      },
      couponCode: 'PEDRO15',
      commissionRate: '12%'
    }
  ];

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32">
      
      {/* Header */}
      <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b ${
        isDark ? 'border-zinc-800/50' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_2px_rgba(217,107,39,0.5)]" />
             <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Live_Campaign_Auditor</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-current tracking-tight">
            Campanhas <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Ativas</span>
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 font-medium text-sm mt-2">
            {isCompany 
              ? 'Rastreamento em tempo real de cliques, conversões de vendas, cupons ativos e engajamento orgânico de criadores.'
              : 'Acompanhe suas parcerias ativas, cliques no seu link personalizado, vendas com seu cupom e comissões ganhas.'}
          </p>
        </div>
        
        {isCompany && (
          <Link 
            href="/dashboard/company/new-contract" 
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
          >
            Lançar Nova Campanha
          </Link>
        )}
      </header>

      {isCompany ? (
        // COMPANY CAMPAIGNS VIEW
        <div className="space-y-10">
          {companyCampaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className={`p-6 md:p-8 rounded-[2.5rem] border shadow-lg space-y-8 ${
                isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-zinc-100/50'
              }`}
            >
              {/* Campaign Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1">
                    <Radio className="w-4 h-4 animate-pulse" /> Campanha em Andamento
                  </div>
                  <h3 className="text-2xl font-black text-current">{campaign.campaignTitle}</h3>
                  <p className="text-xs text-zinc-455 dark:text-zinc-400 font-semibold mt-1">
                    Influenciador contratado: <span className="text-current">@{campaign.influencer}</span> ({campaign.influencerName} • {campaign.niche})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    campaign.status === 'POSTED'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                  }`}>
                    {campaign.status === 'POSTED' ? 'CONTEÚDO PUBLICADO' : 'AGUARDANDO POSTAGEM'}
                  </span>
                  <span className="text-[10px] font-black text-zinc-550 dark:text-zinc-550 uppercase tracking-widest">
                    {campaign.payoutStatus}
                  </span>
                </div>
              </div>

              {/* Live Tracking Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block mb-1">Cliques no Link</span>
                  <div className="text-3xl font-black text-current tracking-tighter flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-orange-500" /> {campaign.metrics.linkClicks.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">Cliques orgânicos rastreados</span>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-555 dark:text-zinc-500 uppercase tracking-wider block mb-1">Vendas pelo Cupom</span>
                  <div className="text-3xl font-black text-emerald-500 tracking-tighter flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> {campaign.metrics.salesCount}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">Código cupom: <strong className="text-orange-500">{campaign.couponCode}</strong></span>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-555 dark:text-zinc-500 uppercase tracking-wider block mb-1">Faturamento Gerado</span>
                  <div className="text-3xl font-black text-emerald-500 tracking-tighter flex items-center gap-1">
                    R$ {campaign.metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">Comissão influencer: {campaign.commissionRate}</span>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-555 dark:text-zinc-500 uppercase tracking-wider block mb-1">Engajamento Social</span>
                  <div className="text-3xl font-black text-current tracking-tighter flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" /> {campaign.metrics.engagementRate}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">{campaign.metrics.likes} likes • {campaign.metrics.comments} coms</span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className={`p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-semibold ${
                isDark ? 'bg-zinc-950/40 border border-zinc-900' : 'bg-zinc-50/50 border border-zinc-200'
              }`}>
                <div className="flex items-center gap-6 flex-wrap">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Esteira do Escrow:</span>
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Contrato Assinado</span>
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Saldo em Garantia</span>
                  <span className={`flex items-center gap-1 ${campaign.status === 'POSTED' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Conteúdo Validado
                  </span>
                  <span className={`flex items-center gap-1 ${campaign.status === 'POSTED' && campaign.escrowStatus === 'COMPLETED' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Pagamento Pago
                  </span>
                </div>

                {campaign.status === 'POSTED' && (
                  <a 
                    href={campaign.instagramLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] font-black uppercase tracking-wider text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    Ver Postagem no Instagram <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // INFLUENCER CAMPAIGNS VIEW
        <div className="space-y-10">
          {influencerCampaigns.map((campaign) => (
            <div 
              key={campaign.id}
              className={`p-6 md:p-8 rounded-[2.5rem] border shadow-lg space-y-8 ${
                isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-zinc-100/50'
              }`}
            >
              {/* Campaign Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1">
                    <Radio className="w-4 h-4 animate-pulse" /> Campanha Ativa
                  </div>
                  <h3 className="text-2xl font-black text-current">{campaign.campaignTitle}</h3>
                  <p className="text-xs text-zinc-455 dark:text-zinc-400 font-semibold mt-1">
                    Marca parceira: <span className="text-current">{campaign.brandName}</span> ({campaign.segment})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    campaign.status === 'POSTED'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                  }`}>
                    {campaign.status === 'POSTED' ? 'PUBLICADO' : 'ROTEIRO APROVADO • WAITING POST'}
                  </span>
                  <span className="text-[10px] font-black text-zinc-550 dark:text-zinc-400 uppercase tracking-widest">
                    {campaign.deliverableType}
                  </span>
                </div>
              </div>

              {/* Performance / Commission Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-wider block mb-1">Cliques no seu Link</span>
                  <div className="text-3xl font-black text-current tracking-tighter flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-orange-500" /> {campaign.metrics.linkClicks.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">Rastreado de sua bio/stories</span>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-555 dark:text-zinc-500 uppercase tracking-wider block mb-1">Vendas com seu Cupom</span>
                  <div className="text-3xl font-black text-emerald-500 tracking-tighter flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> {campaign.metrics.salesCount}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">Cupom ativo: <strong className="text-orange-500">{campaign.couponCode}</strong></span>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-555 dark:text-zinc-500 uppercase tracking-wider block mb-1">Sua Comissão (Ganha)</span>
                  <div className="text-3xl font-black text-emerald-500 tracking-tighter flex items-center gap-1">
                    R$ {campaign.metrics.myEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">Alíquota de Comissão: {campaign.commissionRate}</span>
                </div>

                <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[9px] font-black text-zinc-555 dark:text-zinc-500 uppercase tracking-wider block mb-1">Visualizações Estimadas</span>
                  <div className="text-3xl font-black text-current tracking-tighter flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" /> {campaign.metrics.views >= 1000 ? `${(campaign.metrics.views / 1000).toFixed(1)}k` : campaign.metrics.views}
                  </div>
                  <span className="text-[8px] text-zinc-400 mt-1 block">Engajamento: {campaign.metrics.engagementRate}</span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className={`p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs font-semibold ${
                isDark ? 'bg-zinc-950/40 border border-zinc-900' : 'bg-zinc-50/50 border border-zinc-200'
              }`}>
                <div className="flex items-center gap-6 flex-wrap">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Esteira do Escrow:</span>
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Proposta Aceita</span>
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-4 h-4" /> Saldo Bloqueado em Escrow</span>
                  <span className={`flex items-center gap-1 ${campaign.status === 'POSTED' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Reels/Stories Postados
                  </span>
                  <span className={`flex items-center gap-1 ${campaign.status === 'POSTED' && campaign.escrowStatus === 'COMPLETED' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    <CheckCircle2 className="w-4 h-4" /> Saldo Liberado na Carteira
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {campaign.status === 'POSTED' && (
                    <a 
                      href={campaign.instagramLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-[10px] font-black uppercase tracking-wider text-orange-500 hover:text-orange-600 flex items-center gap-1"
                    >
                      Ver Post <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {campaign.status === 'APPROVED' && (
                    <button 
                      onClick={() => toast.info('Link do seu cupom de vendas e tracking copiados para Stories!')}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider"
                    >
                      Obter Link de Stories
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agency Management Section */}
      <section className={`border rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm relative overflow-hidden ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-zinc-100/50'
      }`}>
         <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
            <Building className="w-64 h-64 text-zinc-700" />
         </div>
         
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4">
            <div className="space-y-1">
               <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] md:text-[11px] tracking-[0.4em] uppercase">
                 <Building className="w-4 h-4" /> Agency_Group_2026
               </div>
               <h2 className="text-2xl md:text-3xl font-black text-current tracking-tighter">
                 {isCompany ? 'Agenciamento & Representação' : 'Minhas Agências Vinculadas'}
               </h2>
            </div>
            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border ${
              isDark ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-250 text-zinc-550'
            }`}>
               Mapeado via Contrato
            </span>
         </div>

         {isCompany ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-zinc-50 border-zinc-250 shadow-sm'}`}>
               <h4 className="text-base font-black text-current mb-4 uppercase">Agência Representante</h4>
               <div className="space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black text-sm">
                     NA
                   </div>
                   <div>
                     <p className="text-xs font-black text-current">NextAgency Talentos Ltda</p>
                     <p className="text-[9px] text-zinc-500 font-bold uppercase">5 influenciadores vinculados à sua marca</p>
                   </div>
                 </div>
                 <p className="text-xs text-zinc-555 dark:text-zinc-400 font-medium leading-relaxed">
                   A agência gerencia o roteiro, entregáveis e faturamento consolidado das criadoras vinculadas sob sua esteira.
                 </p>
               </div>
             </div>

             <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-zinc-50 border-zinc-250 shadow-sm'}`}>
               <h4 className="text-base font-black text-current mb-4 uppercase">Visão Consolidada de Agência</h4>
               <div className="space-y-2 text-xs text-zinc-555 dark:text-zinc-400 font-medium">
                 <div className="flex justify-between items-center pb-2 border-b border-white/5">
                   <span>Influenciadores Ativos</span>
                   <span className="font-black text-current">5 Criadores</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/5">
                   <span>Faturamento Total Gerado</span>
                   <span className="font-black text-emerald-500">R$ 45.240,00</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span>Taxa Média de Engajamento</span>
                   <span className="font-black text-orange-500">5.2%</span>
                 </div>
               </div>
             </div>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-zinc-50 border-zinc-250 shadow-sm'}`}>
               <h4 className="text-base font-black text-current mb-4 uppercase">Minha Agência Representante</h4>
               <div className="space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black text-sm">
                     NA
                   </div>
                   <div>
                     <p className="text-xs font-black text-current">NextAgency Talentos Ltda</p>
                     <p className="text-[9px] text-zinc-500 font-bold uppercase">Agente Principal: Marcus Silva</p>
                   </div>
                 </div>
                 <p className="text-xs text-zinc-555 dark:text-zinc-400 font-medium leading-relaxed">
                   Sua agência cuida do recebimento de faturamento, negociações com marcas e mediação de disputas para que você foque apenas na criação de conteúdo.
                 </p>
               </div>
             </div>

             <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-zinc-950/40 border-zinc-900' : 'bg-zinc-50 border-zinc-250 shadow-sm'}`}>
               <h4 className="text-base font-black text-current mb-4 uppercase">Repasse de Comissões (Agência)</h4>
               <div className="space-y-2 text-xs text-zinc-555 dark:text-zinc-400 font-medium">
                 <div className="flex justify-between items-center pb-2 border-b border-white/5">
                   <span>Taxa de Agenciamento</span>
                   <span className="font-black text-current">20% sobre faturamento líquido</span>
                 </div>
                 <div className="flex justify-between items-center pb-2 border-b border-white/5">
                   <span>Repasses Recebidos</span>
                   <span className="font-black text-emerald-500">R$ 15.420,00</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span>Status de Repasse</span>
                   <span className="font-black text-emerald-500">Regularizado</span>
                 </div>
               </div>
             </div>
           </div>
         )}
      </section>

    </div>
  );
}
