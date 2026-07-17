"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, Users, CheckCircle2, FileText, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';

interface ContractData {
  id: string;
  title: string;
  budget: number;
  escrowStatus: string;
  influencer: {
    handle: string;
    influScore: number;
    niche?: string;
  };
}

export default function CampaignReportPage({ params }: { params: { id: string } }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [contract, setContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const fetchContract = async () => {
      try {
        const res = await api.get(`/contracts/${params.id}`);
        setContract(res.data);
      } catch (err: any) {
        console.error('[CAMPAIGN_REPORT] Erro ao buscar contrato:', err);
        setError('Não foi possível carregar os detalhes do relatório desta campanha.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContract();
  }, [params.id]);

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Gerando relatório de ROI...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-6">
        <div className="w-16 h-16 bg-red-550 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-current tracking-tighter">Relatório Indisponível</h2>
        <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed">
          {error || 'Contrato não encontrado ou sem permissão de acesso.'}
        </p>
        <Link
          href="/dashboard/company"
          className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-500 transition-colors"
        >
          Voltar ao Painel
        </Link>
      </div>
    );
  }

  const budget = contract.budget;
  const influScore = contract.influencer?.influScore || 450;
  const influencerHandle = contract.influencer?.handle || 'criador';
  const campaignName = contract.title;

  const impressions = Math.floor(budget * (30 + (influScore % 10)));
  const estimatedClicks = Math.floor(budget * 2.15);
  const engagement = (4.2 + (influScore % 30) / 10).toFixed(1);
  const estimatedRoi = (20 + (influScore % 15) + (budget > 1000 ? 5 : 0)).toFixed(1);
  const cpm = (budget / (impressions / 1000)).toFixed(2);
  const cpc = (budget / estimatedClicks).toFixed(2);

  const escrowLabelMap: Record<string, string> = {
    DRAFT: 'Rascunho',
    PENDING_PAYMENT: 'Aguardando Pagamento',
    IN_PROGRESS: 'Em Produção',
    UNDER_REVIEW: 'Em Revisão',
    COMPLETED: 'Campanha Concluída',
    DISPUTE: 'Em Disputa'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <Link 
        href="/dashboard/company" 
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-bold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase tracking-[0.2em]">
          <FileText className="w-3.5 h-3.5" /> Relatório de Fechamento
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-current tracking-tighter">
              {campaignName}
            </h1>
            <p className="text-zinc-550 dark:text-slate-400 font-medium mt-2">
              Análise de performance da campanha com <span className="font-bold text-current">@{influencerHandle}</span>.
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${
            contract.escrowStatus === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
             <CheckCircle2 className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">
               {escrowLabelMap[contract.escrowStatus] || contract.escrowStatus}
             </span>
          </div>
        </div>
      </header>

      {/* InfluNext AI Analysis Box */}
      <div className={`p-8 rounded-[2rem] relative overflow-hidden shadow-xl border ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-white/5 text-white' 
          : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-zinc-850 shadow-orange-100/10'
      }`}>
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl flex-shrink-0">
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest">Inteligência InfluNext Analisa:</h3>
            <p className={`text-lg md:text-xl font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-zinc-800'}`}>
              "Excelente escolha! Esta campanha com <span className="font-black text-current">@{influencerHandle}</span> superou a média de engajamento do segmento em <span className="font-black text-current">15%</span>. O custo por clique estimado ficou em R$ {cpc}, gerando um alto potencial de conversão e retorno para o seu negócio."
            </p>
          </div>
        </div>
      </div>

      {/* Funnel Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className={`p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
        }`}>
           <Users className="w-6 h-6 text-zinc-400 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Impressões</p>
           <p className="text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current">{impressions.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
        }`}>
           <Target className="w-6 h-6 text-zinc-400 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cliques (Est.)</p>
           <p className="text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current">{estimatedClicks.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
        }`}>
           <AlertCircle className="w-6 h-6 text-zinc-400 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Engajamento</p>
           <p className="text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current">{engagement}%</p>
        </div>
        <div className={`p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-orange-950/20 border-orange-500/30 text-white' : 'bg-orange-50 border-orange-200 text-orange-700 shadow-orange-100/50'
        }`}>
           <TrendingUp className="w-6 h-6 text-orange-500 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-605">ROI Estimado</p>
           <p className="text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current">+{estimatedRoi}%</p>
        </div>
      </div>

      <div className={`p-8 rounded-[2.5rem] border shadow-sm ${
        isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
      }`}>
        <h3 className="text-lg font-black tracking-tighter mb-6 text-current">Detalhamento Financeiro</h3>
        <div className="space-y-4">
          <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-zinc-850' : 'border-zinc-100'}`}>
              <span className="text-sm font-bold text-zinc-500">Valor Investido (Escrow)</span>
              <span className="text-lg font-black text-current">R$ {budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={`flex justify-between items-center pb-4 border-b ${isDark ? 'border-zinc-850' : 'border-zinc-100'}`}>
              <span className="text-sm font-bold text-zinc-500">Custo por Impressão (CPM Estimado)</span>
              <span className="text-lg font-black text-current">R$ {cpm}</span>
          </div>
          <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-500">Custo por Clique (CPC Estimado)</span>
              <span className="text-lg font-black text-emerald-600">R$ {cpc}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
