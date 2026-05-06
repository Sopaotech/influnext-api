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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
             <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Corporate_Intelligence_2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Gestão de <span className="text-slate-400">Investimentos</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">Monitore suas campanhas de influência e libere pagamentos em Escrow com segurança.</p>
        </div>
        <div className="flex">
          <Link 
            href="/dashboard/company/new-contract" 
            className="flex items-center gap-2 bg-slate-900 hover:bg-purple-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 transition-all"
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
             <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
               Ação Necessária 
             </h2>
             <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md shadow-red-500/20">
               {pendingReviews.length}
             </span>
          </div>
          
          {pendingReviews.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center text-xs font-bold text-slate-400 shadow-sm">
              <div className="flex justify-center mb-4"><CheckCircle className="w-10 h-10 text-emerald-500" /></div>
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
        <div className="col-span-1 lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
          <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-tighter">
            <FileText className="w-5 h-5 text-purple-600" /> Histórico de Contratos
          </h2>
          
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
              <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-slate-900 text-lg font-black uppercase tracking-tight mb-2">Sua esteira está vazia</h3>
              <p className="text-slate-500 text-sm font-medium max-w-md mb-8">
                Descubra influenciadores de alta conversão validados por dados reais. Negocie e escale os seus resultados.
              </p>
              <Link 
                href="/dashboard/marketplace"
                className="px-8 py-4 bg-slate-900 hover:bg-purple-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all"
              >
                Procurar Influenciadores Agora
              </Link>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-100 overflow-hidden bg-white flex-1">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b-slate-100 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest h-14 pl-6">Influenciador</TableHead>
                    <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest h-14">Campanha</TableHead>
                    <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest h-14">Orçamento</TableHead>
                    <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest h-14">Escrow</TableHead>
                    <TableHead className="text-right text-slate-400 font-black uppercase text-[10px] tracking-widest h-14 pr-6">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract: any) => {
                    const lastCapture = contract.influencer.metricsHistory?.[0]?.capturedAt;
                    const isOutdated = lastCapture ? (new Date().getTime() - new Date(lastCapture).getTime() > 24 * 60 * 60 * 1000) : true;
                    return (
                      <TableRow key={contract.id} className="border-b-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="font-black text-slate-900 py-6 pl-6">
                          <div className="flex flex-col gap-1">
                            <span className="group-hover:text-purple-600 transition-colors">@{contract.influencer.handle}</span>
                            {isOutdated && (
                              <span className="inline-flex w-max items-center gap-1 text-[8px] font-black uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                                <AlertCircle className="w-2.5 h-2.5" /> Desatualizado
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 py-6 font-bold text-sm">{contract.title}</TableCell>
                      <TableCell className="text-emerald-600 font-black py-6 tracking-tighter text-lg">${Number(contract.budget).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <EscrowTimeline status={contract.escrowStatus} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            {statusMap[contract.escrowStatus] || contract.escrowStatus}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-6 pr-6">
                        {contract.escrowStatus === 'DRAFT' && (
                          <button 
                            onClick={async () => {
                              if (confirm('Confirmar recebimento manual deste pagamento?')) {
                                try {
                                  await api.post(`/contracts/${contract.id}/pay`);
                                  fetchDashboard();
                                } catch (err) {
                                  alert('Erro ao confirmar pagamento.');
                                }
                              }
                            }}
                            className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-100 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Pagar
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
