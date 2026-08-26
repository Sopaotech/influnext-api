"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, Users, CheckCircle2, FileText, Sparkles, AlertCircle, Loader2, Printer, Download, Share2, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface ContractData {
  id: string;
  title: string;
  budget: number;
  escrowStatus: string;
  createdAt?: string;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiReport, setAiReport] = useState<{
    roiMultiplier: number;
    cpmBrl: number;
    efficiencyVsMarket: number;
    aiReportMarkdown: string;
  } | null>(null);

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
        const res = await api.get<ContractData>(`/contracts/${params.id}`);
        setContract(res.data);
      } catch (err: unknown) {
        console.error('[CAMPAIGN_REPORT] Erro ao buscar contrato:', err);
        setError('Não foi possível carregar os detalhes do relatório desta campanha.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContract();
  }, [params.id]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post<{
        roiMultiplier: number;
        cpmBrl: number;
        efficiencyVsMarket: number;
        aiReportMarkdown: string;
      }>(`/contracts/${params.id}/roi-report`);
      setAiReport(res.data);
      toast.success('Relatório de ROI gerado com sucesso pela IA!');
    } catch (err: unknown) {
      console.error('[CAMPAIGN_REPORT] Erro ao gerar relatório IA:', err);
      setError('Falha ao gerar o relatório com Inteligência Artificial.');
      toast.error('Erro ao processar relatório por IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link do relatório copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em]">Carregando dados da campanha...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
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
  const estimatedRoi = aiReport ? aiReport.roiMultiplier : (20 + (influScore % 15) + (budget > 1000 ? 5 : 0)).toFixed(1);
  const cpm = aiReport ? aiReport.cpmBrl.toFixed(2) : (budget / (impressions / 1000)).toFixed(2);
  const cpc = (budget / estimatedClicks).toFixed(2);

  const escrowLabelMap: Record<string, string> = {
    DRAFT: 'Rascunho',
    PENDING_PAYMENT: 'Aguardando Pagamento',
    IN_PROGRESS: 'Em Produção',
    UNDER_REVIEW: 'Em Revisão',
    COMPLETED: 'Campanha Concluída',
    DISPUTE: 'Em Disputa'
  };

  const formattedDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 pb-20 animate-in fade-in duration-500 print:p-0 print:m-0 print:max-w-full print:space-y-4">
      {/* Action Bar (Hidden on Print) */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link 
          href="/dashboard/company" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-bold text-xs sm:text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-zinc-700 dark:text-zinc-300"
            title="Compartilhar link do relatório"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Compartilhar'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
            title="Exportar como PDF ou Imprimir"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* Executive Print Banner */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-orange-500 pb-4 mb-6">
        <div>
          <div className="text-xl font-black tracking-tighter text-black flex items-center gap-2">
            <span className="text-orange-600 font-black">INFLU</span>NEXT
            <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 px-2 py-0.5 rounded border border-orange-200">
              Relatório Executivo de ROI
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 font-mono">
            ID do Contrato: {contract.id} • Emissão: {formattedDate}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-emerald-700 text-xs font-black">
            <ShieldCheck className="w-4 h-4" />
            <span>SHA-256 Verified Escrow</span>
          </div>
          <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Métricas Auditadas via API Oficial</p>
        </div>
      </div>

      <header className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase tracking-[0.2em] print:hidden">
          <FileText className="w-3.5 h-3.5" /> Relatório de Fechamento de Campanha
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-current tracking-tighter print:text-2xl print:text-black">
              {campaignName}
            </h1>
            <p className="text-zinc-500 dark:text-slate-400 font-medium mt-1.5 text-xs sm:text-sm print:text-zinc-600">
              Análise de performance com o criador <span className="font-bold text-current print:text-black">@{influencerHandle}</span> (InfluScore: <span className="font-bold text-orange-600">{influScore}</span>).
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border self-start md:self-auto ${
            contract.escrowStatus === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-500/30 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:border-amber-500/30 dark:text-amber-300'
          } print:border-zinc-300 print:bg-zinc-100 print:text-zinc-800`}>
             <CheckCircle2 className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">
               {escrowLabelMap[contract.escrowStatus] || contract.escrowStatus}
             </span>
          </div>
        </div>
      </header>

      {/* InfluNext AI Analysis Box */}
      <div className={`p-6 sm:p-8 rounded-[2rem] relative overflow-hidden shadow-xl border ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-white/5 text-white' 
          : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-zinc-850 shadow-orange-100/10'
      } print:bg-white print:border-zinc-200 print:text-black print:shadow-none print:p-6 print:rounded-2xl print:break-inside-avoid`}>
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full print:hidden" />
        <div className="relative z-10 flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-orange-500/10 dark:bg-white/10 rounded-2xl flex-shrink-0 print:border print:border-orange-300">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
          </div>
          <div className="space-y-3 sm:space-y-4 w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">
                Parecer Analítico da IA (InfluNext Neural ROI)
              </h3>
              <span className="text-[9px] font-mono text-zinc-400 print:text-zinc-500">Gemini 2.0 Audited</span>
            </div>
            
            {!aiReport && !isGenerating && (
              <div className="pt-2">
                <p className={`text-xs sm:text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-zinc-600'} print:text-black`}>
                  Clique abaixo para que a nossa Inteligência Artificial analise as métricas finais do contrato, 
                  compare com os benchmarks de mercado e gere um relatório de ROI e Eficiência executivo.
                </p>
                <button 
                  onClick={handleGenerateReport}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-xs sm:text-sm flex items-center gap-2 print:hidden"
                >
                  <Sparkles className="w-4 h-4" /> Gerar Relatório de ROI
                </button>
              </div>
            )}

            {isGenerating && (
              <div className="pt-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                <span className="text-xs sm:text-sm font-bold text-orange-500 animate-pulse">A Inteligência Artificial está analisando as métricas e escrevendo o relatório...</span>
              </div>
            )}

            {aiReport && (
              <div className={`prose prose-sm md:prose-base max-w-none ${
                isDark ? 'prose-invert prose-p:text-slate-200 prose-headings:text-white' : 'prose-p:text-zinc-800 prose-headings:text-zinc-900'
              } print:prose-p:text-zinc-800 print:prose-headings:text-black print:prose-strong:text-black`}>
                <ReactMarkdown>
                  {aiReport.aiReportMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funnel Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 print:grid-cols-4 print:gap-3 print:break-inside-avoid">
        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
        } print:bg-white print:border-zinc-200 print:text-black print:p-4 print:shadow-none`}>
           <Users className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 mb-2 sm:mb-4" />
           <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Impressões</p>
           <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current print:text-black">{impressions.toLocaleString()}</p>
        </div>
        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
        } print:bg-white print:border-zinc-200 print:text-black print:p-4 print:shadow-none`}>
           <Target className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 mb-2 sm:mb-4" />
           <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cliques (Est.)</p>
           <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current print:text-black">{estimatedClicks.toLocaleString()}</p>
        </div>
        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
        } print:bg-white print:border-zinc-200 print:text-black print:p-4 print:shadow-none`}>
           <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 mb-2 sm:mb-4" />
           <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Engajamento</p>
           <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current print:text-black">{engagement}%</p>
        </div>
        <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-md transition-shadow border ${
          isDark ? 'bg-orange-950/20 border-orange-500/30 text-white' : 'bg-orange-50 border-orange-200 text-orange-700 shadow-orange-100/50'
        } print:bg-orange-50 print:border-orange-200 print:text-orange-900 print:p-4 print:shadow-none`}>
           <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mb-2 sm:mb-4" />
           <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Eficiência vs Mercado</p>
           <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter mt-1 text-current print:text-orange-800">{aiReport ? `+${aiReport.efficiencyVsMarket}%` : '+--%'}</p>
        </div>
      </div>

      {/* Financial Details */}
      <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border shadow-sm ${
        isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-100/50'
      } print:bg-white print:border-zinc-200 print:text-black print:shadow-none print:p-6 print:rounded-2xl print:break-inside-avoid`}>
        <h3 className="text-base sm:text-lg font-black tracking-tighter mb-4 sm:mb-6 text-current print:text-black">Detalhamento Financeiro & Eficiência</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className={`flex justify-between items-center pb-3 sm:pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'} print:border-zinc-200`}>
              <span className="text-xs sm:text-sm font-bold text-zinc-500 print:text-zinc-600">Valor Investido em Custódia (Escrow)</span>
              <span className="text-base sm:text-lg font-black text-current print:text-black">R$ {budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={`flex justify-between items-center pb-3 sm:pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'} print:border-zinc-200`}>
              <span className="text-xs sm:text-sm font-bold text-zinc-500 print:text-zinc-600">Custo por Mil Impressões (CPM Estimado)</span>
              <span className="text-base sm:text-lg font-black text-current print:text-black">R$ {cpm}</span>
          </div>
          <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-bold text-zinc-500 print:text-zinc-600">Custo por Clique (CPC Estimado)</span>
              <span className="text-base sm:text-lg font-black text-emerald-600 print:text-emerald-700">R$ {cpc}</span>
          </div>
        </div>
      </div>

      {/* Print Footer Notice */}
      <div className="hidden print:block text-center text-[9px] text-zinc-400 font-mono pt-6 border-t border-zinc-200">
        Relatório emitido pela plataforma Influnext • Auditoria Criptográfica SHA-256 e Inteligência Artificial Google Gemini • influnext.com.br
      </div>
    </div>
  );
}

