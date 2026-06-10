'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ShieldCheck, Clock, CheckCircle2, AlertCircle, ExternalLink, Zap, ChevronDown, ChevronUp, Brain, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Contract[]>('/contracts');
      setContracts(res.data);
    } catch (err) {
      toast.error('Erro ao carregar contratos.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-400 bg-emerald-400/10';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-400/10';
      case 'DRAFT': return 'text-zinc-400 bg-zinc-400/10';
      case 'PENDING_PAYMENT': return 'text-amber-400 bg-amber-400/10';
      default: return 'text-purple-400 bg-purple-400/10';
    }
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Clock className="w-8 h-8 text-purple-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sincronizando Escrow...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.08] pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-500 font-black text-[10px] tracking-[0.4em] uppercase">
            <ShieldCheck className="w-5 h-5" />
            Central de Governança // Escrow_Active
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">
            Meus <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600">Contratos</span>
          </h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em]">
            Gestão de ativos e segurança jurídica automatizada.
          </p>
        </div>
      </header>

      <section className="bg-[#100c1e] border border-[#1e1430] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {contracts.length === 0 ? (
            <div className="p-20 text-center space-y-4">
               <FileText className="w-12 h-12 text-zinc-800 mx-auto" />
               <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Nenhum contrato formalizado até o momento.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#080810]/50">
                <TableRow className="border-b-[#1e1430] hover:bg-transparent">
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
                      className={`border-b-[#1e1430] hover:bg-[#151025] transition-colors group cursor-pointer ${expandedId === contract.id ? 'bg-[#151025]' : ''}`}
                      onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                    >
                      <TableCell>
                        {expandedId === contract.id ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-zinc-200">{contract.title}</p>
                              <p className="text-[9px] text-zinc-600 font-bold uppercase">ID: {contract.id.slice(0, 8)}</p>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-zinc-400">
                            {contract.company?.companyName || contract.influencer?.handle || '---'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-black text-[#e8e0f5]">
                            R$ {Number(contract.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${getStatusColor(contract.escrowStatus)}`}>
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
                      <TableRow className="bg-[#080810]/30 border-b-[#1e1430]">
                        <TableCell colSpan={6} className="p-8">
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                              {/* Briefing da Marca */}
                              <div className="space-y-4">
                                 <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                    <FileText className="w-3.5 h-3.5" /> Briefing da Marca
                                 </div>
                                 <div className="p-6 bg-[#100c1e] border border-[#1e1430] rounded-2xl text-zinc-400 text-xs leading-relaxed font-medium">
                                    {contract.briefing || "Nenhum briefing detalhado fornecido."}
                                 </div>
                              </div>

                              {/* Roteiro Inteligente InfluNext */}
                              <div className="space-y-4">
                                 <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest">
                                    <Sparkles className="w-3.5 h-3.5" /> Roteiro Sugerido pela IA (O Cérebro)
                                 </div>
                                 <div className="p-6 bg-gradient-to-br from-purple-950/20 to-indigo-950/20 border border-purple-500/20 rounded-2xl text-zinc-200 text-xs leading-relaxed font-sans prose prose-invert max-w-none">
                                    {contract.aiScript ? (
                                      <div className="whitespace-pre-wrap">{contract.aiScript}</div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-zinc-600 italic">
                                         <Brain className="w-4 h-4 opacity-50" />
                                         Processando inteligência de roteiro...
                                      </div>
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
      <footer className="p-6 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl flex items-center gap-4">
         <div className="bg-emerald-500 p-2 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-[#080810]" />
         </div>
         <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Proteção Ativa InfluNext</p>
            <p className="text-[9px] text-zinc-500 font-bold">Todos os pagamentos são retidos em Escrow e liberados apenas após a validação dos entregáveis.</p>
         </div>
      </footer>

    </div>
  );
}
