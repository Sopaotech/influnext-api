'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle,
  Clock,
  Sparkles,
  Search,
  ChevronUp,
  ChevronDown,
  Target,
  Mic
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  isDone: boolean;
  fromAI: boolean;
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Memoize initial date calculation
  const initialDate = React.useMemo(() => {
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    if (yearParam && monthParam) {
      return new Date(parseInt(yearParam), parseInt(monthParam), 1);
    }
    return new Date();
  }, [searchParams]);

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Update local state ONLY when initialDate (derived from URL) actually changes
  useEffect(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  const updateUrl = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', date.getFullYear().toString());
    params.set('month', date.getMonth().toString());
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get<Task[]>('/tasks');
      setTasks(res.data);
    } catch (err) {
      toast.error('Erro ao carregar tarefas do calendário.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    updateUrl(newDate);
  };
  
  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    updateUrl(newDate);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const numDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    days.push(i);
  }

  const getTasksForDay = (day: number) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.scheduledDate);
      return taskDate.getDate() === day && 
             taskDate.getMonth() === month && 
             taskDate.getFullYear() === year;
    });
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/[0.03] pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
             <div className="h-1 w-8 bg-purple-600 rounded-full" />
             <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Content_Strategy_Engine</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
            Calendário de <span className="text-purple-600">Conteúdo</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 w-full md:w-96 focus-within:border-purple-300 transition-all duration-500 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar tarefa estratégica..." 
            className="bg-transparent border-none focus:outline-none text-[11px] text-slate-600 w-full placeholder:text-slate-300 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden group hover:border-purple-200 transition-all duration-500 shadow-sm">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {monthNames[month]} <span className="text-slate-300 ml-1">{year}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  setSelectedDay(today.getDate());
                  updateUrl(today);
                  toast.info(`Retornando para ${monthNames[today.getMonth()]}...`);
                }} 
                className="px-6 py-2 bg-slate-900 hover:bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-slate-900/10"
              >
                {monthNames[new Date().getMonth()]}
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dayTasks = day ? getTasksForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              
              return (
                <div 
                  key={idx} 
                  className={`min-h-[120px] p-3 border-r border-b border-slate-50 transition-colors group relative
                    ${day ? 'hover:bg-slate-50/50' : 'bg-slate-50/30'}
                  `}
                >
                  {day && (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${isToday ? 'bg-purple-500 text-white w-6 h-6 flex items-center justify-center rounded-lg' : 'text-zinc-500'}`}>
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayTasks.map(t => (
                          <div 
                            key={t.id} 
                            className={`px-2 py-1 rounded-md text-[9px] font-bold truncate flex items-center gap-1.5
                              ${t.isDone 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : t.fromAI 
                                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                  : 'bg-zinc-800/50 text-zinc-400 border border-white/5'}
                            `}
                          >
                            {t.isDone ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5 opacity-50" />}
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0d0b1a] border border-white/[0.05] rounded-[2rem] p-8 space-y-8 h-fit">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
               <Sparkles className="w-4 h-4 text-purple-500" /> Navegação Rápida
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
               {[
                 { label: 'Hoje', id: 'today' },
                 { label: 'Amanhã', id: 'tomorrow' },
                 { label: 'Próximos', id: 'upcoming' }
               ].map((tab) => (
                 <button 
                   key={tab.id}
                   onClick={() => {
                     const date = new Date();
                     if (tab.id === 'tomorrow') date.setDate(date.getDate() + 1);
                     setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
                     setSelectedDay(date.getDate());
                     updateUrl(date);
                   }}
                   className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${
                     (tab.id === 'today' && selectedDay === new Date().getDate()) ||
                     (tab.id === 'tomorrow' && selectedDay === new Date().getDate() + 1)
                       ? 'bg-purple-600 border-purple-500 text-white'
                       : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300'
                   }`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.04]">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-600" /> {selectedDay ? `Tarefas: ${selectedDay}/${month + 1}` : 'Próximos Passos'}
               </h3>
               <div className="space-y-4">
                  {(selectedDay ? getTasksForDay(selectedDay) : tasks.filter(t => !t.isDone).slice(0, 5)).map(t => (
                    <div key={t.id} className="group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {t.isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className={`text-[11px] font-bold transition-colors line-clamp-1 ${t.isDone ? 'text-zinc-600 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                            {t.title}
                          </p>
                          <p className="text-[9px] text-zinc-600 font-medium">
                            {new Date(t.scheduledDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(selectedDay ? getTasksForDay(selectedDay).length : tasks.filter(t => !t.isDone).length) === 0 && (
                    <div className="text-center py-6">
                      <p className="text-[10px] text-zinc-600 font-bold italic">Nenhuma tarefa encontrada!</p>
                    </div>
                  )}
               </div>
            </div>

            <button className="w-full py-3 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-zinc-300 text-[10px] font-black uppercase rounded-xl transition-all">
              Criar Nova Tarefa
            </button>

            {/* AI Assistant Command */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
               <div className="flex items-center gap-2 text-[9px] font-black text-purple-600 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Assistente_Estratégico
               </div>
               <div className="relative group">
                  <input 
                    type="text"
                    placeholder="Agendar post dia 10 sobre..."
                    className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:outline-none focus:border-purple-300 focus:bg-white transition-all placeholder:text-slate-400 font-sans pr-12 shadow-sm"
                    onKeyDown={async (e) => {
                       if (e.key === 'Enter') {
                          const command = (e.target as HTMLInputElement).value;
                          if (!command) return;
                          
                          const id = toast.loading('✦ Mentor analisando comando estrategicamente...');
                          try {
                             await api.post('/tasks/process-command', { command });
                             toast.success('✦ Inteligência Aplicada! Tarefa adicionada ao cronograma.', { id });
                             (e.target as HTMLInputElement).value = '';
                             fetchTasks(); 
                          } catch (err: any) {
                             toast.error(err.response?.data?.error || 'Não consegui processar esse comando agora.', { id });
                          }
                       }
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                     <Mic className="w-4 h-4 text-purple-500 cursor-pointer hover:scale-110 transition-transform" />
                     <span className="text-[8px] font-black text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">Enter</span>
                  </div>
               </div>
               <p className="text-[8px] text-slate-400 font-medium italic">Ex: "Adicionar vídeo dia 15", "Mudar live para amanhã"</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-900/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-12 h-12 text-white" />
             </div>
            <h4 className="text-[10px] font-black text-purple-200 uppercase tracking-widest mb-6 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Meta Mensal de Conteúdo
            </h4>
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Progresso Total</span>
                  <span className="text-2xl font-black text-white italic">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.isDone).length / tasks.length) * 100) : 0}%
                  </span>
               </div>
               <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.isDone).length / tasks.length) * 100 : 0}%` }}
                  />
               </div>
               <p className="text-[10px] text-purple-100/60 font-bold leading-relaxed">
                 Você concluiu {tasks.filter(t => t.isDone).length} de {tasks.length} entregas estratégicas planejadas. Mantenha a constância!
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#050508] text-zinc-500 font-black uppercase text-[10px] tracking-widest">
         ✦ Inicializando Motor Estratégico...
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}
