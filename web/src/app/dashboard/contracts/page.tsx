'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ShieldCheck, Clock, CheckCircle2, ExternalLink, Zap, ChevronDown, ChevronUp, Brain, Sparkles, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import Link from 'next/link';

import { EscrowExplanatoryCard } from '@/components/EscrowExplanatoryCard';

interface Contract {
  id: string;
  title: string;
  budget: number;
  netAmount: number;
  escrowStatus: string;
  createdAt: string;
  briefing?: string;
  aiScript?: string;
  company?: { companyName: string };
  influencer?: { handle: string };
  deliverables?: { id: string; title: string; type: string; deadline: string; status: string; proofUrl?: string }[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'DISPUTED': return 'text-rose-700 bg-rose-50 border-rose-200';
    case 'ACTIVE': return 'text-orange-700 bg-orange-50 border-orange-200';
    default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
  }
};

export default function ContractsPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Monitor theme cookie updates
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
    const role = Cookies.get('influnext_role');
    setUserRole(role || null);

    const fetchContracts = async () => {
      try {
        const endpoint = '/contracts';
        const res = await api.get<Contract[]>(endpoint);
        setContracts(res.data);
      } catch (err) {
        toast.error('Erro ao buscar contratos.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContracts();
  }, []);

  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editedScriptText, setEditedScriptText] = useState('');
  const [isSavingScript, setIsSavingScript] = useState(false);

  const handleSaveScript = async (contractId: string) => {
    setIsSavingScript(true);
    try {
      await api.patch(`/contracts/${contractId}/script`, { aiScript: editedScriptText });
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, aiScript: editedScriptText } : c));
      toast.success('Roteiro atualizado com sucesso!');
      setEditingScriptId(null);
    } catch (err) {
      toast.error('Erro ao atualizar roteiro.');
    } finally {
      setIsSavingScript(false);
    }
  };

  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

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
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar link.');
    } finally {
      setSubmittingIds(prev => ({ ...prev, [deliverableId]: false }));
    }
  };

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sincronizando Escrow...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-10 ${
        isDark ? 'border-white/[0.08]' : 'border-zinc-200'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-500 font-black text-[10px] tracking-[0.4em] uppercase">
            <ShieldCheck className="w-5 h-5" />
            Central de Governança // Escrow_Active
          </div>
          <h1 className="text-5xl font-black text-current tracking-tighter">
            Meus <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600">Contratos</span>
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">
            Gestão de ativos e segurança jurídica automatizada.
          </p>
        </div>
      </header>

      <EscrowExplanatoryCard />

      <section className={`border rounded-2xl overflow-hidden shadow-xl ${
        isDark ? 'bg-[#1a1716] border-[#2e2724] shadow-black/50' : 'bg-white border-zinc-200 shadow-zinc-100'
      }`}>
        <div className="overflow-x-auto">
          {contracts.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <FileText className="w-12 h-12 text-zinc-400 mx-auto" />
               <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Nenhum contrato formalizado até o momento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className={isDark ? 'bg-[#131110]/50' : 'bg-zinc-50'}>
                <TableRow className={`border-b hover:bg-transparent ${isDark ? 'border-b-[#2e2724]' : 'border-b-zinc-200'}`}>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 py-6">Projeto</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Parceiro</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Valor Bruto</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status Escrow</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <React.Fragment key={contract.id}>
                    <TableRow 
                      className={`border-b transition-colors group cursor-pointer ${
                        isDark 
                          ? 'border-b-[#2e2724] hover:bg-[#241f1c]' 
                          : 'border-b-zinc-200 hover:bg-zinc-50/50'
                      } ${expandedId === contract.id ? (isDark ? 'bg-[#241f1c]' : 'bg-zinc-50') : ''}`}
                      onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                    >
                      <TableCell>
                        {expandedId === contract.id ? <ChevronUp className="w-4 h-4 text-orange-400" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`text-sm font-black ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{contract.title}</p>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase">ID: {contract.id.slice(0, 8)}</p>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-650'}`}>
                            {contract.company?.companyName || contract.influencer?.handle || '---'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-black ${isDark ? 'text-[#e8e0f5]' : 'text-zinc-800'}`}>
                            R$ {Number(contract.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getStatusColor(contract.escrowStatus)}`}>
                            {contract.escrowStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-bold text-zinc-500">
                            {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </TableCell>
                    </TableRow>
                    
                    {expandedId === contract.id && (
                      <TableRow className={`border-b ${
                        isDark ? 'bg-[#131110]/30 border-b-[#2e2724]' : 'bg-zinc-50/20 border-b-zinc-200'
                      }`}>
                        <TableCell colSpan={6} className="p-8">
                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-300">
                              {/* Coluna da Esquerda (Briefing + Roteiro) */}
                              <div className="lg:col-span-2 space-y-6">
                                 {/* Briefing da Marca */}
                                 <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                       <FileText className="w-3.5 h-3.5" /> Briefing da Marca
                                    </div>
                                    <div className={`p-6 border rounded-2xl text-xs leading-relaxed font-medium ${
                                      isDark ? 'bg-[#1a1716] border-[#2e2724] text-zinc-400' : 'bg-white border-zinc-200 text-zinc-650'
                                    }`}>
                                       {contract.briefing || "Nenhum briefing detalhado fornecido."}
                                    </div>
                                 </div>

                                 {/* Roteiro Inteligente InfluNext */}
                                 <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                       <div className="flex items-center gap-2 text-[10px] font-black text-orange-400 uppercase tracking-widest">
                                          <Sparkles className="w-3.5 h-3.5" /> Roteiro Sugerido pela IA (O Cérebro)
                                       </div>
                                       {editingScriptId !== contract.id ? (
                                          <button 
                                             onClick={() => {
                                                setEditingScriptId(contract.id);
                                                setEditedScriptText(contract.aiScript || '');
                                             }}
                                             className="text-[9px] font-black text-orange-400 hover:text-orange-300 transition-colors uppercase tracking-widest"
                                          >
                                             {userRole === 'INFLUENCER' ? 'Dar minha Opinião / Ajustar' : 'Ajustar Roteiro'}
                                          </button>
                                       ) : null}
                                    </div>
                                    <div className={`p-6 border rounded-2xl text-xs leading-relaxed font-sans prose prose-invert max-w-none ${
                                      isDark 
                                        ? 'bg-gradient-to-br from-orange-950/20 to-amber-950/20 border-orange-500/20 text-zinc-200' 
                                        : 'bg-gradient-to-br from-orange-50/50 to-amber-50/50 border border-orange-250 text-zinc-800'
                                    }`}>
                                       {editingScriptId === contract.id ? (
                                          <div className="space-y-3">
                                             <textarea 
                                                value={editedScriptText}
                                                onChange={(e) => setEditedScriptText(e.target.value)}
                                                placeholder="Digite suas orientações, comentários ou roteiro adaptado..."
                                                className={`w-full border rounded-xl p-4 text-xs resize-none font-sans ${
                                                  isDark 
                                                    ? 'bg-black/45 border-[#2e2724] text-zinc-200 placeholder:text-zinc-650' 
                                                    : 'bg-white border-zinc-250 text-zinc-850 placeholder:text-zinc-400'
                                                }`}
                                                rows={8}
                                                disabled={isSavingScript}
                                             />
                                             <div className="flex gap-2 justify-end">
                                                <button 
                                                   onClick={() => setEditingScriptId(null)}
                                                   disabled={isSavingScript}
                                                   className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors ${
                                                     isDark ? 'border-zinc-800 text-zinc-450 hover:bg-white/[0.02]' : 'border-zinc-200 text-zinc-550 hover:bg-zinc-50'
                                                   }`}
                                                >
                                                   Cancelar
                                                </button>
                                                <button 
                                                   onClick={() => handleSaveScript(contract.id)}
                                                   disabled={isSavingScript || !editedScriptText.trim()}
                                                   className="px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                                                >
                                                   {isSavingScript ? (
                                                      <>
                                                         <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                         Salvando...
                                                      </>
                                                   ) : (
                                                      'Salvar Roteiro'
                                                   )}
                                                </button>
                                             </div>
                                          </div>
                                       ) : contract.aiScript ? (
                                          <div className="whitespace-pre-wrap">{contract.aiScript}</div>
                                       ) : (
                                          <div className="flex items-center gap-2 text-zinc-500 italic">
                                             <Brain className="w-4 h-4 opacity-50" />
                                             Processando inteligência de roteiro...
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              {/* Entregáveis e Submissão */}
                              <div className="lg:col-span-1 space-y-4">
                                 {/* Ações de Assinatura e Escrow de acordo com a regra de negócios */}
                                 {userRole === 'INFLUENCER' && contract.escrowStatus === 'DRAFT' && (
                                   <div className={`p-6 border rounded-2xl space-y-3 shadow-md ${
                                     isDark ? 'bg-[#241a15] border-orange-500/30' : 'bg-orange-50 border-orange-200'
                                   }`}>
                                     <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-orange-400' : 'text-orange-850'}`}>Proposta Pendente</h4>
                                     <p className="text-[10px] text-zinc-505 dark:text-zinc-400 font-medium leading-relaxed">
                                       Você precisa revisar a proposta e assinar eletronicamente para habilitar o depósito do patrocinador.
                                     </p>
                                     <button 
                                       onClick={async (e) => {
                                         e.stopPropagation();
                                         if (confirm('Deseja assinar eletronicamente e aceitar esta proposta de contrato?')) {
                                           try {
                                             await api.post(`/contracts/${contract.id}/accept`);
                                             toast.success('Contrato assinado eletronicamente com sucesso!');
                                             const res = await api.get('/contracts');
                                             setContracts(res.data);
                                           } catch (err: any) {
                                             toast.error(err.response?.data?.error || 'Erro ao assinar contrato.');
                                           }
                                         }
                                       }}
                                       className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                                     >
                                       <ShieldCheck className="w-3.5 h-3.5" /> Assinar e Aceitar Contrato
                                     </button>
                                   </div>
                                 )}

                                 {userRole === 'COMPANY' && contract.escrowStatus === 'PENDING_PAYMENT' && (
                                   <div className={`p-6 border rounded-2xl space-y-3 shadow-md ${
                                     isDark ? 'bg-[#15241b] border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                                   }`}>
                                     <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-850'}`}>Aguardando Depósito</h4>
                                     <p className="text-[10px] text-zinc-505 dark:text-zinc-400 font-medium leading-relaxed">
                                       O Creator aceitou e assinou a proposta! Deposite o valor em garantia no cofre do Escrow para iniciar a produção.
                                     </p>
                                     <div className="flex flex-col gap-2">
                                       <Link href={`/dashboard/contracts/${contract.id}/pay`} className="w-full">
                                         <button className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5">
                                           Depositar via Stripe
                                         </button>
                                       </Link>
                                       <button 
                                         onClick={async (e) => {
                                           e.stopPropagation();
                                           if (confirm('Confirmar depósito Escrow simulado para iniciar a campanha?')) {
                                             try {
                                               await api.post(`/contracts/${contract.id}/pay`);
                                               toast.success('Depósito Escrow simulado com sucesso!');
                                               const res = await api.get('/contracts');
                                               setContracts(res.data);
                                             } catch (err: any) {
                                               toast.error(err.response?.data?.error || 'Erro ao confirmar depósito.');
                                             }
                                           }
                                         }}
                                         className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                                           isDark ? 'border-zinc-800 text-zinc-400 hover:bg-white/5' : 'border-zinc-250 text-zinc-650 hover:bg-zinc-100'
                                         }`}
                                       >
                                         Simular Depósito (Mock)
                                       </button>
                                     </div>
                                   </div>
                                 )}

                                 {userRole === 'COMPANY' && contract.escrowStatus === 'DRAFT' && (
                                   <div className={`p-6 border rounded-2xl space-y-3 shadow-md ${
                                     isDark ? 'bg-[#1a1716] border-[#2e2724]' : 'bg-white border-zinc-200'
                                   }`}>
                                     <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">Proposta Enviada</h4>
                                     <p className="text-[10px] text-zinc-505 dark:text-zinc-500 font-medium leading-relaxed">
                                       Aguardando o Creator aceitar e assinar eletronicamente o contrato para habilitar o pagamento em Escrow.
                                     </p>
                                   </div>
                                 )}

                                 <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Entregáveis / Ação de Escrow
                                 </div>
                                 <div className="space-y-4">
                                    {!contract.deliverables || contract.deliverables.length === 0 ? (
                                      <p className="text-zinc-500 text-xs italic">Nenhum entregável cadastrado para este contrato.</p>
                                    ) : (
                                      contract.deliverables.map((d) => {
                                        const isDone = d.status === 'APPROVED';
                                        const isPending = d.status === 'PENDING';
                                        const isReview = d.status === 'UNDER_REVIEW';

                                        let statusBadgeColor = 'text-zinc-500 bg-zinc-150 border-zinc-200';
                                        if (isDone) statusBadgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                                        if (isReview) statusBadgeColor = 'text-blue-700 bg-blue-50 border-blue-200';

                                        return (
                                          <div key={d.id} className={`p-5 border rounded-2xl space-y-3 shadow-sm ${
                                            isDark ? 'bg-[#1a1716] border-[#2e2724] shadow-black/20' : 'bg-white border-zinc-200 shadow-zinc-100/50'
                                          }`}>
                                            <div className="flex justify-between items-start gap-2">
                                              <div>
                                                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{d.title}</h4>
                                                <span className="text-[8px] bg-orange-500/15 text-orange-600 px-2 py-0.5 rounded border border-orange-500/10 font-bold uppercase tracking-widest">{d.type}</span>
                                              </div>
                                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${statusBadgeColor}`}>
                                                {d.status}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold">
                                              <Clock className="w-3 h-3" /> Prazo: {new Date(d.deadline).toLocaleDateString('pt-BR')}
                                            </div>

                                            {isReview && d.proofUrl && (
                                              <div className={`pt-2 border-t ${isDark ? 'border-zinc-800/40' : 'border-zinc-100'}`}>
                                                <a 
                                                  href={d.proofUrl} 
                                                  target="_blank" 
                                                  rel="noreferrer" 
                                                  className="text-[9px] text-blue-500 hover:underline flex items-center gap-1 font-bold uppercase tracking-widest"
                                                >
                                                  Ver Link Enviado <ExternalLink className="w-3 h-3" />
                                                </a>
                                              </div>
                                            )}

                                            {isDone && d.proofUrl && (
                                              <div className={`pt-2 border-t ${isDark ? 'border-zinc-800/40' : 'border-zinc-100'}`}>
                                                <a 
                                                  href={d.proofUrl} 
                                                  target="_blank" 
                                                  rel="noreferrer" 
                                                  className="text-[9px] text-emerald-700 hover:underline flex items-center gap-1 font-bold uppercase tracking-widest"
                                                >
                                                  Ver Link Validado <ExternalLink className="w-3 h-3" />
                                                </a>
                                              </div>
                                            )}

                                            {isPending && userRole === 'INFLUENCER' && (
                                              <div className={`pt-2 border-t ${isDark ? 'border-zinc-800/40' : 'border-zinc-100'}`}>
                                                <div className="flex gap-2">
                                                  <input 
                                                    type="text" 
                                                    placeholder="URL do Instagram/TikTok..." 
                                                    value={proofUrls[d.id] || ''}
                                                    onChange={(e) => setProofUrls(prev => ({ ...prev, [d.id]: e.target.value }))}
                                                    className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
                                                      isDark 
                                                        ? 'bg-black/45 border-[#2e2724] text-zinc-200 placeholder:text-zinc-650 focus:border-orange-500/50' 
                                                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-450 focus:border-orange-400 focus:bg-white'
                                                    }`}
                                                  />
                                                  <button 
                                                    onClick={() => handleSubmitDeliverable(d.id)}
                                                    disabled={submittingIds[d.id]}
                                                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-600 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center animate-in fade-in"
                                                  >
                                                    {submittingIds[d.id] ? (
                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                      <Send className="w-4 h-4" />
                                                    )}
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                 </div>
                              </div>
                           </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* Safety Banner */}
      <footer className={`p-6 border rounded-2xl flex items-center gap-4 ${
        isDark ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'
      }`}>
         <div className="bg-emerald-500 p-2 rounded-lg">
            <ShieldCheck className={`w-5 h-5 ${isDark ? 'text-[#131110]' : 'text-white'}`} />
         </div>
         <div>
            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Proteção Ativa InfluNext</p>
            <p className="text-[9px] text-zinc-550 dark:text-zinc-500 font-bold">Todos os pagamentos são retidos em Escrow e liberados apenas após a validação dos entregáveis.</p>
         </div>
      </footer>

    </div>
  );
}
