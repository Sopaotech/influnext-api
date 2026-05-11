'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, Rocket, Lightbulb, CheckCircle2, Loader2, RefreshCcw, ClipboardList, Music, Terminal, Zap, Activity, Play, Mic, MicOff, Volume2 } from 'lucide-react';
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
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const router = useRouter();
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

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
      const [res, telRes, connRes] = await Promise.all([
        api.get<AIAnalysis>('/ai/latest'),
        api.get('/tasks/telemetry'),
        api.get('/integrations/connected')
      ]);
      
      if (res.data && res.data.analysisText) {
        setAnalysis(res.data);
      }
      setTelemetry(telRes.data);
      setConnectedPlatforms(connRes.data.platforms || []);
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
      const reply = res.data.reply;
      setChatMessages(prev => [...prev, { role: 'mentor', text: reply }]);
      speak(reply);
    } catch (err) {
      toast.error('O Mentor está ocupado processando dados no momento.');
    } finally {
      setIsChatting(false);
    }
  };

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
      setChatInput(transcript);
      toast.success(`Entendi: "${transcript}"`);
    };

    recognition.start();
  };

  const speak = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 0.95;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('pt-BR') && v.name.includes('Google')) || voices.find(v => v.lang.includes('pt-BR'));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
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
      
      <header className="px-8 py-10 border-b border-white/[0.08]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
               <div className="h-1.5 w-10 bg-purple-600 rounded-full" />
               <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em]">Strategic_Neural_Link v2.1</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
              Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600">Comando</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 max-w-lg uppercase tracking-wider">
              Sua unidade de processamento tático e inteligência de mercado.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             {connectedPlatforms.length === 0 ? (
               <Button 
                onClick={() => router.push('/dashboard/settings')}
                className="bg-rose-500/10 border border-rose-500/20 px-5 py-2.5 rounded-2xl flex items-center gap-3 group hover:bg-rose-500/20 transition-all"
               >
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]" />
                  <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Nenhuma rede conectada</span>
               </Button>
             ) : (
               <div className="bg-purple-600/10 border border-purple-500/20 px-5 py-2.5 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">{connectedPlatforms.length} {connectedPlatforms.length === 1 ? 'Rede Ativa' : 'Redes Ativas'}</span>
               </div>
             )}
          </div>
        </div>
      </header>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="space-y-1 relative z-10">
           <div className="flex items-center gap-2 text-purple-600 font-black text-[10px] tracking-widest uppercase">
             <Terminal className="w-4 h-4" />
             Terminal Estratégico v2.0
           </div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
             Análise_<span className="text-purple-600 italic">Ativa</span>
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
          className="bg-slate-900 hover:bg-slate-800 text-white h-12 px-8 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest relative z-10 shadow-sm"
        >
          {isGenerating ? 'ANALISANDO...' : 'ATUALIZAR DADOS'}
        </Button>
      </header>

      {analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Console */}
          <div className="lg:col-span-3 space-y-8">
            <section className="bg-white border border-slate-100 p-10 rounded-[2.5rem] relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <BrainCircuit className="w-32 h-32 text-purple-600" />
              </div>
              
              <div className="flex items-center gap-2 mb-8 text-purple-600 text-[10px] font-black uppercase tracking-widest">
                 <Zap className="w-4 h-4 fill-purple-600" /> Diretriz do Mentor
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap text-base border-l-4 border-purple-500 pl-6 py-4 bg-purple-50/50 rounded-r-2xl">
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
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isCreatingTasks ? (
                    <> <Loader2 className="w-4 h-4 animate-spin" /> SINCRONIZANDO... </>
                  ) : (
                    <> <ClipboardList className="w-4 h-4" /> ENVIAR PARA O CALENDÁRIO </>
                  )}
                </Button>
              </div>
            </section>

            {/* Chat com Mentor Interativo */}
            <section className="bg-white border border-slate-100 p-8 rounded-[2.5rem] relative flex flex-col h-[500px] shadow-sm">
              <div className="flex items-center gap-3 mb-6 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50 pb-6">
                 <Terminal className="w-5 h-5 text-purple-600" /> Chat Direto com seu Mentor
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
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md rounded-tr-sm' 
                          : 'bg-slate-50 border-slate-100 text-slate-700 rounded-tl-sm'
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
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm text-slate-900 focus:outline-none focus:border-purple-300 focus:bg-white transition-all placeholder:text-slate-400 font-sans"
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startListening}
                    disabled={isListening}
                    className={`p-4 rounded-2xl border transition-all ${
                      isListening 
                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-purple-600 hover:border-purple-200'
                    }`}
                    title="Ativar Voz"
                  >
                    {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isVoiceEnabled 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                        : 'bg-slate-50 border-slate-100 text-slate-300'
                    }`}
                    title={isVoiceEnabled ? "Voz Ativada" : "Voz Desativada"}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <Button 
                    type="submit"
                    disabled={isChatting || !chatInput.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 font-black text-[10px] uppercase tracking-widest rounded-2xl h-full shadow-lg shadow-purple-600/20"
                  >
                    Enviar
                  </Button>
                </div>
              </form>

            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {analysis.recommendations.videoInspirations?.map((ins: any, idx: number) => (
                <div key={idx} className="bg-white border border-slate-100 p-6 rounded-3xl group hover:border-purple-300 transition-all shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-black px-2 py-1 bg-slate-50 text-slate-400 rounded border border-slate-100 uppercase">
                         IDEIA_0{idx + 1} // {ins.platform}
                      </span>
                      <Activity className="w-3 h-3 text-purple-600" />
                   </div>
                   <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">{ins.title}</h4>
                   <p className="text-[10px] text-slate-500 italic mb-4 font-medium">"{ins.hook}"</p>
                   <Button 
                      onClick={() => handleUseInspiration(ins)}
                      className="w-full bg-slate-900 hover:bg-purple-600 text-white text-[9px] font-black uppercase py-3 h-auto rounded-xl transition-all"
                   >
                      ADICIONAR AO CRONOGRAMA
                   </Button>
                </div>
               ))}
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            
             {/* BIBLIOTECA_DE_PARAMETROS (Trend Vault) */}
             <div className="bg-white border border-slate-100 p-8 rounded-[2rem] space-y-6 border-l-4 border-l-purple-500 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
                <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-purple-600" /> VÍDEOS DE REFERÊNCIA
                   </div>
                   <span className="text-purple-500 text-[8px] font-black border border-purple-100 px-2 py-0.5 rounded-full">LIVE FEED</span>
                </h3>
                <div className="space-y-4">
                   {[
                     { title: "Review de Tech Minimalista", thumb: "/influencers/brazilian_influencer_2_1778513129863.png", tags: "TECH, MINIMAL" },
                     { title: "Vlog: Rotina de Criadora", thumb: "/influencers/brazilian_influencer_1_1778513115825.png", tags: "LIFESTYLE, VLOG" },
                     { title: "Dicas de Moda Verão", thumb: "/influencers/brazilian_influencer_3_1778513143227.png", tags: "FASHION, TREND" },
                     { title: "Setup Gamer Pro", thumb: "/influencers/brazilian_influencer_4_1778513156892.png", tags: "GAMING, SETUP" }
                   ].map((video, idx) => (
                      <div key={idx} className="group relative aspect-video rounded-2xl overflow-hidden border border-slate-100 cursor-pointer shadow-sm hover:shadow-xl hover:border-purple-300 transition-all">
                         <img src={video.thumb} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                            <span className="text-[7px] font-black text-purple-400 uppercase tracking-widest mb-1">{video.tags}</span>
                            <h4 className="text-white text-xs font-black uppercase tracking-tight">{video.title}</h4>
                         </div>
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                               <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
            
            {/* Trending Audio Widget */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4 shadow-sm border-t-4 border-t-pink-500">
               <h3 className="text-pink-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Music className="w-3 h-3" /> LIVE TRENDS (AUDIOS)
               </h3>
               <div className="space-y-2">
                  {analysis.recommendations.trendingNow?.audios.map((audio: string, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:border-pink-200 transition-all">
                       <span className="text-[9px] text-slate-600 font-bold truncate max-w-[120px]">{audio}</span>
                       <span className="text-[8px] font-black text-pink-600">🔥 EM ALTA</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Checklist Action */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4 shadow-sm">
               <h3 className="text-purple-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList className="w-3 h-3" /> CHECKLIST DE AÇÃO
               </h3>
               <div className="space-y-3">
                  {analysis.recommendations.trends.map((trend: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white">
                       <div className="mt-1 w-2 h-2 bg-purple-500 rounded-sm" />
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-700 uppercase tracking-tight">{trend.videoType}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase">{trend.duration} // {trend.music}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Telemetria de Resultados */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4 border-t-4 border-t-emerald-500 shadow-sm">
               <h3 className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3 h-3" /> TELEMETRIA DE PERFORMANCE
               </h3>
               <div className="space-y-3">
                  {telemetry.length > 0 ? telemetry.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 group hover:bg-white transition-all">
                       <p className="text-[9px] text-slate-500 font-black truncate uppercase tracking-tight">{item.title}</p>
                       <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-400 font-black uppercase">Impacto Estimado</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.performanceMultiplier >= 1.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                             {item.performanceMultiplier.toFixed(1)}x {item.performanceMultiplier >= 1.0 ? '↑' : '↓'}
                          </span>
                       </div>
                    </div>
                  )) : (
                    <p className="text-[8px] text-slate-400 font-black italic uppercase text-center py-4">Sincronizando dados de ROI...</p>
                  )}
               </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-100 border-dashed p-16 md:p-32 rounded-[3rem] text-center space-y-8 flex flex-col items-center justify-center shadow-sm">
          <div className="p-6 bg-purple-50 rounded-full animate-bounce">
            <BrainCircuit className="w-16 h-16 text-purple-600" />
          </div>
          <div className="space-y-3">
            <p className="text-slate-900 text-2xl font-black uppercase tracking-tighter">Pronto para Sincronizar?</p>
            <p className="text-slate-400 text-sm font-medium max-w-md mx-auto">Sua Área de Trabalho está vazia. Inicie a análise neural para que seu Assistente gere as melhores estratégias baseadas nas tendências de hoje.</p>
          </div>
          <Button 
            onClick={generateNewAnalysis}
            disabled={isGenerating}
            className="bg-slate-900 hover:bg-purple-600 text-white font-black px-12 h-16 rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            {isGenerating ? 'ANALISANDO ALGORITMOS...' : 'SINCRONIZAR INTELIGÊNCIA AGORA'}
          </Button>
        </div>
      )}

    </div>
  );
}
