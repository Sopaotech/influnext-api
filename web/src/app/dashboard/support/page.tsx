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
  Zap
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
    q: 'Como funciona o SafePay Escrow da InfluNext?',
    a: 'O valor do cachê contratado pela empresa fica retido em conta de custódia segura (via Mercado Pago / Stripe). O dinheiro só é liberado para a carteira do influenciador após o envio do comprovante da publicação e aprovação da entrega.'
  },
  {
    q: 'O que acontece em caso de descumprimento ou atraso na entrega?',
    a: 'Caso o influenciador não entregue no prazo combinado ou o conteúdo esteja fora do briefing, a empresa pode abrir uma Disputa de Escrow. Nossa equipe de mediação audita o histórico e, caso procedente, reembolsa 100% do valor à marca.'
  },
  {
    q: 'Qual o prazo de liberação dos valores após a aprovação?',
    a: 'Para pagamentos via Pix, o saldo fica disponível na carteira imediatamente após a liberação. Para cartão de crédito, o repasse obedece ao prazo padrão de liquidação de 1 a 2 dias úteis.'
  },
  {
    q: 'Como funciona o Selo Criptográfico SHA-256 no Mídia Kit?',
    a: 'A cada sincronização oficial com a API do Instagram ou TikTok, geramos um hash criptográfico SHA-256 imutável. Isso comprova para marcas e patrocinadores que os números não foram adulterados por Photoshop.'
  }
];

export default function SupportPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get<SupportTicket[]>('/support/my');
      setTickets(res.data);
    } catch (err: unknown) {
      console.error('Erro ao buscar tickets:', err);
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
          ? 'Disputa de Escrow registrada! Nossa equipe de compliance analisará em prioridade máxima.'
          : 'Chamado aberto com sucesso! Responderemos em breve.'
      );
      
      setForm({ subject: '', message: '', category: 'SUPPORT', contractRef: '' });
      fetchTickets();
      setActiveTab('history');
    } catch (err: unknown) {
      toast.error('Erro ao enviar chamado. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const isDark = theme === 'dark';

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'DISPUTE':
        return { label: 'Disputa Escrow', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: ShieldAlert };
      case 'BILLING':
        return { label: 'Financeiro / Pagamento', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CreditCard };
      case 'BUG':
        return { label: 'Erro Técnico', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Bug };
      case 'FEATURE':
        return { label: 'Sugestão', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: Sparkles };
      default:
        return { label: 'Suporte de Conta', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: LifeBuoy };
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Header com Branding SafePay */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-500 font-black text-[11px] tracking-widest uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            InfluNext SafePay & Helpdesk
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-current tracking-tighter">
            Central de Suporte & <span className="text-orange-500">Disputas</span>
          </h1>
          <p className="text-zinc-400 text-xs font-semibold">
            Mediação de contratos sob custódia, suporte técnico e atendimento prioritário.
          </p>
        </div>

        {/* Tabs de Navegação Rápida */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'ticket' 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Abrir Chamado
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'history' 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Meus Chamados
            {tickets.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                {tickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1 ${
              activeTab === 'faq' 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            FAQ SafePay
          </button>
        </div>
      </header>

      {/* Conteúdo da Tab Selecionada */}
      {activeTab === 'ticket' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Formulário Principal */}
          <section className="lg:col-span-2 space-y-6">
            <form 
              onSubmit={handleSubmit} 
              className={`border rounded-3xl p-8 md:p-10 space-y-6 shadow-xl relative overflow-hidden transition-all ${
                isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-zinc-200 shadow-md'
              }`}
            >
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Tipo de Solicitação / Categoria
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'SUPPORT', label: 'Suporte Geral', icon: LifeBuoy },
                    { id: 'DISPUTE', label: 'Disputa de Escrow', icon: ShieldAlert },
                    { id: 'BILLING', label: 'Financeiro / Pagamento', icon: CreditCard },
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
                        className={`flex items-center gap-2 p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-sm'
                            : isDark
                            ? 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/20'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-500' : 'text-zinc-400'}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alerta contextual se for DISPUTA de Escrow */}
              {form.category === 'DISPUTE' && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" />
                    Protocolo de Mediação SafePay Ativado
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    Ao registrar uma disputa, os fundos sob custódia permanecem 100% bloqueados. Nossa equipe de compliance entrará em contato em até <strong>24 horas úteis</strong> solicitando prints e comprovantes para deliberação imparcial.
                  </p>
                  <div className="pt-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400">ID ou Título do Contrato Contestado</label>
                    <Input 
                      placeholder="Ex: Campanha Lançamento Reels (ou #contract-id)"
                      value={form.contractRef}
                      onChange={e => setForm({ ...form, contractRef: e.target.value })}
                      className="mt-1 bg-black/40 border-rose-500/30 text-xs text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Assunto Resumido
                </label>
                <Input 
                  placeholder="Ex: Dúvida sobre liberação de saldo PIX / Solicitação de revisão"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className={`h-12 text-xs font-semibold ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Mensagem Detalhada
                </label>
                <textarea 
                  placeholder="Explique detalhadamente sua solicitação para agilizar o atendimento..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className={`w-full border rounded-2xl p-4 text-xs font-medium min-h-[160px] outline-none transition-all resize-none ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-500 focus:bg-white/10' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white'
                  }`}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSending}
                className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSending ? 'Processando Chamado...' : (
                  <>
                    <span>Enviar Chamado de Suporte</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </section>

          {/* Sidebar com Garantias e Informações Rápidas */}
          <aside className="space-y-6">
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-zinc-950/60 border-white/10' : 'bg-white border-zinc-200 shadow-md'
            }`}>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-500">
                <Zap className="w-4 h-4" />
                SLA de Atendimento
              </div>
              <ul className="space-y-3 text-xs text-zinc-400">
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span><strong>Disputas de Escrow:</strong> Resposta inicial em até 24h úteis.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Dúvidas Financeiras:</strong> Suporte especializado em pagamentos Mercado Pago / Stripe.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Proteção Contratual:</strong> 100% de custódia protegida até a entrega validada.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-950/40 via-zinc-900 to-black border border-orange-500/20 space-y-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Precisa de suporte rápido?
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Consulte nossa central de respostas rápidas ou acesse nosso FAQ integrado para tirar dúvidas sobre Pix, contratos e taxas.
              </p>
              <Button 
                variant="outline"
                onClick={() => setActiveTab('faq')}
                className="w-full text-xs font-bold border-white/10 hover:border-orange-500 text-white rounded-xl"
              >
                Ver Perguntas Frequentes
              </Button>
            </div>
          </aside>

        </div>
      )}

      {/* Tab: Histórico de Chamados */}
      {activeTab === 'history' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-current">Histórico de Chamados & Disputas</h2>
            <Button 
              size="sm" 
              onClick={() => setActiveTab('ticket')}
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl"
            >
              + Novo Chamado
            </Button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-3xl" />)}
              </div>
            ) : tickets.length > 0 ? (
              tickets.map((t) => {
                const badge = getCategoryBadge(t.category);
                const BadgeIcon = badge.icon;
                return (
                  <div 
                    key={t.id} 
                    className={`p-6 border rounded-3xl group hover:border-orange-500/30 transition-all shadow-sm space-y-3 ${
                      isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-zinc-200 shadow-md'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                          t.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {t.status === 'OPEN' ? 'Em Aberto / Em Análise' : 'Resolvido'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono font-bold text-zinc-500">
                        Protocolo #{t.id.slice(0, 8)}
                      </p>
                    </div>

                    <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                      {t.subject}
                    </h4>
                    <p className={`text-xs whitespace-pre-line leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}>
                      {t.message}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className={`py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center space-y-4 text-center ${
                isDark ? 'border-white/10 bg-black/20' : 'border-zinc-200 bg-white'
              }`}>
                <LifeBuoy className="w-12 h-12 text-zinc-600" />
                <div className="space-y-1">
                  <p className="text-sm font-black text-current">Nenhum chamado aberto no momento</p>
                  <p className="text-xs text-zinc-500">Quando você registrar uma dúvida ou disputa, ela aparecerá listada aqui.</p>
                </div>
                <Button 
                  onClick={() => setActiveTab('ticket')}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl"
                >
                  Abrir Meu Primeiro Chamado
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab: FAQ SafePay */}
      {activeTab === 'faq' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-current">Perguntas Frequentes — SafePay & Plataforma</h2>
            <p className="text-xs text-zinc-400">Tire dúvidas imediatas sobre pagamentos, custódia e regras da comunidade.</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className={`border rounded-2xl overflow-hidden transition-all ${
                    isDark ? 'bg-[#0b0c10] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                  >
                    <span className="text-xs font-black text-current">{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-orange-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-white/5">
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

