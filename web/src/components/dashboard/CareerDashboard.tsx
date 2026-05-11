"use client";

import React, { useState, useEffect } from 'react';
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
      const [tasksRes, insightRes] = await Promise.all([
        api.get(`/influencers/tasks`),
        api.get(`/influencers/daily-insight`)
      ]);
      setTasks(tasksRes.data);
      setInsight(insightRes.data.insight);
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* IA Empresária Insight */}
      <section className="relative overflow-hidden p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white border border-slate-200 shadow-sm group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
          <Zap size={120} className="text-purple-600" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white ring-4 ring-white">
                <Sparkles size={14} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Sua parceira <span className="text-purple-600">{aiName}</span> diz:
              </span>
              <button 
                onClick={() => setIsEditingName(true)}
                className="text-[8px] font-black text-slate-300 hover:text-purple-500 uppercase tracking-widest border border-slate-100 px-2 py-0.5 rounded-full transition-all"
              >
                [Renomear]
              </button>
            </div>
          </div>
          
          {isEditingName && (
            <div className="flex gap-2 animate-in fade-in zoom-in-95 bg-slate-50 p-2 rounded-2xl border border-purple-100 w-max">
              <input 
                autoFocus
                className="bg-white border border-purple-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none w-48"
                placeholder="Dê um nome para sua IA..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveAiName((e.target as HTMLInputElement).value);
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                onBlur={(e) => saveAiName(e.target.value)}
              />
              <Button onClick={() => setIsEditingName(false)} variant="ghost" className="text-[10px] font-black uppercase h-auto py-1">OK</Button>
            </div>
          )}
          
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 leading-tight max-w-2xl">
            "{insight || 'Analizando o mercado para você... preparando o próximo passo.'}"
          </h2>

          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-2">
              <Target size={14} className="text-purple-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {getObjectiveLabel(influencer.careerObjective)}
              </span>
            </div>
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                InfluScore: {influencer.influScore}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Daily Tasks / Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Calendar className="text-purple-600" /> SUAS MISSÕES
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {tasks.filter(t => t.isDone).length}/{tasks.length} Completas
            </span>
          </div>

          <div className="space-y-4">
            {tasks.length === 0 && !isLoading && (
              <div className="p-12 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma missão pendente. <br />Você está no controle.</p>
              </div>
            )}

            {tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id, task.isDone)}
                className={`p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-center sm:justify-between gap-4 group ${task.isDone ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-md'}`}
              >
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                  <div className={`transition-colors flex-shrink-0 ${task.isDone ? 'text-emerald-500' : 'text-slate-300 group-hover:text-purple-500'}`}>
                    {task.isDone ? <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" /> : <Circle className="w-6 h-6 md:w-7 md:h-7" />}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className={`font-black text-xs md:text-sm uppercase tracking-widest ${task.isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">
                      {task.description || 'Tarefa estratégica da IA'}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-600 group-hover:text-white transition-all ml-auto sm:ml-0">
                  <ArrowRight className="w-3.5 h-3.5 md:w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Sidebar */}
        <div className="space-y-8">
          
          {/* AI Manager Floating Action - Light Sharp */}
          <div className="p-6 rounded-[2rem] bg-white border border-purple-100 space-y-6 shadow-sm hover:shadow-md transition-all group">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Sparkles size={20} className="text-purple-600" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-purple-600">Sua Mentoria</p>
                 <p className="font-bold text-sm text-slate-900">Conversar com {aiName}</p>
               </div>
             </div>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">
               Dúvidas sobre roteiros, tendências ou sua próxima grande ideia? {aiName} está aqui para ajudar você a crescer.
             </p>
             <Button className="w-full bg-slate-900 text-white hover:bg-purple-600 rounded-xl font-black h-12 transition-colors uppercase tracking-widest text-[10px]">
               ABRIR CONSULTORIA
             </Button>
          </div>

          {/* Quick Metrics */}
          <div className="p-8 rounded-[2rem] bg-white border border-slate-200 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Próximo Nível</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="font-black text-2xl text-slate-800">PRATA</span>
                <span className="text-[10px] font-black text-slate-400">Score 340/500</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 w-[68%] rounded-full" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
              Continue as missões diárias para desbloquear o selo de verificação e atrair marcas maiores.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
