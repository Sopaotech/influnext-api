'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LifeBuoy, Send, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'SUPPORT' });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/my');
      setTickets(res.data);
    } catch (err) {
      console.error('Erro ao buscar tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) return toast.error('Preencha todos os campos.');
    
    try {
      setIsSending(true);
      await api.post('/support', form);
      toast.success('Chamado aberto com sucesso! Nossa equipe responderá em breve.');
      setForm({ subject: '', message: '', category: 'SUPPORT' });
      fetchTickets();
    } catch (err) {
      toast.error('Erro ao enviar chamado.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-purple-400 font-black text-[10px] tracking-widest uppercase mb-1">
          <LifeBuoy className="w-4 h-4" />
          Central de Ajuda & Reporte
        </div>
        <h1 className="text-3xl font-black text-zinc-100 tracking-tighter">Como podemos <span className="text-purple-500">ajudar?</span></h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Relate bugs, sugira melhorias ou peça suporte técnico.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Formulário de Abertura */}
        <section className="space-y-6">
           <form onSubmit={handleSubmit} className="bg-slate-950 border border-purple-500/10 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                 <MessageSquare className="w-20 h-20 text-purple-500" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Categoria</label>
                  <select 
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full bg-slate-900 border border-white/[0.05] rounded-xl px-4 py-4 text-xs font-black text-white outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                  >
                     <option value="SUPPORT">Suporte de Conta</option>
                     <option value="BUG">Relatar um Erro Técnico</option>
                     <option value="FEATURE">Sugestão de Evolução</option>
                  </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Assunto</label>
                  <Input 
                    placeholder="Como podemos resumir seu pedido?"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className="bg-slate-50 border-slate-100 h-12 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-purple-200"
                  />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400">Mensagem Detalhada</label>
                  <textarea 
                    placeholder="Descreva detalhadamente sua necessidade para que nosso time possa agir rápido..."
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-medium text-slate-900 min-h-[180px] outline-none focus:border-purple-200 transition-all placeholder:text-slate-400 resize-none"
                  />
              </div>

              <Button 
                type="submit" 
                disabled={isSending}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl"
              >
                {isSending ? 'Enviando...' : 'Abrir Chamado'}
                <Send className="w-3.5 h-3.5 ml-2" />
              </Button>
           </form>
        </section>

        {/* Histórico de Chamados */}
        <section className="space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Meus Chamados</h3>
           <div className="space-y-8">
            <div className="space-y-2">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Seus Chamados</h2>
               <p className="text-slate-500 text-sm font-medium">Acompanhe o status e as respostas do suporte.</p>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                   {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-900/50 rounded-2xl" />)}
                </div>
              ) : tickets.length > 0 ? tickets.map((t) => (
                <div key={t.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-purple-300 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                     <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {t.status === 'OPEN' ? 'Em Aberto' : 'Resolvido'}
                     </span>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ref: #{t.id.slice(-6)}</p>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">{t.subject}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{t.message}</p>
                </div>
              )) : (
                <div className="py-20 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-4">
                  <LifeBuoy className="w-10 h-10 text-slate-200" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum chamado aberto</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
