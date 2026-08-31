'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Users, 
  DollarSign, 
  FileText, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Brain, 
  ShieldCheck, 
  Eye, 
  LifeBuoy, 
  Crown, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Check, 
  RefreshCw,
  CreditCard,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  metrics: {
    totalUsers: Array<{ role: string; _count: { _all: number } }>;
    influencersCount: number;
    companiesCount: number;
    gmv: number;
    revenue: number;
    safePayRevenue?: number;
    subscriptionRevenue?: number;
    totalProfit?: number;
    totalContracts: number;
    completedContractsCount?: number;
    marketplaceHealth: Array<{ escrowStatus: string; _count: { _all: number } }>;
    pageViews: number;
    churnRate?: number;
    defaultRate?: number;
    activeSubs?: number;
    canceledSubs?: number;
    pastDueSubs?: number;
    activeInfluencerSubs?: number;
    activeCompanySubs?: number;
    supportTickets?: Array<{
      id: string;
      subject: string;
      message: string;
      category: string;
      status: string;
      createdAt: string;
      user: { email: string; role: string };
    }>;
  };
  status: string;
  serverTime: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<{ content?: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [grantIdentifier, setGrantIdentifier] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED'>('ALL');
  const [isUpdatingTicket, setIsUpdatingTicket] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<AdminStats>('/admin/stats');
      setData(res.data);
    } catch (err) {
      console.error('Erro ao buscar stats de admin:', err);
      toast.error('Erro ao carregar métricas administrativas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    try {
      setIsUpdatingTicket(ticketId);
      await api.patch(`/support/admin/${ticketId}/status`, { status: newStatus });
      toast.success(`✓ Chamado atualizado para ${newStatus === 'CLOSED' ? 'RESOLVIDO' : newStatus === 'IN_PROGRESS' ? 'EM ANDAMENTO' : 'EM ABERTO'}!`);
      fetchStats();
    } catch {
      toast.error('Erro ao atualizar status do chamado.');
    } finally {
      setIsUpdatingTicket(null);
    }
  };

  const handleGenerateStrategy = async () => {
    try {
      setIsGenerating(true);
      const res = await api.get<{ content?: string }>('/admin/growth-strategy');
      setStrategy(res.data);
      toast.success('✦ Plano de Guerra e Estratégia de Escala gerados pela IA!');
    } catch (err) {
      console.error('Erro ao gerar estratégia:', err);
      toast.error('Erro ao gerar estratégia de crescimento.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGrantPro = async () => {
    if (!grantIdentifier) {
      toast.error('Insira o e-mail ou ID do usuário.');
      return;
    }
    try {
      setIsGranting(true);
      const res = await api.post<{ message: string }>('/admin/grant-pro', { identifier: grantIdentifier });
      toast.success(res.data.message);
      setGrantIdentifier('');
      fetchStats();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao liberar acesso');
    } finally {
      setIsGranting(false);
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(num);
  };

  const filteredTickets = (data?.metrics?.supportTickets || []).filter(t => {
    if (ticketFilter === 'ALL') return true;
    return t.status === ticketFilter;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Activity className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Carregando painel de governança e métricas de lucro...</p>
      </div>
    );
  }

  const influencersCount = data?.metrics?.influencersCount || 0;
  const companiesCount = data?.metrics?.companiesCount || 0;
  const totalGmv = data?.metrics?.gmv || 0;
  const totalContracts = data?.metrics?.totalContracts || 0;
  const completedContractsCount = data?.metrics?.completedContractsCount || 0;
  
  // Lucro detalhado
  const safePayRevenue = data?.metrics?.safePayRevenue || 0;
  const subscriptionRevenue = data?.metrics?.subscriptionRevenue || 0;
  const totalProfit = data?.metrics?.totalProfit || (safePayRevenue + subscriptionRevenue);
  
  const openTicketsCount = (data?.metrics?.supportTickets || []).filter(t => t.status === 'OPEN').length;
  const closedTicketsCount = (data?.metrics?.supportTickets || []).filter(t => t.status === 'CLOSED').length;

  return (
    <div className="relative w-full min-h-screen bg-[#FAFAFA] text-slate-900 pb-32">
      
      {/* ══════════════════════════════════════════════════════════════════════
          SOMBREAMENTO AMBIENTAL LARANJA SUAVE (AMBIENT LIGHT GLOW)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[380px] bg-gradient-to-b from-orange-500/[0.08] via-amber-500/[0.03] to-transparent blur-[100px] rounded-full -z-0" />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">

        {/* ══════════════════════════════════════════════════════════════════════
            1. HEADER EXECUTIVO FOUNDER LEVEL
        ══════════════════════════════════════════════════════════════════════ */}
        <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-orange-600 tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" /> Founder & Governance Control Panel
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
              Painel de Controle & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Lucro da Empresa</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Visão macro de lucros separados (SafePay + Mensalidades), montante transacionado e suporte operacional.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <button
              onClick={fetchStats}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 transition-all shadow-sm active:scale-95"
              title="Atualizar Métricas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleGenerateStrategy}
              disabled={isGenerating}
              className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Gerando Plano de Guerra...' : '✦ Gerar Estratégia de Escala (IA)'}
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════════════
            2. KPIS PRINCIPAIS (LUCRO DA EMPRESA SEPARADO, MONTANTE TOTAL)
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Lucro da Empresa (InfluNext) com Detalhamento Separado */}
          <div className="p-6 rounded-[2.2rem] bg-white border border-slate-200/80 shadow-sm space-y-4 relative overflow-hidden group hover:border-orange-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Lucro Total da Empresa
              </span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div>
              <span className="text-2xl md:text-3xl font-black text-slate-950 block">
                {formatCurrency(totalProfit)}
              </span>
            </div>

            {/* Subdivisão Bonitinha e Separada (Taxas vs Mensalidades) */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="w-3 h-3 text-orange-500" /> Taxas SafePay:
                </span>
                <strong className="text-slate-900 font-bold">{formatCurrency(safePayRevenue)}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1 font-medium">
                  <CreditCard className="w-3 h-3 text-blue-600" /> Mensalidades / MRR:
                </span>
                <strong className="text-slate-900 font-bold">{formatCurrency(subscriptionRevenue)}</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Montante Total Negociado (Volume GMV) & Negociações Geradas */}
          <div className="p-6 rounded-[2.2rem] bg-white border border-slate-200/80 shadow-sm space-y-4 relative overflow-hidden group hover:border-orange-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Montante Total Negociado
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div>
              <span className="text-2xl md:text-3xl font-black text-slate-950 block">
                {formatCurrency(totalGmv)}
              </span>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Negociações Geradas:</span>
                <strong className="text-slate-900 font-bold">{totalContracts} contratos</strong>
              </div>
              <div className="flex justify-between items-center text-emerald-600">
                <span className="font-medium">Concluídas com Sucesso:</span>
                <strong className="font-bold">{completedContractsCount} entregas</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Base de Usuários Cadastrados */}
          <div className="p-6 rounded-[2.2rem] bg-white border border-slate-200/80 shadow-sm space-y-4 relative overflow-hidden group hover:border-orange-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Base de Usuários
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div>
              <span className="text-2xl md:text-3xl font-black text-slate-950 block">
                {influencersCount + companiesCount}
              </span>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-orange-500" /> Criadores Auditados:
                </span>
                <strong className="text-slate-950 font-bold">{influencersCount}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Empresas Parceiras:
                </span>
                <strong className="text-slate-950 font-bold">{companiesCount}</strong>
              </div>
            </div>
          </div>

          {/* Card 4: Fila de Chamados & Suporte */}
          <div className="p-6 rounded-[2.2rem] bg-white border border-slate-200/80 shadow-sm space-y-4 relative overflow-hidden group hover:border-orange-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Central de Chamados
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <LifeBuoy className="w-4 h-4" />
              </div>
            </div>

            <div>
              <span className="text-2xl md:text-3xl font-black text-slate-950 block">
                {(data?.metrics?.supportTickets || []).length}
              </span>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-amber-700">
                <span className="font-medium">Chamados em Aberto:</span>
                <strong className="font-bold">{openTicketsCount} pendentes</strong>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span className="font-medium">Chamados Resolvidos:</span>
                <strong className="font-bold">{closedTicketsCount} atendidos</strong>
              </div>
            </div>
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            3. ESTRATÉGIA GERADA PELA IA (GEMINI 1.5 FLASH)
        ══════════════════════════════════════════════════════════════════════ */}
        {strategy?.content && (
          <section className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 border border-orange-200/80 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-orange-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-950">
                  Plano de Guerra & Consultoria Estratégica Founder AI
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                Gemini Growth Engine
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">
              {strategy.content}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            4. FILA DE CHAMADOS & REPORT DE FALHAS (CENTRAL DE SUPORTE)
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-orange-600" />
                Fila de Chamados, Disputas & Reports de Falhas
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Atenda e resolva solicitações abertas por criadores e marcas em tempo real.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'OPEN', label: 'Em Aberto' },
                { id: 'IN_PROGRESS', label: 'Em Andamento' },
                { id: 'CLOSED', label: 'Resolvidos' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTicketFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    ticketFilter === f.id
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-black text-slate-800">Nenhum chamado pendente nesta categoria!</p>
              <span className="text-[11px] text-slate-400">Todos os tickets foram atendidos ou não há pendências ativas.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map(ticket => {
                const isResolved = ticket.status === 'CLOSED';
                const isProgress = ticket.status === 'IN_PROGRESS';
                return (
                  <div 
                    key={ticket.id}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:bg-white hover:border-orange-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                          isResolved 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : isProgress
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isResolved ? '✓ Resolvido' : isProgress ? '⚡ Em Andamento' : '● Em Aberto'}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {ticket.category}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          De: <strong>{ticket.user.email}</strong> ({ticket.user.role === 'COMPANY' ? 'Empresa' : 'Criador'})
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900">{ticket.subject}</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{ticket.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isProgress && !isResolved && (
                        <button
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'IN_PROGRESS')}
                          disabled={isUpdatingTicket === ticket.id}
                          className="px-3.5 py-2 rounded-xl text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all"
                        >
                          Atender
                        </button>
                      )}
                      {!isResolved ? (
                        <button
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'CLOSED')}
                          disabled={isUpdatingTicket === ticket.id}
                          className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-sm flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolver
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateTicketStatus(ticket.id, 'OPEN')}
                          disabled={isUpdatingTicket === ticket.id}
                          className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-slate-800 bg-white border border-slate-200 transition-all"
                        >
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════════
            5. GESTÃO DE ACESSO PRO (GRANT PRO)
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-600" />
                Liberar Acesso Pro / Parceria VIP
              </h3>
              <p className="text-xs text-slate-400 font-medium">Ativa assinatura Pro instantaneamente para criadores ou marcas estratégicas.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={grantIdentifier}
              onChange={(e) => setGrantIdentifier(e.target.value)}
              placeholder="Digite o e-mail do usuário (ex: creator@vip.com)..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
            />
            <button
              onClick={handleGrantPro}
              disabled={isGranting || !grantIdentifier}
              className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-orange-600 hover:bg-orange-500 transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50"
            >
              {isGranting ? 'Ativando...' : 'Liberar Acesso Pro ➔'}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
