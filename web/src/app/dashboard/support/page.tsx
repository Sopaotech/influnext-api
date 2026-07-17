'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { LifeBuoy, Send, Clock, CheckCircle2, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

export default function SupportPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'SUPPORT' });

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

  const isDark = theme === 'dark';

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-orange-400 font-black text-[10px] tracking-widest uppercase mb-1">
          <LifeBuoy className="w-4 h-4" />
          Central de Ajuda & Reporte
        </div>
        <h1 className="text-4xl font-black text-current tracking-tighter">Como podemos <span className="text-orange-400">ajudar?</span></h1>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">Relate bugs, sugira melhorias ou peça suporte técnico.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Formulário de Abertura */}
        <section className="space-y-6">
           <form 
             onSubmit={handleSubmit} 
             className={`border rounded-[2.5rem] p-10 space-y-8 shadow-sm relative overflow-hidden group hover:border-orange-500/25 transition-all ${
               isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-md shadow-zinc-100/50'
             }`}
           >
              <div className="absolute top-0 right-0 p-6 opacity-5">
                 <MessageSquare className="w-20 h-20 text-orange-500" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Categoria</label>
                  <select 
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-4 text-xs font-black outline-none transition-all appearance-none cursor-pointer [color-scheme:dark] ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white focus:border-orange-300 bg-[#050508]' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 focus:border-orange-450 bg-white'
                    }`}
                  >
                     <option value="SUPPORT" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>Suporte de Conta</option>
                     <option value="BUG" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>Relatar um Erro Técnico</option>
                     <option value="FEATURE" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>Sugestão de Evolução</option>
                  </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Assunto</label>
                  <Input 
                    placeholder="Como podemos resumir seu pedido?"
                    value={form.subject}
                    onChange={e => setForm({...form, subject: e.target.value})}
                    className={`h-12 text-xs font-bold focus:border-orange-200 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-450 focus:bg-white focus:border-orange-450'
                    }`}
                  />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-zinc-500">Mensagem Detalhada</label>
                  <textarea 
                    placeholder="Descreva detalhadamente sua necessidade para que nosso time possa agir rápido..."
                    value={form.message}
                    onChange={e => setForm({...form, message: e.target.value})}
                    className={`w-full border rounded-2xl px-5 py-4 text-xs font-medium min-h-[180px] outline-none transition-all resize-none ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-200 focus:bg-white/10' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-450 focus:bg-white focus:border-orange-450'
                    }`}
                  />
              </div>

              <Button 
                type="submit" 
                disabled={isSending}
                className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl animate-in fade-in"
              >
                {isSending ? 'Enviando...' : 'Abrir Chamado'}
                <Send className="w-3.5 h-3.5 ml-2" />
              </Button>
           </form>
        </section>

        {/* Histórico de Chamados */}
        <section className="space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Meus Chamados</h3>
           <div className="space-y-8 animate-in fade-in">
            <div className="space-y-2">
               <h2 className="text-2xl font-black text-current tracking-tight">Seus Chamados</h2>
               <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Acompanhe o status e as respostas do suporte.</p>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                   {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
                </div>
              ) : tickets.length > 0 ? tickets.map((t) => (
                <div 
                  key={t.id} 
                  className={`p-6 border rounded-3xl group hover:border-orange-500/25 transition-all shadow-sm ${
                    isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-md shadow-zinc-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                     <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {t.status === 'OPEN' ? 'Em Aberto' : 'Resolvido'}
                     </span>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Ref: #{t.id.slice(-6)}</p>
                  </div>
                  <h4 className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-zinc-800'}`}>{t.subject}</h4>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-650'}`}>{t.message}</p>
                </div>
              )) : (
                <div className={`py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center space-y-4 ${
                  isDark ? 'border-white/5 bg-black/10' : 'border-zinc-250 bg-white shadow-sm'
                }`}>
                  <LifeBuoy className="w-10 h-10 text-zinc-400" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nenhum chamado aberto</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
