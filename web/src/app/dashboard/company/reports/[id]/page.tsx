"use client";
import React from 'react';
import { ArrowLeft, Target, TrendingUp, Users, CheckCircle2, FileText, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CampaignReportPage({ params }: { params: { id: string } }) {
  // Dados Mockados de um Relatório "Perfeito"
  const report = {
    campaignName: "Lançamento Inverno 26",
    influencerHandle: "influ_teste",
    investment: 1500.00,
    metrics: {
      impressions: 42500,
      engagement: 14.2,
      estimatedClicks: 3200,
      estimatedRoi: 28.5
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <Link href="/dashboard/company" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-[0.2em]">
          <FileText className="w-3.5 h-3.5" /> Relatório de Fechamento
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
              {report.campaignName}
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Análise de performance da campanha com <span className="font-bold text-slate-900">@{report.influencerHandle}</span>.
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100">
             <CheckCircle2 className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Campanha Concluída</span>
          </div>
        </div>
      </header>

      {/* Viak AI Analysis Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/20 blur-[60px] rounded-full" />
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl flex-shrink-0">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest">Inteligência Viak Analisa:</h3>
            <p className="text-lg md:text-xl font-medium text-slate-200 leading-relaxed">
              "Excelente escolha! Esta campanha superou a média de engajamento do segmento de Tecnologia em <span className="text-white font-black">15%</span>. O custo por clique estimado ficou em R$ 0,46, gerando um alto potencial de conversão para a sua loja."
            </p>
          </div>
        </div>
      </div>

      {/* Funnel Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
           <Users className="w-6 h-6 text-slate-400 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Impressões</p>
           <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mt-1">{report.metrics.impressions.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
           <Target className="w-6 h-6 text-slate-400 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cliques (Est.)</p>
           <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mt-1">{report.metrics.estimatedClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
           <AlertCircle className="w-6 h-6 text-slate-400 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Engajamento</p>
           <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mt-1">{report.metrics.engagement}%</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
           <TrendingUp className="w-6 h-6 text-purple-600 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600/70">ROI Estimado</p>
           <p className="text-2xl md:text-3xl font-black text-purple-700 tracking-tighter mt-1">+{report.metrics.estimatedRoi}%</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
        <h3 className="text-lg font-black text-slate-900 tracking-tighter mb-6">Detalhamento Financeiro</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
             <span className="text-sm font-bold text-slate-500">Valor Investido (Escrow)</span>
             <span className="text-lg font-black text-slate-900">R$ {report.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
             <span className="text-sm font-bold text-slate-500">Custo por Impressão (CPM Estimado)</span>
             <span className="text-lg font-black text-slate-900">R$ {(report.investment / (report.metrics.impressions / 1000)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-sm font-bold text-slate-500">Custo por Clique (CPC Estimado)</span>
             <span className="text-lg font-black text-emerald-600">R$ {(report.investment / report.metrics.estimatedClicks).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
