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
  Target,
  Mic,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  isDone: boolean;
  fromAI: boolean;
}

const formatTaskTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours === 12 && minutes === 0) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

function CalendarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Detect theme on mount and monitor changes
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCommandInput(transcript);
      toast.success(`Transcrito: "${transcript}"`);
    };

    recognition.start();
  };

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

  const isDark = theme === 'dark';

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/[0.03] pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
             <div className="h-1 w-8 bg-orange-600 rounded-full" />
             <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em]">Content_Strategy_Engine</span>
          </div>
          <h1 className="text-4xl font-black text-current tracking-tighter leading-none">
            Calendário de <span className="text-orange-400">Conteúdo</span>
          </h1>
        </div>
        <div className={`flex items-center gap-3 border rounded-2xl px-5 py-3 w-full md:w-96 focus-within:border-orange-500/50 transition-all duration-500 shadow-sm ${
          isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200'
        }`}>
          <Search className="w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar tarefa estratégica..." 
            className={`bg-transparent border-none focus:outline-none text-[11px] w-full font-bold ${
              isDark ? 'text-zinc-300 placeholder:text-zinc-650' : 'text-zinc-800 placeholder:text-zinc-400'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className={`border rounded-[2.5rem] overflow-hidden group hover:border-orange-500/20 transition-all duration-500 shadow-sm lg:col-span-3 ${
          isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200'
        }`}>
          <div className={`p-8 border-b flex items-center justify-between ${
            isDark ? 'border-white/5 bg-black/10' : 'border-zinc-200 bg-zinc-50/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                <CalendarIcon className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-800'}`}>
                {monthNames[month]} <span className="text-zinc-500 dark:text-zinc-450 ml-1">{year}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={prevMonth} 
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
                }`}
              >
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
                className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all shadow-md ${
                  isDark 
                    ? 'bg-white text-slate-950 hover:bg-orange-600 hover:text-white' 
                    : 'bg-zinc-100 border border-zinc-250 text-zinc-700 hover:bg-orange-600 hover:text-white hover:border-orange-600'
                }`}
              >
                {monthNames[new Date().getMonth()]}
              </button>
              <button 
                onClick={nextMonth} 
                className={`p-2 rounded-xl transition-colors ${
                  isDark ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-7 border-b ${
            isDark ? 'border-white/5 bg-black/20' : 'border-zinc-200 bg-zinc-50'
          }`}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="py-5 text-center text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
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
                  onClick={() => {
                    if (day) {
                      setSelectedDay(prev => prev === day ? null : day);
                    }
                  }}
                  className={`min-h-[120px] p-3 border-r border-b transition-colors group relative ${
                    isDark ? 'border-white/5' : 'border-zinc-200/80'
                  } ${
                    day 
                      ? (isDark ? 'hover:bg-white/[0.03] cursor-pointer' : 'hover:bg-zinc-50/50 cursor-pointer') 
                      : (isDark ? 'bg-black/10' : 'bg-zinc-50')
                  } ${
                    selectedDay === day 
                      ? (isDark ? 'bg-orange-600/10 border-orange-500/35 ring-1 ring-orange-500/20' : 'bg-orange-50 border-orange-500/40 ring-1 ring-orange-500/10') 
                      : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${
                          isToday 
                            ? 'bg-orange-600 text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-lg' 
                            : 'text-zinc-500 dark:text-zinc-450'
                        }`}>
                          {day}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {dayTasks.map(t => (
                          <div 
                            key={t.id} 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await api.patch(`/tasks/${t.id}/toggle`);
                                setTasks(prev => prev.map(task => task.id === t.id ? res.data : task));
                                toast.success('Status da tarefa atualizado!');
                              } catch (err) {
                                toast.error('Erro ao atualizar status.');
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider truncate flex items-center justify-between gap-1.5 transition-all group/task cursor-pointer ${
                              t.isDone 
                                ? (isDark ? 'bg-emerald-500/20 text-emerald-350 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80') 
                                : t.fromAI 
                                  ? (isDark ? 'bg-orange-500/25 text-orange-100 border border-orange-500/40' : 'bg-orange-50 text-orange-850 border border-orange-200/80')
                                  : (isDark ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/50' : 'bg-zinc-50 border border-zinc-200 text-zinc-700')
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {t.isDone ? <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0 text-emerald-450" /> : <Clock className="w-2.5 h-2.5 flex-shrink-0 opacity-70" />}
                              <span className="truncate flex items-center gap-1.5">
                                {formatTaskTime(t.scheduledDate) && (
                                  <span className="text-orange-400 font-bold bg-orange-500/10 px-1 py-0.5 rounded border border-orange-500/20 text-[8px] flex-shrink-0">{formatTaskTime(t.scheduledDate)}</span>
                                )}
                                <span className="truncate">{t.title}</span>
                              </span>
                            </div>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Deseja excluir esta tarefa?')) {
                                  try {
                                    await api.delete(`/tasks/${t.id}`);
                                    setTasks(prev => prev.filter(task => task.id !== t.id));
                                    toast.success('Tarefa excluída!');
                                  } catch (err) {
                                    toast.error('Erro ao excluir tarefa.');
                                  }
                                }
                              }}
                              className="opacity-0 group-hover/task:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
          <div className={`border rounded-[2rem] p-8 space-y-8 h-fit ${
            isDark ? 'bg-[#131110] border-white/[0.05]' : 'bg-white border-zinc-200 shadow-md shadow-zinc-100'
          }`}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
               <Sparkles className="w-4 h-4 text-orange-500" /> Navegação Rápida
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
               {[
                 { label: 'Hoje', id: 'today', getDate: () => new Date() },
                 { label: 'Amanhã', id: 'tomorrow', getDate: () => {
                     const d = new Date();
                     d.setDate(d.getDate() + 1);
                     return d;
                 } }
               ].map((tab) => {
                 const tabDate = tab.getDate();
                 const isActive = selectedDay === tabDate.getDate() && 
                                  currentDate.getMonth() === tabDate.getMonth() && 
                                  currentDate.getFullYear() === tabDate.getFullYear();
                 return (
                 <button 
                   key={tab.id}
                   onClick={() => {
                     setCurrentDate(new Date(tabDate.getFullYear(), tabDate.getMonth(), 1));
                     setSelectedDay(tabDate.getDate());
                     updateUrl(tabDate);
                   }}
                   className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${
                     isActive
                       ? 'bg-orange-600 border-orange-500 text-white'
                       : (isDark ? 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100')
                   }`}
                 >
                   {tab.label}
                 </button>
                 );
               })}
            </div>

            <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-white/[0.04]' : 'border-zinc-100'}`}>
                <div className="flex items-center justify-between">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-zinc-650" /> {selectedDay ? `Tarefas: ${selectedDay}/${month + 1}` : 'Próximos Passos'}
                   </h3>
                   {selectedDay && (
                     <button 
                       onClick={() => setSelectedDay(null)}
                       className="text-[9px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-wider transition-colors"
                     >
                       Ver Todos
                     </button>
                   )}
                </div>
               <div className="space-y-4">
                  {(selectedDay ? getTasksForDay(selectedDay) : tasks.filter(t => !t.isDone).slice(0, 5)).map(t => (
                    <div 
                      key={t.id} 
                      onClick={async () => {
                        try {
                          const res = await api.patch(`/tasks/${t.id}/toggle`);
                          setTasks(prev => prev.map(task => task.id === t.id ? res.data : task));
                          toast.success('Status da tarefa updated!');
                        } catch (err) {
                          toast.error('Erro ao atualizar status.');
                        }
                      }}
                      className={`group cursor-pointer p-2 rounded-xl transition-all flex items-center justify-between ${
                        isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1 flex-shrink-0">
                          {t.isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-orange-500/50 group-hover:text-orange-400 transition-colors" />
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className={`text-[11px] font-bold transition-colors line-clamp-1 ${
                            t.isDone 
                              ? 'text-zinc-500 line-through' 
                              : (isDark ? 'text-zinc-355 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-950')
                          }`}>
                            {t.title}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-medium flex items-center gap-1.5 flex-wrap">
                            <span>{new Date(t.scheduledDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</span>
                            {formatTaskTime(t.scheduledDate) && (
                              <span className="text-orange-400 font-bold bg-orange-500/10 px-1 py-0.2 rounded border border-orange-500/10 text-[8px]">às {formatTaskTime(t.scheduledDate)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Deseja excluir esta tarefa?')) {
                            try {
                              await api.delete(`/tasks/${t.id}`);
                              setTasks(prev => prev.filter(task => task.id !== t.id));
                              toast.success('Tarefa excluída!');
                            } catch (err) {
                              toast.error('Erro ao excluir tarefa.');
                            }
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/25 rounded transition-all text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(selectedDay ? getTasksForDay(selectedDay).length : tasks.filter(t => !t.isDone).length) === 0 && (
                    <div className="text-center py-6">
                      <p className="text-[10px] text-zinc-500 font-bold italic">Nenhuma tarefa encontrada!</p>
                    </div>
                  )}
               </div>
            </div>

            <button 
              onClick={() => {
                const today = new Date();
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDay || today.getDate()).padStart(2, '0');
                setNewTaskDate(`${year}-${month}-${day}`);
                setShowAddModal(true);
              }}
              className={`w-full py-3 text-[10px] font-black uppercase rounded-xl transition-all shadow-md ${
                isDark 
                  ? 'bg-orange-600/20 border border-orange-500/35 hover:bg-orange-600/40 text-orange-200 shadow-orange-900/10' 
                  : 'bg-orange-50 border border-orange-200 text-orange-850 hover:bg-orange-100 shadow-orange-100/50'
              }`}
            >
              Criar Nova Tarefa
            </button>

            {/* AI Assistant Command */}
            <div className={`pt-4 border-t space-y-3 ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
               <div className="flex items-center gap-2 text-[9px] font-black text-orange-400 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Assistente_Estratégico
               </div>
               <div className="relative group">
                  <input 
                    type="text"
                    placeholder="Agendar post dia 10 sobre..."
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    className={`w-full border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-orange-500/50 transition-all font-sans pr-12 shadow-sm ${
                      isDark 
                        ? 'bg-black/35 border-white/5 text-white placeholder:text-zinc-600' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:bg-white'
                    }`}
                    onKeyDown={async (e) => {
                       if (e.key === 'Enter') {
                          const command = commandInput;
                          if (!command) return;
                          
                          const id = toast.loading('✦ Mentor analisando comando estrategicamente...');
                          try {
                             await api.post('/tasks/process-command', { command });
                             toast.success('✦ Inteligência Aplicada! Tarefa adicionada ao cronograma.', { id });
                             setCommandInput('');
                             fetchTasks(); 
                          } catch (err: any) {
                             toast.error(err.response?.data?.error || 'Não consegui processar esse comando agora.', { id });
                          }
                       }
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                     <button 
                       type="button"
                       onClick={startListening}
                       className="p-1 rounded-full hover:bg-white/5 transition-all"
                     >
                       <Mic className={`w-4 h-4 transition-all ${isListening ? 'text-red-500 animate-pulse scale-110' : 'text-orange-500 hover:scale-110'}`} />
                     </button>
                     <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${
                       isDark ? 'text-zinc-400 bg-white/5 border-white/10' : 'text-zinc-550 bg-zinc-100 border-zinc-200'
                     }`}>Enter</span>
                  </div>
               </div>
               <p className="text-[8px] text-zinc-555 font-medium italic">Ex: "Adicionar vídeo dia 15", "Mudar live para amanhã"</p>
            </div>
          </div>

          <div className={`border rounded-3xl p-8 shadow-2xl relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-orange-950 via-amber-950 to-slate-900 border-orange-500/30 shadow-orange-900/20' 
              : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-orange-100/30 text-zinc-800'
          }`}>
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-12 h-12 text-current" />
             </div>
            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-zinc-800'
            }`}>
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Meta Mensal de Conteúdo
            </h4>
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-650'}`}>Progresso Total</span>
                  <span className={`text-2xl font-black italic ${isDark ? 'text-white' : 'text-zinc-850'}`}>
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.isDone).length / tasks.length) * 100) : 0}%
                  </span>
               </div>
               <div className={`h-3 w-full rounded-full overflow-hidden border ${isDark ? 'bg-black/40 border-white/5' : 'bg-zinc-200 border-zinc-250'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.isDone).length / tasks.length) * 100 : 0}%` }}
                  />
               </div>
               <p className={`text-[10px] font-bold leading-relaxed ${isDark ? 'text-white' : 'text-zinc-700'}`}>
                 Você concluiu {tasks.filter(t => t.isDone).length} de {tasks.length} entregas estratégicas planejadas. Mantenha a constância!
               </p>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`border p-8 max-w-md w-full space-y-6 shadow-2xl relative rounded-[2.5rem] animate-in zoom-in-95 duration-300 ${
            isDark ? 'bg-[#0f0c24] border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <button 
              onClick={() => setShowAddModal(false)}
              className={`absolute top-6 right-6 p-2 rounded-full transition-all ${
                isDark ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 bg-orange-600 rounded-full" />
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Nova_Tarefa</span>
              </div>
              <h3 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-800'}`}>Agendar no Cronograma</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Título da Tarefa</label>
                <input 
                  type="text" 
                  placeholder="Ex: Gravar Reels espontâneo sobre a rotina" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className={`w-full border rounded-2xl px-5 py-3.5 text-sm focus:outline-none transition-all font-sans ${
                    isDark 
                      ? 'bg-black/45 border-white/10 text-white focus:border-orange-500/50' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-orange-400 focus:bg-white'
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-555 dark:text-zinc-400 uppercase tracking-widest">Data de Agendamento</label>
                <input 
                  type="date" 
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className={`w-full border rounded-2xl px-5 py-3.5 text-sm focus:outline-none transition-all font-sans [color-scheme:dark] ${
                    isDark 
                      ? 'bg-black/45 border-white/10 text-white focus:border-orange-500/50' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-orange-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => setShowAddModal(false)}
                className={`flex-1 py-3.5 border rounded-2xl text-[10px] font-black uppercase transition-all ${
                  isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-650 hover:text-zinc-800'
                }`}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (!newTaskTitle.trim()) {
                    toast.error('O título da tarefa é obrigatório.');
                    return;
                  }
                  const id = toast.loading('✦ Criando tarefa estratégica...');
                  try {
                    const dateObj = newTaskDate ? new Date(newTaskDate + 'T12:00:00') : new Date();
                    const res = await api.post('/tasks', { 
                      title: newTaskTitle, 
                      scheduledDate: dateObj.toISOString() 
                    });
                    setTasks(prev => [...prev, res.data]);
                    toast.success('✦ Tarefa agendada com sucesso!', { id });
                    setNewTaskTitle('');
                    setShowAddModal(false);
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Erro ao criar tarefa.', { id });
                  }
                }}
                className="flex-1 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-lg shadow-orange-900/30 border border-orange-500/30"
              >
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
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
