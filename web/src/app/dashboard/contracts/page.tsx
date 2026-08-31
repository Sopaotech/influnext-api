'use client';

import React, { useEffect, useState } from 'react';
import { api, approveDeliverable, rejectDeliverable } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  Brain, 
  Sparkles, 
  Loader2, 
  Send,
  DollarSign,
  Building2,
  Lock,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import Link from 'next/link';

import { EscrowExplanatoryCard } from '@/components/EscrowExplanatoryCard';
import { ContractLegalModal, ContractLegalData } from '@/components/ContractLegalModal';

interface Contract extends ContractLegalData {
  company?: { companyName: string; taxId?: string; city?: string; state?: string; user?: { email?: string } };
  influencer?: { handle: string; niche?: string; city?: string; state?: string; user?: { email?: string } };
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'COMPLETED': 
      return { label: 'Concluído & Pago', style: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'DISPUTED': 
      return { label: 'Em Mediação', style: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'ACTIVE': 
    case 'IN_PROGRESS':
      return { label: 'SafePay Ativo', style: 'text-orange-700 bg-orange-50 border-orange-200' };
    case 'PENDING_PAYMENT':
      return { label: 'Aguardando Depósito', style: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'DRAFT':
    default: 
      return { label: 'Pendente de Assinatura', style: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Minuta Jurídica Oficial & Assinatura
  const [legalModalContract, setLegalModalContract] = useState<ContractLegalData | null>(null);
  const [isSigningLegal, setIsSigningLegal] = useState(false);

  // Edição de roteiro
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editedScriptText, setEditedScriptText] = useState('');
  const [isSavingScript, setIsSavingScript] = useState(false);

  // Submissão de entregáveis
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

  // Aprovação/Rejeição
  const [actionLoadingIds, setActionLoadingIds] = useState<Record<string, boolean>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchContracts = async () => {
    try {
      const res = await api.get<Contract[]>('/contracts');
      setContracts(res.data);
    } catch {
      toast.error('Erro ao buscar contratos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const role = Cookies.get('influnext_role');
    setUserRole(role || null);
    fetchContracts();
  }, []);

  const handleSignContractFromModal = async () => {
    if (!legalModalContract) return;
    setIsSigningLegal(true);
    try {
      await api.post(`/contracts/${legalModalContract.id}/accept`);
      toast.success('Contrato assinado eletronicamente sob a MP 2.200-2/01!');
      await fetchContracts();
      setLegalModalContract(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao assinar contrato.');
    } finally {
      setIsSigningLegal(false);
    }
  };

  const handleSaveScript = async (contractId: string) => {
    setIsSavingScript(true);
    try {
      await api.patch(`/contracts/${contractId}/script`, { aiScript: editedScriptText });
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, aiScript: editedScriptText } : c));
      toast.success('Roteiro atualizado com sucesso!');
      setEditingScriptId(null);
    } catch {
      toast.error('Erro ao atualizar roteiro.');
    } finally {
      setIsSavingScript(false);
    }
  };

  const handleSubmitDeliverable = async (deliverableId: string) => {
    const url = proofUrls[deliverableId];
    if (!url || !url.startsWith('http')) {
      toast.error('Por favor, informe um link válido (iniciando com http:// ou https://).');
      return;
    }

    setSubmittingIds(prev => ({ ...prev, [deliverableId]: true }));
    try {
      const res = await api.post(`/deliverables/${deliverableId}/submit`, { proofUrl: url });
      setContracts(prev => prev.map(c => {
        if (!c.deliverables) return c;
        const hasDeliv = c.deliverables.some(d => d.id === deliverableId);
        if (!hasDeliv) return c;
        return {
          ...c,
          deliverables: c.deliverables.map(d => d.id === deliverableId ? res.data : d)
        };
      }));
      toast.success('Link do entregável enviado para validação da IA!');
      setProofUrls(prev => {
        const copy = { ...prev };
        delete copy[deliverableId];
        return copy;
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao enviar link.');
    } finally {
      setSubmittingIds(prev => ({ ...prev, [deliverableId]: false }));
    }
  };

  const handleApproveDeliverable = async (deliverableId: string) => {
    setActionLoadingIds(prev => ({ ...prev, [deliverableId]: true }));
    try {
      await approveDeliverable(deliverableId);
      toast.success('Entregável APROVADO! O pagamento Escrow foi liberado para o influenciador.');
      await fetchContracts();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao aprovar entregável.');
    } finally {
      setActionLoadingIds(prev => ({ ...prev, [deliverableId]: false }));
    }
  };

  const handleRejectDeliverable = async (deliverableId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Informe o motivo do ajuste antes de enviar.');
      return;
    }

    setActionLoadingIds(prev => ({ ...prev, [deliverableId]: true }));
    try {
      await rejectDeliverable(deliverableId, rejectReason);
      toast.success('Solicitação de ajuste enviada ao influenciador.');
      setRejectingId(null);
      setRejectReason('');
      await fetchContracts();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao enviar solicitação de ajuste.');
    } finally {
      setActionLoadingIds(prev => ({ ...prev, [deliverableId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-[#FAFAFA] min-h-screen animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="h-44 bg-white rounded-3xl border border-slate-200" />
        <div className="h-96 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR - GOVERNANÇA JURÍDICA & ASSINATURA ELETRÔNICA
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Governança Jurídica SafePay
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" /> MP 2.200-2/01 & Lei 14.063/20
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
            Meus <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">Contratos</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
            Gestão de contratos com assinatura eletrônica autenticada por hash SHA-256 e custódia financeira SafePay.
          </p>
        </div>

        {userRole === 'COMPANY' && (
          <Link href="/dashboard/company/new-contract">
            <button className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Novo Contrato SafePay
            </button>
          </Link>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. CARD EXPLICATIVO DO ESCROW SEGURO
      ══════════════════════════════════════════════════════════════════════ */}
      <EscrowExplanatoryCard />

      {/* ══════════════════════════════════════════════════════════════════════
          3. TABELA / CARDS DE CONTRATOS COM ASSINATURA DIRETA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        {contracts.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Nenhum contrato ativo no momento.</h3>
            <p className="text-xs text-slate-500">Novas propostas e contratos fechados aparecerão aqui em tempo real.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-500 py-5">Projeto & Campanha</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-500">Parceiro</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-500">Valor Bruto / Líquido</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-500">Status SafePay</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-wider text-slate-500 text-right pr-6">Ação Rápida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const badge = getStatusBadge(contract.escrowStatus);
                  const isDraft = contract.escrowStatus === 'DRAFT';
                  const isExpanded = expandedId === contract.id;

                  return (
                    <React.Fragment key={contract.id}>
                      <TableRow 
                        className={`border-b border-slate-100 transition-colors group cursor-pointer ${
                          isExpanded ? 'bg-orange-50/30' : 'hover:bg-slate-50/70'
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                      >
                        <TableCell className="pl-6">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-orange-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </TableCell>

                        <TableCell className="py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 leading-tight">{contract.title}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">SHA: {contract.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs font-bold text-slate-700">
                            {contract.company?.companyName || (contract.influencer ? `@${contract.influencer.handle}` : 'Visitante Express')}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-slate-900 block">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.budget)}
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 block">
                              Líq: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.netAmount || (contract.budget * 0.85))}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge.style}`}>
                            {badge.label}
                          </span>
                        </TableCell>

                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          {isDraft && userRole === 'INFLUENCER' ? (
                            <button
                              onClick={() => setLegalModalContract(contract)}
                              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Ver Minuta & Assinar
                            </button>
                          ) : (
                            <button
                              onClick={() => setLegalModalContract(contract)}
                              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5 text-orange-600" />
                              Ver Minuta
                            </button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Conteúdo Expandido do Contrato */}
                      {isExpanded && (
                        <TableRow className="bg-slate-50/50 border-b border-slate-200">
                          <TableCell colSpan={6} className="p-6 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                              
                              {/* Coluna 1 & 2: Briefing & Roteiro */}
                              <div className="lg:col-span-2 space-y-6">
                                {/* Briefing */}
                                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                                    <FileText className="w-4 h-4 text-orange-600" /> Briefing da Marca
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    {contract.briefing || "Produção de 1x Reels demonstrativo com gancho nos primeiros 3 segundos e inserção de cupom oficial."}
                                  </p>
                                </div>

                                {/* Roteiro Inteligente */}
                                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600">
                                      <Sparkles className="w-4 h-4" /> Roteiro Aprovado para Gravação
                                    </div>
                                    {editingScriptId !== contract.id && (
                                      <button 
                                        onClick={() => {
                                          setEditingScriptId(contract.id);
                                          setEditedScriptText(contract.aiScript || '');
                                        }}
                                        className="text-xs font-bold text-orange-600 hover:underline"
                                      >
                                        Editar Roteiro
                                      </button>
                                    )}
                                  </div>

                                  {editingScriptId === contract.id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={editedScriptText}
                                        onChange={(e) => setEditedScriptText(e.target.value)}
                                        rows={6}
                                        className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 focus:outline-none focus:border-orange-500"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => setEditingScriptId(null)}
                                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={() => handleSaveScript(contract.id)}
                                          disabled={isSavingScript}
                                          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                                        >
                                          {isSavingScript ? 'Salvando...' : 'Salvar Roteiro'}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                                      {contract.aiScript || "🎬 [Hook 0-3s]: Mostre o produto com transição rápida.\n🎥 [Corpo 3-45s]: Demonstração dos diferenciais.\n🛒 [CTA 45-60s]: Chamada para conferir o link na bio com cupom."}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Coluna 3: Entregáveis & Governança */}
                              <div className="space-y-5">
                                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Entregáveis do Contrato
                                    </span>
                                  </div>

                                  <div className="space-y-3">
                                    {(contract.deliverables && contract.deliverables.length > 0 ? contract.deliverables : [
                                      { id: 'd1', title: '1x Reels Demonstrativo (60s)', type: 'REEL', status: 'PENDING', deadline: new Date().toISOString() }
                                    ]).map((d) => (
                                      <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-black text-slate-900">{d.title}</span>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                            {d.status}
                                          </span>
                                        </div>

                                        {userRole === 'INFLUENCER' && d.status === 'PENDING' && (
                                          <div className="pt-2 flex gap-2">
                                            <input
                                              type="text"
                                              placeholder="Cole o link do Instagram/TikTok..."
                                              value={proofUrls[d.id] || ''}
                                              onChange={(e) => setProofUrls(prev => ({ ...prev, [d.id]: e.target.value }))}
                                              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-orange-500 font-medium"
                                            />
                                            <button
                                              onClick={() => handleSubmitDeliverable(d.id)}
                                              disabled={submittingIds[d.id]}
                                              className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-black uppercase shadow-sm"
                                            >
                                              {submittingIds[d.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => setLegalModalContract(contract)}
                                    className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Abrir Minuta Jurídica Oficial
                                  </button>
                                </div>
                              </div>

                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. MODAL DA MINUTA JURÍDICA OFICIAL COM ASSINATURA ELETRÔNICA
      ══════════════════════════════════════════════════════════════════════ */}
      {legalModalContract && (
        <ContractLegalModal
          isOpen={!!legalModalContract}
          onClose={() => setLegalModalContract(null)}
          contract={legalModalContract}
          canSign={userRole === 'INFLUENCER' && legalModalContract.escrowStatus === 'DRAFT'}
          onSign={handleSignContractFromModal}
          isSigning={isSigningLegal}
        />
      )}

    </div>
  );
}
