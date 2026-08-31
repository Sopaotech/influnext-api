'use client';

import React, { useEffect, useState } from 'react';
import { 
  Radio, 
  TrendingUp, 
  ShoppingBag, 
  Link as LinkIcon, 
  CheckCircle2, 
  ExternalLink,
  Building2,
  Sparkles,
  ShieldCheck,
  Flame,
  DollarSign,
  Copy,
  Check,
  Eye,
  Clock,
  ArrowRight,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export default function CampaignsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const userRole = Cookies.get('influnext_role');
  const isCompany = userRole === 'COMPANY';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyCoupon = (coupon: string) => {
    navigator.clipboard.writeText(coupon);
    setCopiedCoupon(coupon);
    toast.success(`✓ Cupom "${coupon}" copiado!`);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleCopyTrackLink = (campaignTitle: string) => {
    const link = `https://influnext.com.br/l/summer2026`;
    navigator.clipboard.writeText(link);
    toast.success('🔗 Link rastreável de Stories copiado!', {
      description: 'Cole na figurinha de link do Instagram para rastrear cliques e vendas.'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-[#FAFAFA] min-h-screen animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  // Dados de campanhas de influenciador
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
      brandName: 'Samsung Brasil',
      segment: 'Tecnologia & Inovação',
      campaignTitle: 'Lançamento Fone Galaxy Buds Pro',
      status: 'IN_PRODUCTION',
      escrowStatus: 'IN_PROGRESS',
      deliverableType: '1x Reels Demonstrativo (60s)',
      instagramLink: '',
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        engagementRate: '0.0%',
        linkClicks: 142,
        salesCount: 0,
        revenue: 0.00,
        myEarnings: 2975.00
      },
      couponCode: 'GALAXY15',
      commissionRate: '15%'
    }
  ];

  // Dados de campanhas corporativas (Empresas)
  const companyCampaigns = [
    {
      id: 'c1',
      influencer: 'demo.influencer',
      influencerName: 'Alice Souza',
      niche: 'Fashion & Lifestyle',
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
        revenue: 12450.00
      },
      couponCode: 'SUMMER10',
      commissionRate: '10%',
      payoutStatus: 'Liberado na Carteira'
    }
  ];

  return (
    <div className="w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR - CAMPANHAS & CONVERSÃO EM TEMPO REAL
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Live Campaign Auditor
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SafePay Escrow Protegido
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
            Campanhas <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">Ativas & Conversão</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
            {isCompany 
              ? 'Rastreamento em tempo real de cliques, conversões de vendas por cupom, ROI e esteira de entregáveis dos influenciadores.'
              : 'Acompanhe suas parcerias ativas, cliques em links de stories, vendas com seu cupom exclusivo e comissões liberadas no SafePay.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start xl:self-auto flex-wrap">
          {isCompany ? (
            <Link 
              href="/dashboard/company/new-contract" 
              className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" /> Lançar Nova Campanha
            </Link>
          ) : (
            <button
              onClick={() => handleCopyTrackLink('Campanha')}
              className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
            >
              <LinkIcon className="w-4 h-4 text-orange-600" />
              Copiar Link Rastreável
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. FEED DE CAMPANHAS ATIVAS (CARDS RICOS EM DADOS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">
        {(isCompany ? companyCampaigns : influencerCampaigns).map((campaign) => {
          const isPosted = campaign.status === 'POSTED';

          return (
            <div 
              key={campaign.id}
              className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all space-y-6"
            >
              {/* Topo do Card: Informações da Campanha e Status */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600">
                    <Radio className="w-4 h-4 animate-pulse" /> Campanha Ativa
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                    {campaign.campaignTitle}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {isCompany ? (
                      <>Criador: <strong className="text-slate-900">@{(campaign as any).influencer}</strong> ({(campaign as any).influencerName})</>
                    ) : (
                      <>Marca parceira: <strong className="text-slate-900">{(campaign as any).brandName}</strong> ({(campaign as any).segment})</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                    isPosted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  }`}>
                    {isPosted ? '✓ Publicado & Auditado' : '⚡ Roteiro em Produção'}
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {campaign.deliverableType}
                  </span>
                </div>
              </div>

              {/* Grade de 4 Métricas de Conversão em Tempo Real */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                
                {/* 1. Cliques no Link */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cliques no seu Link</span>
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-950">
                    {campaign.metrics.linkClicks.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">Rastreado de Stories e Bio</span>
                </div>

                {/* 2. Vendas com Cupom */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vendas com seu Cupom</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {campaign.metrics.salesCount} <span className="text-xs font-bold text-slate-400">pedidos</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Cupom: <strong className="text-orange-600 font-mono">{campaign.couponCode}</strong></span>
                    <button 
                      onClick={() => handleCopyCoupon(campaign.couponCode)}
                      className="text-[10px] font-black text-orange-600 hover:underline flex items-center gap-0.5"
                    >
                      {copiedCoupon === campaign.couponCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* 3. Sua Comissão Ganha (SafePay) */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Sua Remuneração SafePay</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((campaign.metrics as any).myEarnings || campaign.metrics.revenue)}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    {isPosted ? '✓ Saldo Liberado na Carteira' : '🔒 Retido em Garantia Escrow'}
                  </span>
                </div>

                {/* 4. Visualizações Estimadas */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visualizações & Engajamento</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-950">
                    {campaign.metrics.views > 0 ? `${(campaign.metrics.views / 1000).toFixed(1)}k views` : 'Em processamento'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    Taxa de Engajamento: <strong className="text-slate-800">{campaign.metrics.engagementRate}</strong>
                  </span>
                </div>

              </div>

              {/* Esteira do Escrow (Stepper Visual de Alta Performance) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Esteira do Escrow:</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Proposta Aceita
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saldo Bloqueado
                  </span>
                  <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded border ${
                    isPosted ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reels/Stories Postados
                  </span>
                  <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded border ${
                    isPosted ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-400 bg-slate-100 border-slate-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saldo Liberado
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  {isPosted && campaign.instagramLink && (
                    <a 
                      href={campaign.instagramLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-orange-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      Ver Post <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {!isPosted && (
                    <button 
                      onClick={() => handleCopyTrackLink(campaign.campaignTitle)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      Obter Link de Stories
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. SEÇÃO DE AGÊNCIAS & REPRESENTAÇÃO COMERCIAL
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-950">
                {isCompany ? 'Agenciamento & Representação Corporativa' : 'Minha Agência de Representação'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Gestão de contratos, repasse de faturamento e mediação de marcas.
            </p>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vínculo Ativo & Regularizado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-orange-500/20">
                NA
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">NextAgency Talentos Ltda</h4>
                <p className="text-xs text-slate-400 font-medium">Agente Comercial: Marcus Silva</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Sua agência gerencia negociações de cachet, aprovações de briefing e cobrança automática das marcas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Taxa de Agenciamento:</span>
              <span className="font-black text-slate-900">20% sobre o líquido</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Repasses Recebidos Este Ano:</span>
              <span className="font-black text-emerald-600">R$ 15.420,00</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Status de Pagamento:</span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                100% em dia
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
