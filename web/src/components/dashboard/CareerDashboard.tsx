"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Sparkles,
  Briefcase as BriefingIcon,
  MessageSquare
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  scheduledDate: string;
}

interface CareerDashboardProps {
  influencer: any;
}

export function CareerDashboard({ influencer }: CareerDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [aiName, setAiName] = useState<string>('Seu Assistente');
  const [isEditingName, setIsEditingName] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    const savedName = localStorage.getItem('influnext_ai_name');
    if (savedName) setAiName(savedName);
    fetchCareerData();
  }, [influencer.id]);

  const saveAiName = (name: string) => {
    if (!name.trim()) {
      setIsEditingName(false);
      return;
    }
    setAiName(name);
    localStorage.setItem('influnext_ai_name', name);
    setIsEditingName(false);
    toast.success(`✦ Sua IA agora se chama ${name}!`);
  };

  const fetchCareerData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, insightRes, connRes] = await Promise.all([
        api.get(`/influencers/tasks`),
        api.get(`/influencers/daily-insight`),
        api.get(`/integrations/connected`).catch(() => ({ data: { platforms: [] } }))
      ]);
      setTasks(tasksRes.data);
      setInsight(insightRes.data.insight);
      setConnectedPlatforms(connRes.data.platforms || []);
    } catch (err) {
      console.error('Erro ao carregar dados de carreira:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/influencers/tasks/${taskId}`, { isDone: !currentStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, isDone: !currentStatus } : t));
      if (!currentStatus) toast.success('✦ Missão cumprida!');
    } catch (err) {
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  const getObjectiveLabel = (obj: string) => {
    const map: any = {
      'SALES': 'Foco em Vendas',
      'FAME': 'Foco em Crescimento',
      'CONTRACTS': 'Foco em Marcas',
      'AUTHORITY': 'Foco em Autoridade'
    };
    return map[obj] || 'Crescimento Geral';
  };

  const isDark = influencer.theme === 'dark';

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">

      {/* Neural Connection Alert */}
      {connectedPlatforms.length < 2 && (
        <div 
          className={`relative overflow-hidden p-5 rounded-[2rem] border backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700 ${
            isDark 
              ? 'bg-black/40 border-white/10' 
              : 'bg-white/50 border-slate-200 shadow-slate-100/50'
          }`}
        >
          {/* Subtle neural background glow */}
          <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? 'from-orange-500/10 to-pink-500/10' : 'from-orange-500/5 to-amber-500/5'} opacity-30 pointer-events-none`} />
          
          <div className="flex items-center gap-3 text-left relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : 'bg-orange-500/10 border border-orange-500/20 text-orange-650'}`}>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                Alinhamento de Rede Neural
              </h4>
              <p className={`text-xs font-bold max-w-xl ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {connectedPlatforms.length === 0 ? (
                  "Conecte suas redes sociais para ativar o monitoramento em tempo real, sugestões personalizadas de nicho e seu InfluScore."
                ) : connectedPlatforms.includes('INSTAGRAM') ? (
                  "Instagram Conectado! Sincronize também o seu TikTok para consolidar seus dados e amplificar seu alcance em 40%."
                ) : (
                  "TikTok Conectado! Sincronize também seu Instagram para maximizar seu score de autoridade e atrair mais marcas."
                )}
              </p>
            </div>
          </div>
          
          <Link href="/dashboard/settings" className="w-full md:w-auto relative z-10">
            <button className={`w-full md:w-auto px-6 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-lg ${isDark ? 'bg-white text-slate-950 hover:bg-zinc-200' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
              {connectedPlatforms.length === 0 ? "Conectar Redes" : connectedPlatforms.includes('INSTAGRAM') ? "Conectar TikTok" : "Conectar Instagram"}
            </button>
          </Link>
        </div>
      )}
      
      {/* IA Empresária Insight - Glass */}
      <section 
        className={`relative overflow-hidden p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border shadow-sm group transition-all duration-300 ${
          isDark 
            ? 'bg-black/30 border-white/5 text-white' 
            : 'bg-white border-slate-200 text-slate-900 shadow-md shadow-slate-100'
        }`}
        style={{ backdropFilter: 'blur(30px)' }}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
          <Zap size={150} className={isDark ? 'text-white' : 'text-slate-900'} />
        </div>
        <div className="relative z-10 space-y-6 md:space-y-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${isDark ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'}`}>
              <Sparkles size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
                Inteligência Estratégica da IA
              </span>
              <div className="flex items-center justify-center md:justify-start gap-2">
                 <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{aiName}</span>
                 <button 
                  onClick={() => setIsEditingName(true)}
                  className={`text-[8px] font-bold uppercase tracking-widest transition-all ${isDark ? 'text-zinc-450 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  [Editar]
                </button>
              </div>
            </div>
          </div>
          
          {isEditingName && (
            <div className={`flex gap-2 animate-in fade-in zoom-in-95 p-2 rounded-2xl border w-max mx-auto md:mx-0 ${isDark ? 'bg-black/40 border-white/5' : 'bg-white/5 border-slate-200'}`}>
              <input 
                autoFocus
                className={`border rounded-xl px-4 py-2 text-xs font-bold focus:outline-none w-48 ${isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-white/10 border-slate-200 text-slate-900'}`}
                placeholder="Nome da IA..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveAiName((e.target as HTMLInputElement).value);
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                onBlur={(e) => saveAiName(e.target.value)}
              />
            </div>
          )}
          
          <h2 className={`text-xl md:text-4xl font-black tracking-tighter leading-tight max-w-3xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
            "{insight || 'Analisando o mercado para você... preparando o próximo passo.'}"
          </h2>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
            <div className={`px-4 md:px-5 py-2 md:py-2.5 border rounded-full flex items-center gap-2 md:gap-3 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-orange-50/5 border-orange-500/20'}`}>
              <Target size={12} className={isDark ? 'text-white' : 'text-orange-650'} />
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/80' : 'text-orange-600'}`}>
                {getObjectiveLabel(influencer.careerObjective)}
              </span>
            </div>
            <div className={`px-4 md:px-5 py-2 md:py-2.5 border rounded-full flex items-center gap-2 md:gap-3 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-orange-50/5 border-orange-500/20'}`}>
              <TrendingUp size={12} className={isDark ? 'text-white' : 'text-orange-650'} />
              <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/80' : 'text-orange-600'}`}>
                InfluScore: {influencer.influScore}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        
        {/* Daily Tasks / Calendar - Glass */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <Calendar className="w-4 h-4" /> Missões Diárias
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">
                {tasks.filter(t => t.isDone).length}/{tasks.length} Concluídas
              </span>
              <div className="relative group">
                <button 
                  onClick={async () => {
                    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                      toast.error('Seu navegador não suporta reconhecimento de voz.');
                      return;
                    }
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    const recognition = new SpeechRecognition();
                    recognition.lang = 'pt-BR';
                    recognition.start();
                    toast('🎙️ Ouvindo... Fale sua tarefa.');

                    recognition.onresult = async (event: any) => {
                      const transcript = event.results[0][0].transcript;
                      toast(`Processando: "${transcript}"...`);
                      try {
                        await api.post('/influencers/tasks/voice', { text: transcript });
                        toast.success('Tarefa criada com sucesso pela InfluNext!');
                        fetchCareerData(); // Recarrega as tarefas
                      } catch {
                        toast.error('Erro ao processar áudio.');
                      }
                    };
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-xl relative ${isDark ? 'bg-white text-slate-950 hover:bg-orange-600 hover:text-white' : 'bg-slate-900 text-white hover:bg-orange-600'}`}
                >
                  <div className={`absolute inset-0 rounded-full ${isDark ? 'bg-orange-500/20' : 'bg-orange-500/10'} group-hover:animate-ping`}></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </button>
                <div 
                  className={`absolute bottom-full right-0 mb-3 w-64 p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest leading-relaxed shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 ${isDark ? 'bg-zinc-950/95 border-white/10 text-white/90' : 'bg-white border-slate-200 text-slate-900 shadow-md shadow-slate-100/50'}`}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  🎙️ Comando de Voz / IA
                  <div className="mt-2 text-[8px] font-bold text-zinc-500 lowercase normal-case tracking-normal leading-relaxed">
                    Clique e fale para agendar compromissos. <br className="my-1"/>
                    <strong>Exemplo:</strong> "Agendar reunião amanhã às 16h com Marca X" ou "Marcar tarefa tal..."
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {tasks.length === 0 && !isLoading && (
              <div className={`py-12 md:py-20 px-6 rounded-[2.5rem] md:rounded-[3rem] border flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'}`}>
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border ${isDark ? 'bg-white/5 text-zinc-500 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                  <CheckCircle2 size={32} />
                </div>
                <p className={`font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em] ${isDark ? 'text-zinc-350' : 'text-slate-500'}`}>Todas as missões concluídas. <br />Você está no controle total.</p>
              </div>
            )}

            {tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id, task.isDone)}
                className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                  task.isDone 
                    ? (isDark ? 'bg-white/[0.02] border-white/5 opacity-30' : 'bg-slate-50 border-slate-100 opacity-40') 
                    : (isDark ? 'bg-black/35 border-white/5 hover:bg-black/50 text-white shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900 shadow-sm shadow-slate-100/50')
                }`}
                style={{ backdropFilter: 'blur(20px)' }}
              >
                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                  <div className={`transition-colors flex-shrink-0 ${task.isDone ? (isDark ? 'text-zinc-600' : 'text-slate-400') : (isDark ? 'text-zinc-400 group-hover:text-white' : 'text-slate-300 group-hover:text-orange-600')}`}>
                    {task.isDone ? <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" /> : <Circle className="w-6 h-6 md:w-7 md:h-7" />}
                  </div>
                  <div className="text-left truncate">
                    <p className={`font-black text-[10px] md:text-sm uppercase tracking-[0.2em] truncate ${task.isDone ? 'line-through text-slate-400' : (isDark ? 'text-white' : 'text-slate-900')}`}>
                      {task.title}
                    </p>
                    <p className={`text-[8px] md:text-[10px] font-bold uppercase mt-0.5 truncate ${isDark ? 'text-zinc-350 font-medium' : 'text-slate-500'}`}>
                      {task.description || 'Tarefa estratégica da IA'}
                    </p>
                  </div>
                </div>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all shadow-sm flex-shrink-0 ${isDark ? 'bg-white/5 text-zinc-400 group-hover:bg-white group-hover:text-black' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-600 group-hover:text-white'}`}>
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Sidebar - Glass */}
        <div className="space-y-10">
          
          <div 
            className={`p-8 rounded-[3rem] border space-y-8 shadow-sm group cursor-pointer transition-all ${isDark ? 'bg-black/30 border-white/5 hover:bg-black/45' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-md shadow-slate-100/50'}`}
            style={{ backdropFilter: 'blur(20px)' }}
          >
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${isDark ? 'bg-white text-slate-950' : 'bg-orange-600 text-white shadow-orange-500/20'}`}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>Consultoria</p>
                  <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-950'}`}>Conversar com {aiName}</p>
                </div>
             </div>
             <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-650'}`}>
               Precisa de ajuda com roteiros, tendências ou sua próxima grande ideia? O(a) {aiName} está pronto(a) para te ajudar a crescer.
             </p>
             <Link href="/dashboard/workspace" className="w-full block">
                <button className={`w-full rounded-[1.5rem] font-black h-14 transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl ${isDark ? 'bg-white text-slate-950 hover:bg-zinc-200' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                  ABRIR CONSULTOR
                </button>
             </Link>
          </div>

          <div 
            className={`p-10 rounded-[3rem] border space-y-8 shadow-sm ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'}`}
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>Próximo Nível</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className={`font-black text-3xl tracking-tighter ${isDark ? 'text-white' : 'text-slate-950'}`}>PRATA</span>
                <span className={`text-[10px] font-black ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>340 / 500</span>
              </div>
              <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <div className={`h-full w-[68%] rounded-full shadow-sm ${isDark ? 'bg-white' : 'bg-orange-600'}`} />
              </div>
            </div>
            <p className={`text-[10px] font-bold leading-relaxed uppercase tracking-widest ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>
              Continue realizando suas missões diárias para liberar a verificação.
            </p>
          </div>

        </div>
      </div>
    </div>

  );
}
