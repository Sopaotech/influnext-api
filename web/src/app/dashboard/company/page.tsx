'use client';

import React, { useEffect, useState } from 'react';
import { api, CompanyDashboardResponse } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { DollarSign, FileText, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeliverableReviewCard } from '@/components/deliverable-review-card';
import { EscrowTimeline } from '@/components/EscrowTimeline';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function CompanyDashboard() {
  const [data, setData] = useState<CompanyDashboardResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const statusMap: Record<string, string> = {
    IN_PROGRESS: 'Em Andamento',
    PENDING_PAYMENT: 'Aguardando Pagamento',
    UNDER_REVIEW: 'Em Análise',
    COMPLETED: 'Concluído',
    DISPUTE: 'Em Disputa',
    DRAFT: 'Rascunho'
  };

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<CompanyDashboardResponse>('/dashboard/company');
      setData(res.data);

      const userState = (res.data as any).userState;
      if (userState) {
        if (!userState.onboardingCompleted) {
          window.location.href = '/auth/login';
          return;
        }
        if (userState.subscriptionStatus === 'INACTIVE' || 
           (userState.subscriptionStatus === 'TRIAL' && new Date() > new Date(userState.trialEndsAt))) {
          // window.location.href = '/dashboard/billing/locked';
          console.warn('TRIAL EXPIRED');
        }
      }
    } catch (err: any) {
      setError('Falha ao carregar os dados do painel da empresa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Preparando seu painel corporativo...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl flex flex-col items-center text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-lg font-bold text-red-400 mb-2">Erro de Acesso</h2>
          <p className="text-red-400/80">{error}</p>
        </div>
      </div>
    );
  }

  const { stats, contracts } = data;
  
  // Extrair todos os deliverables em UNDER_REVIEW de todos os contratos para priorização na interface
  const pendingReviews = contracts.flatMap((c: any) => 
    c.deliverables
      .filter((d: any) => d.status === 'UNDER_REVIEW')
      .map((d: any) => ({ ...d, contractTitle: c.title, influencerHandle: c.influencer.handle }))
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 min-h-screen">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-800/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_2px_rgba(168,85,247,0.5)]" />
             <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Corporate_Intelligence_2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Gestão de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Investimentos</span>
          </h1>
          <p className="text-zinc-400 font-medium text-sm mt-2">Monitore suas campanhas de influência e libere pagamentos em Escrow com segurança militar.</p>
        </div>
        <div className="flex">
          <Link 
            href="/dashboard/company/new-contract" 
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.7)] transition-all"
          >
            Propor Novo Contrato
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <MetricCard title="Investimento Escrow" value={`$${stats.totalInvested.toLocaleString('pt-BR')}`} icon={DollarSign} />
        <MetricCard title="Contratos Ativos" value={stats.activeContracts} icon={FileText} />
        <MetricCard title="Entregas na Fila" value={stats.pendingReviews} icon={AlertCircle} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel de Qualidade (Aprovações Prioritárias) */}
        <div className="col-span-1 lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
               Ação Necessária 
             </h2>
             <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-black px-3 py-1 rounded-full shadow-[0_0_10px_-2px_rgba(236,72,153,0.5)]">
               {pendingReviews.length}
             </span>
          </div>
          
          {pendingReviews.length === 0 ? (
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-[2.5rem] p-12 text-center text-xs font-bold text-zinc-500 shadow-xl">
              <div className="flex justify-center mb-4"><CheckCircle className="w-10 h-10 text-emerald-500/70 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /></div>
              Sua fila de revisão está vazia.<br/>Nenhuma pendência no momento.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 pb-4 no-scrollbar">
              {pendingReviews.map(delivery => (
                <DeliverableReviewCard 
                  key={delivery.id}
                  deliverableId={delivery.id}
                  contractTitle={delivery.contractTitle}
                  influencerHandle={delivery.influencerHandle}
                  proofUrl={delivery.proofUrl || ''}
                  onSuccess={() => fetchDashboard()}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lista de Contratos Ativos */}
        <div className="col-span-1 lg:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-2 uppercase tracking-tighter">
            <FileText className="w-5 h-5 text-purple-400" /> Histórico de Contratos
          </h2>
          
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-950/50 rounded-[2rem] border border-zinc-800/50 border-dashed">
              <div className="w-20 h-20 bg-zinc-900 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-zinc-800">
                <FileText className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-white text-lg font-black uppercase tracking-tight mb-2">Sua esteira está vazia</h3>
              <p className="text-zinc-400 text-sm font-medium max-w-md mb-8">
                Descubra influenciadores de alta conversão validados por dados reais. Negocie e escale os seus resultados com proteção total.
              </p>
              <Link 
                href="/dashboard/marketplace"
                className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all border border-zinc-700"
              >
                Procurar Influenciadores Agora
              </Link>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-zinc-800/60 overflow-hidden bg-zinc-950/50 flex-1">
              <Table>
                <TableHeader className="bg-zinc-900">
                  <TableRow className="border-b-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14 pl-6">Influenciador</TableHead>
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14">Campanha</TableHead>
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14">Orçamento</TableHead>
                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14">Escrow</TableHead>
                    <TableHead className="text-right text-zinc-500 font-black uppercase text-[10px] tracking-widest h-14 pr-6">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract: any) => {
                    const lastCapture = contract.influencer.metricsHistory?.[0]?.capturedAt;
                    const isOutdated = lastCapture ? (new Date().getTime() - new Date(lastCapture).getTime() > 24 * 60 * 60 * 1000) : true;
                    return (
                      <TableRow key={contract.id} className="border-b-zinc-800/50 hover:bg-zinc-800/30 transition-colors group">
                        <TableCell className="font-black text-white py-6 pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="group-hover:text-purple-400 transition-colors">@{contract.influencer.handle}</span>
                            {isOutdated && (
                              <span className="inline-flex w-max items-center gap-1 text-[8px] font-black uppercase bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                <AlertCircle className="w-2.5 h-2.5" /> Desatualizado
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300 py-6 font-bold text-sm">{contract.title}</TableCell>
                      <TableCell className="text-emerald-400 font-black py-6 tracking-tighter text-lg drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">${Number(contract.budget).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <EscrowTimeline status={contract.escrowStatus} />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">
                            {statusMap[contract.escrowStatus] || contract.escrowStatus}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-6 pr-6">
                        {contract.escrowStatus === 'DRAFT' && (
                          <button 
                            onClick={async () => {
                              if (confirm('Confirmar depósito Escrow para iniciar a campanha?')) {
                                try {
                                  await api.post(`/contracts/${contract.id}/pay`);
                                  fetchDashboard();
                                } catch (err) {
                                  alert('Erro ao confirmar depósito.');
                                }
                              }
                            }}
                            className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_-2px_rgba(16,185,129,0.3)]"
                          >
                            Depositar
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
