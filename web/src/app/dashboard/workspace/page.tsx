'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, Rocket, Lightbulb, CheckCircle2, Loader2, RefreshCcw, ClipboardList, Music, Terminal, Zap, Activity, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AIAnalysis {
  id: string;
  analysisText: string;
  recommendations: {
    trends: any[];
    suggestedTasks: any[];
    videoInspirations: any[];
    trendingNow?: { audios: string[]; topics: string[] };
  };
  trendVault: { id: string; title: string; videoUrl: string; thumbnail: string; expiresAt: string }[];
  generatedAt: string;
}

export default function AIWorkspacePage() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'mentor', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const router = useRouter();
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatting]);

  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<AIAnalysis>('/ai/latest');
      if (res.data && res.data.analysisText) {
        setAnalysis(res.data);
      }
      const telRes = await api.get('/tasks/telemetry');
      setTelemetry(telRes.data);
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewAnalysis = async () => {
    try {
      setIsGenerating(true);
      const res = await api.post<any>('/ai/generate');
      setAnalysis(res.data);
      toast.success('✦ Inteligência Sincronizada!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao gerar análise.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTransformToPlan = async () => {
    if (!analysis?.recommendations.suggestedTasks) return;

    try {
      setIsCreatingTasks(true);
      const res = await api.post('/tasks/ai-generate', analysis.recommendations.suggestedTasks);
      toast.success(`✦ ${res.data.tasks.length} tarefas adicionadas ao seu cronograma!`);
      router.push('/dashboard/tasks');
    } catch (err) {
      toast.error('Erro ao criar plano de ação.');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleUseInspiration = async (inspiration: any) => {
    try {
      setIsCreatingTasks(true);
      const taskData = [{
        title: `Gravar: ${inspiration.title}`,
        description: `Gancho: ${inspiration.hook}. Motivo: ${inspiration.whyItWorks}`,
        daysFromNow: 1
      }];
      await api.post('/tasks/ai-generate', taskData);
      toast.success('🔥 Ideia convertida em tarefa no seu cronograma!');
      router.push('/dashboard/tasks');
    } catch (err) {
      toast.error('Erro ao converter ideia.');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatting(true);

    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      setChatMessages(prev => [...prev, { role: 'mentor', text: res.data.reply }]);
    } catch (err) {
      toast.error('O Mentor está ocupado processando dados no momento.');
    } finally {
      setIsChatting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Acessando Core de IA...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 font-mono animate-in fade-in duration-500">
      
      <header className="px-8 py-10 border-b border-white/[0.03]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
               <div className="h-1 w-8 bg-purple-600 rounded-full" />
               <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Strategic_Neural_Link</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Workspace</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-purple-600/10 border border-purple-500/20 px-5 py-2.5 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Mentor Ativo</span>
             </div>
          </div>
        </div>
      </header>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-zinc-950 border border-zinc-800 rounded-lg shadow-[0_0_15px_-5px_rgba(139,92,246,0.3)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-purple-400 font-black text-[10px] tracking-widest uppercase">
            <Terminal className="w-4 h-4" />
            Core Terminal v2.0
          </div>
          <h1 className="text-2xl font-black text-zinc-50 tracking-tighter flex items-center gap-2">
            Workspace_<span className="text-purple-500 italic">Estratégico</span>
          </h1>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-2 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
               <Zap className="w-3 h-3 text-emerald-500" />
               <span className="text-[9px] text-emerald-500 font-black uppercase">Foco: Conversão</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
               <Activity className="w-3 h-3 text-purple-500" />
               <span className="text-[9px] text-purple-500 font-black uppercase">Clima: Alta Performance</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={generateNewAnalysis}
          disabled={isGenerating}
          className="bg-zinc-900 border border-zinc-800 hover:border-purple-500 text-zinc-400 hover:text-white h-10 px-6 rounded-md transition-all text-[10px] font-black uppercase tracking-widest relative z-10"
        >
          {isGenerating ? '>> PROCESSANDO...' : '>> ATUALIZAR_DADOS'}
        </Button>
      </header>

      {analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Console */}
          <div className="lg:col-span-3 space-y-8">
            <section className="bg-zinc-950 border border-zinc-800 p-8 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                 <BrainCircuit className="w-32 h-32" />
              </div>
              
              <div className="flex items-center gap-2 mb-6 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                 <Zap className="w-3 h-3" /> Diretriz_Executiva
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-100 font-bold leading-relaxed whitespace-pre-wrap text-sm border-l-2 border-emerald-500 pl-4 py-2 bg-emerald-500/5">
                  {analysis.analysisText}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-[9px] text-zinc-600 font-black uppercase tracking-widest">
                  <span>SISTEMA: OK</span>
                  <span>TIME: {new Date(analysis.generatedAt).toLocaleTimeString()}</span>
                </div>
                
                <Button 
                  onClick={handleTransformToPlan}
                  disabled={isCreatingTasks}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-md shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                >
                  {isCreatingTasks ? '>> AGENDANDO...' : '>> ATACAR_AGORA'}
                </Button>
              </div>
            </section>

            {/* Chat com Mentor Interativo */}
            <section className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg relative flex flex-col h-[400px]">
              <div className="flex items-center gap-2 mb-4 text-purple-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-900 pb-4">
                 <Terminal className="w-4 h-4" /> Mentor InfluNext // Chat Direto
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-none scroll-smooth">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                    <Sparkles className="w-10 h-10 text-zinc-600 animate-pulse" />
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500">Aguardando Conexão Neural...</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                      <div className={`max-w-[85%] p-5 rounded-3xl text-[13px] leading-relaxed border break-words shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-purple-600/10 border-purple-500/20 text-zinc-100 rounded-tr-sm' 
                          : 'bg-white/[0.02] border-white/[0.04] text-zinc-300 rounded-tl-sm backdrop-blur-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className="bg-zinc-900/50 border border-white/[0.04] text-zinc-500 p-4 rounded-2xl rounded-tl-sm text-[11px] flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" />
                      </div>
                      Mentor processando dados estratégicos...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 pt-4 border-t border-zinc-900">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Minha campanha flopou, o que eu ajusto hoje?"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-700 font-sans"
                />
                <Button 
                  type="submit"
                  disabled={isChatting || !chatInput.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 font-black text-[10px] uppercase tracking-widest rounded-lg"
                >
                  Enviar
                </Button>
              </form>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {analysis.recommendations.videoInspirations?.map((ins: any, idx: number) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg group hover:border-amber-500/30 transition-all">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-black px-2 py-1 bg-zinc-900 text-zinc-500 rounded border border-zinc-800">
                         IDEA_0{idx + 1} // {ins.platform}
                      </span>
                      <Activity className="w-3 h-3 text-amber-500" />
                   </div>
                   <h4 className="text-sm font-black text-zinc-50 mb-2 uppercase">{ins.title}</h4>
                   <p className="text-[10px] text-zinc-500 italic mb-4">"{ins.hook}"</p>
                   <Button 
                      onClick={() => handleUseInspiration(ins)}
                      className="w-full bg-transparent border border-zinc-800 hover:bg-zinc-900 text-[9px] font-black uppercase py-2 h-auto"
                   >
                      DEPLOY_TASK
                   </Button>
                </div>
               ))}
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            
            {/* BIBLIOTECA_DE_PARAMETROS (Trend Vault) */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg space-y-4 border-l-2 border-l-purple-500 shadow-[0_0_20px_-10px_rgba(168,85,247,0.3)]">
               <h3 className="text-purple-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Play className="w-3 h-3" /> BIBLIOTECA_DE_PARAMETROS
               </h3>
               <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x">
                  {analysis.trendVault?.length > 0 ? analysis.trendVault.map((ref, idx) => {
                    const daysLeft = Math.ceil((new Date(ref.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={ref.id} className="flex-none w-48 space-y-2 snap-start">
                         <div 
                           className="relative aspect-[9/16] bg-zinc-900 rounded-md overflow-hidden border border-zinc-800 group cursor-pointer"
                           style={{ viewTransitionName: `vault-card-${ref.id}` }}
                         >
                            {ref.thumbnail ? (
                              <img src={ref.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-700 font-bold uppercase italic p-4 text-center">
                                 Ref_{idx + 1}
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                               <Play className="w-8 h-8 text-white fill-white" />
                            </div>
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500/80 text-white text-[7px] font-black uppercase rounded-full">
                               Expira em {daysLeft}d
                            </div>
                         </div>
                         <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">{ref.title}</p>
                      </div>
                    );
                  }) : (
                    <p className="text-[8px] text-zinc-700 font-black italic uppercase">Buscando referências visuais no Core...</p>
                  )}
               </div>
            </div>
            
            {/* Trending Audio Widget */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg space-y-4 shadow-[0_0_10px_-5px_rgba(236,72,153,0.2)]">
               <h3 className="text-pink-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Music className="w-3 h-3" /> Live_Trends
               </h3>
               <div className="space-y-2">
                  {analysis.recommendations.trendingNow?.audios.map((audio: string, idx: number) => (
                    <div key={idx} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-md flex items-center justify-between group hover:border-pink-500/30 transition-all">
                       <span className="text-[9px] text-zinc-400 font-bold truncate max-w-[120px]">{audio}</span>
                       <span className="text-[8px] font-black text-pink-400">🔥 98%</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Checklist Action */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg space-y-4">
               <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList className="w-3 h-3" /> Checklist_Acao
               </h3>
               <div className="space-y-3">
                  {analysis.recommendations.trends.map((trend: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-2 border-b border-zinc-900 pb-3">
                       <div className="mt-1 w-2 h-2 bg-zinc-800 border border-zinc-700 rounded-sm" />
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-zinc-300 uppercase">{trend.videoType}</p>
                          <p className="text-[8px] text-zinc-600 font-bold">{trend.duration} // {trend.music}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Telemetria de Resultados */}
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg space-y-4 border-t-2 border-t-emerald-500/30">
               <h3 className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3 h-3" /> TELEMETRIA_DE_RESULTADOS
               </h3>
               <div className="space-y-3">
                  {telemetry.length > 0 ? telemetry.map((item, idx) => (
                    <div key={idx} className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-md space-y-1">
                       <p className="text-[9px] text-zinc-400 font-bold truncate uppercase">{item.title}</p>
                       <div className="flex items-center justify-between">
                          <span className="text-[8px] text-zinc-600 font-black">ROI_INDEX</span>
                          <span className={`text-[9px] font-black ${item.performanceMultiplier >= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {item.performanceMultiplier.toFixed(1)}x {item.performanceMultiplier >= 1.0 ? '↑' : '↓'}
                          </span>
                       </div>
                    </div>
                  )) : (
                    <p className="text-[8px] text-zinc-700 font-black italic uppercase">Aguardando processamento de dados...</p>
                  )}
               </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 border-dashed p-16 md:p-32 rounded-lg text-center space-y-6 flex flex-col items-center justify-center">
          <div className="p-4 bg-purple-500/10 rounded-full animate-pulse">
            <BrainCircuit className="w-12 h-12 text-purple-500" />
          </div>
          <div className="space-y-2">
            <p className="text-zinc-200 text-lg font-black uppercase tracking-widest">Aguardando Sincronização de IA</p>
            <p className="text-zinc-500 text-xs font-bold max-w-md mx-auto">Parece que ainda não analisamos seus dados hoje. Clique abaixo para que o Mentor InfluNext gere sua estratégia personalizada.</p>
          </div>
          <Button 
            onClick={generateNewAnalysis}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black px-10 h-14 rounded-xl shadow-xl shadow-purple-500/20"
          >
            {isGenerating ? '>> ANALISANDO ALGORITMOS...' : '>> SINCRONIZAR_MENTORIA_IA'}
          </Button>
        </div>
      )}

    </div>
  );
}
