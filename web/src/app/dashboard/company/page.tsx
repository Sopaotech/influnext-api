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
        <p className="text-zinc-500 font-medium animate-pulse">Sincronizando painel corporativo...</p>
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
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-800/50">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2 tracking-tight">
            Painel de Quality Assurance
          </h1>
          <p className="text-zinc-400 font-medium">Bem-vindo. Monitore seus investimentos em influência e libere pagamentos em Escrow.</p>
        </div>
        <div className="flex">
          <Link 
            href="/dashboard/company/new-contract" 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] transition-all"
          >
            Propor Novo Contrato
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard title="Investimento Escrow" value={`$${stats.totalInvested.toLocaleString('pt-BR')}`} icon={DollarSign} />
        <MetricCard title="Contratos Ativos" value={stats.activeContracts} icon={FileText} />
        <MetricCard title="Entregas na Fila" value={stats.pendingReviews} icon={AlertCircle} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Painel de Qualidade (Aprovações Prioritárias) */}
        <div className="col-span-1 lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            Ação Necessária 
            <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {pendingReviews.length}
            </span>
          </h2>
          
          {pendingReviews.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-8 text-center text-sm text-zinc-500 backdrop-blur-sm">
              <div className="flex justify-center mb-3 opacity-50"><CheckCircle className="w-8 h-8 text-emerald-500" /></div>
              Sua fila de revisão está vazia.<br/>Nenhuma pendência no momento.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
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
        <div className="col-span-1 lg:col-span-2 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col">
          <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Histórico de Contratos
          </h2>
          
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-950/50 rounded-xl border border-zinc-800/50">
              <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 border border-purple-500/20">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-zinc-200 text-lg font-bold mb-2">Sua esteira está vazia</h3>
              <p className="text-zinc-500 text-sm max-w-md mb-6">
                Descubra influenciadores de alta conversão validados por dados reais. Negocie e escale os seus resultados.
              </p>
              <Link 
                href="/dashboard/marketplace"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)]"
              >
                Procurar Influenciadores Agora
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/50 overflow-hidden bg-zinc-950/50 flex-1">
              <Table>
                <TableHeader className="bg-zinc-900/80">
                  <TableRow className="border-b-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-semibold h-12">Influenciador</TableHead>
                    <TableHead className="text-zinc-400 font-semibold h-12">Título da Campanha</TableHead>
                    <TableHead className="text-zinc-400 font-semibold h-12">Orçamento</TableHead>
                    <TableHead className="text-zinc-400 font-semibold h-12">Status</TableHead>
                    <TableHead className="text-right text-zinc-400 font-semibold h-12">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract: any) => {
                    const lastCapture = contract.influencer.metricsHistory?.[0]?.capturedAt;
                    const isOutdated = lastCapture ? (new Date().getTime() - new Date(lastCapture).getTime() > 24 * 60 * 60 * 1000) : true;
                    return (
                      <TableRow key={contract.id} className="border-b-zinc-800/30 hover:bg-zinc-800/40 transition-colors">
                        <TableCell className="font-bold text-purple-400 py-4">
                          <div className="flex flex-col gap-1">
                            <span>@{contract.influencer.handle}</span>
                            {isOutdated && (
                              <span className="inline-flex w-max items-center gap-1 text-[9px] font-black uppercase bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                                <AlertCircle className="w-2.5 h-2.5" /> Métricas desatualizadas
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-200 py-4 font-medium">{contract.title}</TableCell>
                      <TableCell className="text-emerald-400 font-bold py-4">${Number(contract.budget).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <EscrowTimeline status={contract.escrowStatus} />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                            {statusMap[contract.escrowStatus] || contract.escrowStatus}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
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
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
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
