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
           <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Categoria</label>
                 <select 
                   value={form.category}
                   onChange={e => setForm({...form, category: e.target.value})}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-zinc-200 outline-none focus:border-purple-500/50 transition-all"
                 >
                    <option value="SUPPORT">Suporte Geral</option>
                    <option value="BUG">Relatar um Erro (Bug)</option>
                    <option value="FEATURE">Sugestão de Funcionalidade</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Assunto</label>
                 <Input 
                   placeholder="Ex: Erro ao carregar Media Kit"
                   value={form.subject}
                   onChange={e => setForm({...form, subject: e.target.value})}
                   className="bg-zinc-950 border-zinc-800"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Mensagem Detalhada</label>
                 <textarea 
                   placeholder="Explique o que está acontecendo..."
                   value={form.message}
                   onChange={e => setForm({...form, message: e.target.value})}
                   className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-medium text-zinc-200 min-h-[150px] outline-none focus:border-purple-500/50 transition-all"
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
           <div className="space-y-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                   {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-900/50 rounded-2xl" />)}
                </div>
              ) : tickets.length > 0 ? (
                tickets.map((t: any) => (
                   <div key={t.id} className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{t.category}</span>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${t.status === 'OPEN' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {t.status}
                         </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-100">{t.subject}</h4>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-bold uppercase">
                         <Clock className="w-3 h-3" /> {new Date(t.createdAt).toLocaleDateString()}
                      </div>
                   </div>
                ))
              ) : (
                <div className="text-center py-20 bg-zinc-900/20 border-2 border-dashed border-zinc-900 rounded-3xl">
                   <MessageSquare className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                   <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Nenhum chamado aberto</p>
                </div>
              )}
           </div>
        </section>

      </div>

    </div>
  );
}
