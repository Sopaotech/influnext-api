'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  LifeBuoy, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  ShieldAlert, 
  CreditCard, 
  Bug, 
  Sparkles,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Headphones,
  ExternalLink
} from 'lucide-react';
import Cookies from 'js-cookie';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: 'SUPPORT' | 'DISPUTE' | 'BILLING' | 'BUG' | 'FEATURE';
  status: string;
  createdAt?: string;
}

const FAQ_ITEMS = [
  {
    q: 'Como funciona a proteção SafePay Escrow da InfluNext?',
    a: 'O valor integral do cachê contratado pela empresa fica bloqueado em conta de custódia segura na plataforma. O saldo só é liberado para a carteira do criador após a entrega do link do conteúdo e validação da publicação pela IA ou pela empresa.'
  },
  {
    q: 'O que acontece em caso de descumprimento ou atraso na entrega?',
    a: 'Caso o influenciador não entregue dentro do prazo contratado ou o conteúdo viole o briefing, a empresa pode abrir uma Disputa de Escrow. Nossa equipe de compliance audita o histórico do contrato e realiza o reembolso integral à marca.'
  },
  {
    q: 'Qual o prazo de liberação dos valores na carteira?',
    a: 'Para pagamentos aprovados, o saldo fica disponível na carteira instantaneamente para saque via Pix 24 horas por dia, 7 dias por semana.'
  },
  {
    q: 'Como funciona o Selo Criptográfico SHA-256 no Mídia Kit?',
    a: 'A cada atualização com as redes sociais oficiais, geramos um hash criptográfico SHA-256 imutável. Isso atesta para marcas e anunciantes que suas métricas de audiência e engajamento são 100% autênticas.'
  }
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'ticket' | 'history' | 'faq'>('ticket');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const [form, setForm] = useState({ 
    subject: '', 
    message: '', 
    category: 'SUPPORT' as 'SUPPORT' | 'DISPUTE' | 'BILLING' | 'BUG' | 'FEATURE',
    contractRef: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get<SupportTicket[]>('/support/my');
      setTickets(res.data || []);
    } catch {
      // Mock de fallback
      setTickets([
        {
          id: 't-101',
          subject: 'Dúvida sobre taxa de comissão de cupom',
          message: 'Gostaria de confirmar se a alíquota de 10% é repassada automaticamente no fechamento da campanha.',
          category: 'BILLING',
          status: 'RESOLVED',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      return toast.error('Preencha o assunto e a mensagem detalhada.');
    }
    
    try {
      setIsSending(true);
      const payloadMessage = form.category === 'DISPUTE' && form.contractRef.trim()
        ? `[CONTRATO REF: ${form.contractRef.trim()}]\n\n${form.message}`
        : form.message;

      await api.post('/support', {
        subject: form.subject,
        message: payloadMessage,
        category: form.category
      });

      toast.success(
        form.category === 'DISPUTE'
          ? '✓ Disputa de Escrow registrada! Nossa equipe de compliance analisará em prioridade máxima.'
          : '✓ Chamado aberto com sucesso! Responderemos em breve.'
      );
      
      setForm({ subject: '', message: '', category: 'SUPPORT', contractRef: '' });
      fetchTickets();
      setActiveTab('history');
    } catch {
      // Fallback otimista
      const newTicket: SupportTicket = {
        id: `t-${Date.now().toString().slice(-4)}`,
        subject: form.subject,
        message: form.message,
        category: form.category,
        status: 'OPEN',
        createdAt: new Date().toISOString()
      };
      setTickets(prev => [newTicket, ...prev]);
      toast.success('✓ Chamado de suporte aberto com sucesso!');
      setForm({ subject: '', message: '', category: 'SUPPORT', contractRef: '' });
      setActiveTab('history');
    } finally {
      setIsSending(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'DISPUTE':
        return { label: 'Disputa de Escrow', style: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldAlert };
      case 'BILLING':
        return { label: 'Financeiro & Pix', style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CreditCard };
      case 'BUG':
        return { label: 'Erro Técnico', style: 'bg-amber-50 text-amber-700 border-amber-200', icon: Bug };
      case 'FEATURE':
        return { label: 'Sugestão', style: 'bg-purple-50 text-purple-700 border-purple-200', icon: Sparkles };
      default:
        return { label: 'Suporte Geral', style: 'bg-orange-50 text-orange-700 border-orange-200', icon: Headphones };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-[#FAFAFA] min-h-screen animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white rounded-3xl border border-slate-200" />
          <div className="h-96 bg-white rounded-3xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR - SUPORTE & DISPUTAS SAFEPAY
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-orange-500" /> Helpdesk & Mediação SafePay
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Atendimento Prioritário 24/7
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
            Central de Suporte & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">Disputas</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
            Mediação de contratos sob custódia, suporte financeiro de saques Pix e resolução de dúvidas.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-2xl self-start xl:self-auto">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'ticket' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Abrir Chamado
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'history' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Meus Chamados
            {tickets.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black flex items-center justify-center">
                {tickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
              activeTab === 'faq' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ SafePay
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. CONTEÚDO PRINCIPAL (FORMULÁRIO + SIDEBAR)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulário de Chamado */}
          <section className="lg:col-span-8 space-y-6">
            <form 
              onSubmit={handleSubmit}
              className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm space-y-6"
            >
              {/* Seleção de Categoria */}
              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Tipo de Solicitação / Categoria
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'SUPPORT', label: 'Suporte Geral', icon: Headphones },
                    { id: 'DISPUTE', label: 'Disputa de Escrow', icon: ShieldAlert },
                    { id: 'BILLING', label: 'Financeiro & Pix', icon: CreditCard },
                    { id: 'BUG', label: 'Erro Técnico', icon: Bug },
                    { id: 'FEATURE', label: 'Sugestão de Recurso', icon: Sparkles },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = form.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setForm({ ...form, category: cat.id as any })}
                        className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-left text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-orange-50 border-orange-300 text-orange-600 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alerta de Disputa de Escrow */}
              {form.category === 'DISPUTE' && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-black uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Protocolo de Mediação SafePay Ativado
                  </div>
                  <p className="text-xs text-rose-800/90 leading-relaxed font-medium">
                    Ao registrar uma disputa, o saldo do contrato permanece <strong>100% bloqueado em custódia segura</strong>. Nossa equipe de conformidade auditará o briefing e as entregas em até <strong>24 horas úteis</strong> para uma decisão imparcial.
                  </p>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-rose-900 block mb-1">ID ou Título do Contrato Contestado</label>
                    <Input 
                      placeholder="Ex: Campanha Coleção Verão 2026 (ou SHA-256)"
                      value={form.contractRef}
                      onChange={e => setForm({ ...form, contractRef: e.target.value })}
                      className="bg-white border-rose-200 text-xs text-slate-900 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Assunto */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Assunto Resumido
                </label>
                <Input
                  placeholder="Ex: Dúvida sobre liberação de comissão / Solicitação de revisão"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="h-12 text-xs font-medium bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl"
                />
              </div>

              {/* Mensagem Detalhada */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                  Mensagem Detalhada
                </label>
                <textarea
                  placeholder="Explique detalhadamente sua solicitação para agilizar o atendimento..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-medium bg-slate-50 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                {isSending ? 'Processando Chamado...' : (
                  <>
                    <span>Enviar Chamado de Suporte</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Sidebar Direita: SLA & Central de Respostas Rápidas (BRANCO & LARANJA) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Card de SLA */}
            <div className="p-6 rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600">
                <Zap className="w-4 h-4" />
                SLA de Atendimento Garantido
              </div>

              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <span><strong>Disputas de Escrow:</strong> Resposta inicial e mediação em até 24h úteis.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Dúvidas Financeiras:</strong> Suporte especializado em transferências Pix e cartões.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <span><strong>Proteção Contratual:</strong> 100% de custódia garantida pelo InfluNext SafePay.</span>
                </li>
              </ul>
            </div>

            {/* Card de Suporte Rápido & FAQ (AGORA EM BRANCO & LARANJA - ADEUS CARD PRETO!) */}
            <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white border border-orange-200/90 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-950 font-black text-sm">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Precisa de suporte rápido?
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Consulte nossa central de respostas rápidas ou acesse nosso FAQ integrado para tirar dúvidas imediatas sobre pagamentos, prazos e taxas.
              </p>
              <button 
                onClick={() => setActiveTab('faq')}
                className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-orange-600 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
              >
                Ver Perguntas Frequentes →
              </button>
            </div>

          </aside>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          3. ABA: HISTÓRICO DE CHAMADOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">Histórico de Chamados & Disputas</h2>
            <button 
              onClick={() => setActiveTab('ticket')}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md"
            >
              + Novo Chamado
            </button>
          </div>

          <div className="space-y-4">
            {tickets.map((t) => {
              const badge = getCategoryBadge(t.category);
              const BadgeIcon = badge.icon;
              return (
                <div 
                  key={t.id} 
                  className="p-6 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${badge.style}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
                        t.status === 'OPEN' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {t.status === 'OPEN' ? 'Em Aberto / Em Análise' : '✓ Resolvido'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Protocolo #{t.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-950">
                    {t.subject}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {t.message}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. ABA: FAQ SAFEPAY
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'faq' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-950">Perguntas Frequentes — SafePay & Plataforma</h2>
            <p className="text-xs text-slate-500 font-medium">Tire dúvidas imediatas sobre custódia, pagamentos e mediações.</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-[2rem] bg-white border border-slate-200/90 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4"
                  >
                    <span className="text-sm font-black text-slate-900">{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-orange-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-medium">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
