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
    <div className="space-y-8 animate-in fade-in duration-1000">
      
      {/* IA Empresária Insight - Glass */}
      <section 
        className="relative overflow-hidden p-6 md:p-12 rounded-[2.5rem] md:rounded-[3rem] bg-white/10 border border-white/20 shadow-sm group"
        style={{ backdropFilter: 'blur(30px)' }}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
          <Zap size={150} className="text-slate-900" />
        </div>
        
        <div className="relative z-10 space-y-6 md:space-y-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
              <Sparkles size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                AI Strategic Intelligence
              </span>
              <div className="flex items-center justify-center md:justify-start gap-2">
                 <span className="text-xs font-bold text-slate-900">{aiName}</span>
                 <button 
                  onClick={() => setIsEditingName(true)}
                  className="text-[8px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-all"
                >
                  [Edit]
                </button>
              </div>
            </div>
          </div>
          
          {isEditingName && (
            <div className="flex gap-2 animate-in fade-in zoom-in-95 bg-white/5 p-2 rounded-2xl border border-white/10 w-max mx-auto md:mx-0">
              <input 
                autoFocus
                className="bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 focus:outline-none w-48"
                placeholder="Nome da IA..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveAiName((e.target as HTMLInputElement).value);
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                onBlur={(e) => saveAiName(e.target.value)}
              />
            </div>
          )}
          
          <h2 className="text-xl md:text-4xl font-black tracking-tighter text-slate-900 leading-tight max-w-3xl">
            "{insight || 'Analizando o mercado para você... preparando o próximo passo.'}"
          </h2>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
            <div className="px-4 md:px-5 py-2 md:py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 md:gap-3">
              <Target size={12} className="text-slate-900" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600">
                {getObjectiveLabel(influencer.careerObjective)}
              </span>
            </div>
            <div className="px-4 md:px-5 py-2 md:py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 md:gap-3">
              <TrendingUp size={12} className="text-slate-900" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600">
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
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
              <Calendar className="w-4 h-4" /> Daily Missions
            </h3>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
              {tasks.filter(t => t.isDone).length}/{tasks.length} Completed
            </span>
          </div>

          <div className="space-y-3 md:space-y-4">
            {tasks.length === 0 && !isLoading && (
              <div className="py-12 md:py-20 px-6 rounded-[2.5rem] md:rounded-[3rem] border border-white/20 bg-white/5 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-full flex items-center justify-center text-slate-300 border border-white/10">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.3em]">All objectives secured. <br />You are in full control.</p>
              </div>
            )}

            {tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => toggleTask(task.id, task.isDone)}
                className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 transition-all cursor-pointer flex items-center justify-between gap-4 group ${task.isDone ? 'bg-white/5 opacity-40' : 'bg-white/10 hover:bg-white/20 shadow-sm'}`}
                style={{ backdropFilter: 'blur(20px)' }}
              >
                <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                  <div className={`transition-colors flex-shrink-0 ${task.isDone ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-900'}`}>
                    {task.isDone ? <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" /> : <Circle className="w-6 h-6 md:w-7 md:h-7" />}
                  </div>
                  <div className="text-left truncate">
                    <p className={`font-black text-[10px] md:text-sm uppercase tracking-[0.2em] truncate ${task.isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </p>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-0.5 truncate">
                      {task.description || 'Tarefa estratégica da IA'}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm flex-shrink-0">
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Career Sidebar - Glass */}
        <div className="space-y-10">
          
          <div 
            className="p-8 rounded-[3rem] bg-white/10 border border-white/20 space-y-8 shadow-sm group cursor-pointer hover:bg-white/20 transition-all"
            style={{ backdropFilter: 'blur(20px)' }}
          >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                 <Sparkles size={20} />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Consultancy</p>
                 <p className="font-bold text-sm text-slate-900">Talk to {aiName}</p>
               </div>
             </div>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">
               Need help with scripts, trends or your next big idea? {aiName} is ready to help you grow.
             </p>
             <button className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-[1.5rem] font-black h-14 transition-all uppercase tracking-[0.3em] text-[10px] shadow-xl">
               OPEN ADVISOR
             </button>
          </div>

          <div 
            className="p-10 rounded-[3rem] bg-white/10 border border-white/20 space-y-8 shadow-sm"
            style={{ backdropFilter: 'blur(20px)' }}
          >
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Next Level</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="font-black text-3xl text-slate-900 tracking-tighter">SILVER</span>
                <span className="text-[10px] font-black text-slate-400">340 / 500</span>
              </div>
              <div className="h-2 w-full bg-slate-900/5 rounded-full overflow-hidden">
                <div className="h-full bg-slate-900 w-[68%] rounded-full shadow-sm" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              Continue your daily missions to unlock verification.
            </p>
          </div>

        </div>
      </div>
    </div>

  );
}
