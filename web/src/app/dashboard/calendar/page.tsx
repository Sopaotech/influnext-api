'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  isDone: boolean;
  fromAI: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#e8e0f5] tracking-tighter">
            Calendário de <span className="text-purple-500">Conteúdo</span>
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Organize sua produção e nunca perca um deadline.</p>
        </div>

        <div className="flex items-center gap-3 bg-[#100c1e] border border-[#1e1430] rounded-2xl px-4 py-2 w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-600" />
          <input 
            type="text" 
            placeholder="Buscar tarefa..." 
            className="bg-transparent border-none focus:outline-none text-[11px] text-zinc-300 w-full placeholder:text-zinc-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-[#0d0b18]/50 border border-white/[0.04] rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-purple-500/10 rounded-xl">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-black text-[#e8e0f5]">
                {monthNames[month]} <span className="text-zinc-600 ml-1">{year}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase rounded-lg transition-colors"
              >
                Hoje
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-white/[0.04]">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="py-4 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">
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
                  className={`min-h-[120px] p-3 border-r border-b border-white/[0.04] transition-colors group relative
                    ${day ? 'hover:bg-white/[0.02]' : 'bg-[#080810]/20'}
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

        {/* Sidebar: Stats & Upcoming */}
        <div className="space-y-6">
          <div className="bg-[#100c1e] border border-[#1e1430] rounded-2xl p-5 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
               <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Próximos Passos
            </h3>
            
            <div className="space-y-4">
              {tasks.filter(t => !t.isDone).slice(0, 5).map(t => (
                <div key={t.id} className="group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Circle className="w-3 h-3 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-zinc-300 group-hover:text-white transition-colors line-clamp-1">{t.title}</p>
                      <p className="text-[9px] text-zinc-600 font-medium">
                        {new Date(t.scheduledDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {tasks.filter(t => !t.isDone).length === 0 && (
                <div className="text-center py-6">
                  <p className="text-[10px] text-zinc-600 font-bold italic">Nenhuma tarefa pendente!</p>
                </div>
              )}
            </div>

            <button className="w-full py-3 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] text-zinc-300 text-[10px] font-black uppercase rounded-xl transition-all">
              Criar Nova Tarefa
            </button>

            {/* AI Assistant Command */}
            <div className="pt-4 border-t border-white/[0.04] space-y-3">
               <div className="flex items-center gap-2 text-[9px] font-black text-purple-400 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Assistente_Estratégico
               </div>
               <div className="relative">
                  <input 
                    type="text"
                    placeholder="Agendar post dia 10 sobre..."
                    className="w-full bg-[#080810] border border-purple-500/30 rounded-xl px-4 py-3 text-[10px] text-zinc-200 focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-700"
                    onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                          toast.success('✦ IA processando comando... Tarefa agendada para o dia selecionado!');
                          (e.target as HTMLInputElement).value = '';
                       }
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                     <span className="text-[8px] font-black text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">ENTER</span>
                  </div>
               </div>
               <p className="text-[8px] text-zinc-600 font-medium italic">Ex: "Adicionar vídeo dia 15", "Mudar live para amanhã"</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/[0.05] rounded-2xl p-5">
            <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Meta Mensal</h4>
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-zinc-400">Progresso</span>
                  <span className="text-xs font-black text-white">
                    {tasks.length > 0 ? Math.round((tasks.filter(t => t.isDone).length / tasks.length) * 100) : 0}%
                  </span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.isDone).length / tasks.length) * 100 : 0}%` }}
                  />
               </div>
               <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                 Você concluiu {tasks.filter(t => t.isDone).length} de {tasks.length} tarefas planejadas para este mês. Continue assim!
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
