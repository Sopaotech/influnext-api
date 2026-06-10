'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, Loader2, ClipboardList, Music, Terminal, Zap, Activity, Play, Mic, MicOff, Volume2, Crown, Lock, User } from 'lucide-react';
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
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'mentor', text: string}[]>([
    { role: 'mentor', text: 'Olá, eu sou o Vincenzo, seu estrategista de carreira e sócio aqui na InfluNext. Meu papel é direcionar seu perfil para escala e lucro real. O que vamos estruturar hoje: roteiro de conteúdo (Instagram/TikTok), pitch de marca ou análise de engajamento?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [mentorName, setMentorName] = useState('Vincenzo');
  const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const router = useRouter();
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [trendVault, setTrendVault] = useState<any[]>([]);
  const [theme, setTheme] = useState<string>('dark');
  const [user, setUser] = useState<any>(null);
  const isTrialActive = user?.subscriptionStatus === 'TRIAL' && user?.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const isPro = user?.role === 'ADMIN' || user?.subscriptionStatus === 'ACTIVE' || isTrialActive;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatting]);

  useEffect(() => {
    fetchLatestAnalysis();

    const handleThemeUpdate = (e: any) => {
      if (e.detail?.theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('theme-updated', handleThemeUpdate);
    return () => window.removeEventListener('theme-updated', handleThemeUpdate);
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      setIsLoading(true);
      const [res, telRes, connRes, profileRes, meRes] = await Promise.all([
        api.get<AIAnalysis>('/ai/latest'),
        api.get('/tasks/telemetry'),
        api.get('/integrations/connected'),
        api.get('/dashboard/influencer').catch(() => null),
        api.get('/auth/me').catch(() => null)
      ]);
      
      if (meRes) {
        setUser(meRes.data);
      }
      
      if (res.data && res.data.analysisText) {
        setAnalysis(res.data);
      }
      setTelemetry(telRes.data);
      setConnectedPlatforms(connRes.data.platforms || []);
      if (profileRes) {
        if (profileRes.data.userState?.theme) {
          setTheme(profileRes.data.userState.theme);
        }
        if (profileRes.data.trendVault) {
          setTrendVault(profileRes.data.trendVault);
        }
        if (profileRes.data.profile?.aiInterview) {
          try {
            const parsed = JSON.parse(profileRes.data.profile.aiInterview);
            if (parsed.gender === 'feminino') {
              setMentorName('Valentina');
              setChatMessages([
                { role: 'mentor', text: 'Olá, eu sou a Valentina, sua estrategista de carreira e sócia aqui na InfluNext. Meu papel é direcionar seu perfil para escala e lucro real. O que vamos estruturar hoje: roteiro de conteúdo (Instagram/TikTok), pitch de marca ou análise de engajamento?' }
              ]);
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewAnalysis = async () => {
    if (!isPro) {
      toast.info('🔒 A geração de novas análises baseada em novos dados em tempo real é exclusiva do Plano Pro!');
      router.push('/dashboard/subscription');
      return;
    }
    try {
      setIsGenerating(true);
      const res = await api.post<any>('/ai/generate');
      setAnalysis(res.data);
      toast.success('✦ Análise neural concluída!');
      await fetchLatestAnalysis();
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

  const isDark = true;

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Acessando Core de IA...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 font-sans animate-in fade-in duration-500">
      
      <header className={`px-8 py-10 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200/80'}`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
               <div className="h-1.5 w-10 bg-purple-600 rounded-full" />
               <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em]">Link Neural Estratégico v2.1</span>
            </div>
            <h1 className={`text-5xl md:text-7xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500">Comando</span>
            </h1>
            <p className={`text-[11px] font-black max-w-lg uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit border ${
              isDark 
                ? 'bg-purple-950/30 border-purple-500/10 text-purple-300' 
                : 'bg-purple-500/10 border-purple-500/20 text-purple-700'
            }`}>
              Sua unidade de processamento tático e inteligência de mercado.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             {connectedPlatforms.length === 0 ? (
               <Button 
                onClick={() => router.push('/dashboard/settings')}
                className="bg-rose-600 border-2 border-rose-400 px-5 py-2.5 rounded-2xl flex items-center gap-3 group hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/20"
               >
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping shadow-[0_0_12px_#fff]" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Sincronizar Redes Agora</span>
               </Button>
             ) : (
               <div className="bg-emerald-600 border-2 border-emerald-400 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-xl shadow-emerald-600/20">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_12px_#fff]" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{connectedPlatforms.length} {connectedPlatforms.length === 1 ? 'Rede Ativa' : 'Redes Ativas'}</span>
               </div>
             )}
          </div>
        </div>
      </header>

      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl shadow-sm relative overflow-hidden group border ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
      }`}>
         <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="space-y-1 relative z-10">
           <div className="flex items-center gap-2 text-purple-600 font-black text-[10px] tracking-widest uppercase">
             <Terminal className="w-4 h-4" />
             Terminal Estratégico v2.0
           </div>
           <h1 className={`text-2xl font-black tracking-tighter flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
             Análise_<span className="text-purple-600 italic">Ativa</span>
           </h1>
          <div className="flex gap-4 mt-2">
            <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
               <Zap className="w-3 h-3 text-emerald-500" />
               <span className="text-[9px] text-emerald-500 font-black uppercase">Foco: Monetização & ROI</span>
            </div>
            <div className={`flex items-center gap-2 px-2 py-1 rounded border ${isDark ? 'bg-purple-500/5 border-purple-500/10' : 'bg-purple-500/10 border-purple-500/20'}`}>
               <Activity className="w-3 h-3 text-purple-500" />
               <span className="text-[9px] text-purple-500 font-black uppercase">Clima: Alta Performance</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={generateNewAnalysis}
          disabled={isGenerating}
          className={`${isDark ? 'bg-white text-slate-950 hover:bg-zinc-200' : 'bg-slate-900 hover:bg-slate-800 text-white'} h-12 px-8 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest relative z-10 shadow-sm`}
        >
          {isGenerating ? 'ANALISANDO...' : 'ATUALIZAR DADOS'}
        </Button>
      </header>

      {analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Console */}
          <div className="lg:col-span-3 space-y-8">
            <section className={`border p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden shadow-sm ${
              isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-slate-100'
            }`}>
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <BrainCircuit className={`w-20 h-20 md:w-32 md:h-32 ${isDark ? 'text-white' : 'text-purple-600'}`} />
              </div>
              
              <div className="flex items-center gap-2 mb-6 md:mb-8 text-purple-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                 <Zap className="w-4 h-4 fill-purple-600" /> Diretriz do Mentor
              </div>

              <div className="prose prose-slate max-w-none">
                <p className={`font-bold leading-relaxed whitespace-pre-wrap text-sm md:text-base border-l-4 border-purple-500 pl-4 md:pl-6 py-4 rounded-r-2xl ${
                  isDark ? 'text-zinc-200 bg-purple-950/20' : 'text-slate-700 bg-purple-50/50'
                }`}>
                  {analysis.analysisText}
                </p>
              </div>

              <div className="mt-6 md:mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  <span>SISTEMA: ATIVO</span>
                  <span>HORA: {new Date(analysis.generatedAt).toLocaleTimeString()}</span>
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

            {/* Próximo Passo Recomendado (Socratic Action) */}
            <div className={`border p-6 rounded-[2rem] relative overflow-hidden shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-l-4 border-l-emerald-500 ${
              isDark ? 'bg-black/35 border-white/5 text-white' : 'bg-white border-slate-200'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Próximo Passo Recomendado pelo Mentor
                </div>
                <h3 className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {analysis.recommendations.suggestedTasks?.[0]?.title || 'Ajustar Pitch de Parceria comercial'}
                </h3>
                <p className="text-[10px] font-bold text-zinc-400">
                  {analysis.recommendations.suggestedTasks?.[0]?.description || 'Gere scripts prontos para contato de patrocínio com marcas no seu nicho.'}
                </p>
              </div>
              <Button 
                onClick={handleTransformToPlan}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-6 py-3 h-10 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Iniciar Ação
              </Button>
            </div>

            {/* Chat com Mentor Interativo */}
            <section className={`border p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative flex flex-col h-[400px] md:h-[500px] shadow-sm ${
              isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
            }`}>
              {!isPro && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-20 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
                    <BrainCircuit className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest">Recurso Premium</span>
                    <h3 className="text-xl font-black text-white tracking-tight">Cérebro de IA do {mentorName}</h3>
                    <p className="text-[11px] text-zinc-400 font-bold leading-relaxed">
                      Desbloqueie conversas ilimitadas com seu estrategista de negócios para receber roteiros personalizados de vídeo, scripts de publis e direcionamento estratégico de carreira.
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/dashboard/subscription')}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest px-8 py-3 rounded-xl shadow-lg shadow-purple-900/30 transition-all border border-purple-500/30"
                  >
                    Upgrade para Pro
                  </Button>
                </div>
              )}
              <div className={`flex items-center gap-3 mb-4 md:mb-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest border-b pb-4 md:pb-6 ${
                isDark ? 'text-zinc-500 border-white/5' : 'text-slate-400 border-slate-50'
              }`}>
                 <Terminal className="w-5 h-5 text-purple-600" /> {mentorName} // Estrategista de Carreira
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-none scroll-smooth">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                    <Sparkles className="w-10 h-10 text-zinc-600 animate-pulse" />
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500">Aguardando Conexão...</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-500`}>
                      <div className={`max-w-[85%] p-5 rounded-3xl text-[13px] leading-relaxed border break-words shadow-lg ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md rounded-tr-sm' 
                          : (isDark ? 'bg-white/5 border-white/5 text-zinc-200 rounded-tl-sm shadow-black/50' : 'bg-slate-50 border-slate-100 text-slate-700 rounded-tl-sm')
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="flex justify-start animate-in fade-in duration-300">
                    <div className={`border p-4 rounded-2xl rounded-tl-sm text-[11px] flex items-center gap-3 ${
                      isDark ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}>
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" />
                      </div>
                      {mentorName} está estruturando a estratégia...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
 
              <form onSubmit={handleSendMessage} className={`mt-4 flex gap-2 pt-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Falar com meu Sócio Estratégico..."
                  className={`flex-1 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-purple-300 focus:bg-white transition-all placeholder:text-slate-400 font-sans border ${
                    isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'
                  }`}
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startListening}
                    disabled={isListening}
                    className={`p-4 rounded-2xl border transition-all ${
                      isListening 
                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse' 
                        : (isDark ? 'bg-white/5 border-white/5 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-purple-600 hover:border-purple-200')
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
                        : (isDark ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-slate-50 border-slate-100 text-slate-300')
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
                 <div key={idx} className={`border p-6 rounded-3xl group hover:border-purple-300 transition-all shadow-sm ${
                   isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
                 }`}>
                    <div className="flex justify-between items-start mb-4">
                       <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase ${
                         isDark ? 'bg-white/5 border-white/5 text-zinc-400' : 'bg-slate-50 border-slate-100 text-slate-400'
                       }`}>
                          IDEIA_0{idx + 1} // {ins.platform}
                       </span>
                       <Activity className="w-3 h-3 text-purple-600" />
                    </div>
                    <h4 className={`text-sm font-black mb-2 uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{ins.title}</h4>
                    <p className={`text-[10px] italic mb-4 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>"{ins.hook}"</p>
                    <Button 
                       onClick={() => handleUseInspiration(ins)}
                       className={`w-full text-[9px] font-black uppercase py-3 h-auto rounded-xl transition-all ${
                         isDark ? 'bg-white hover:bg-zinc-200 text-slate-950' : 'bg-slate-900 hover:bg-purple-600 text-white'
                       }`}
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
             <div className={`border p-8 rounded-[2rem] space-y-6 border-l-4 border-l-purple-500 shadow-sm relative overflow-hidden ${
               isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
             }`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
                <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
                   <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-purple-600" /> VÍDEOS DE REFERÊNCIA
                   </div>
                   <span className="text-purple-500 text-[8px] font-black border border-purple-100 px-2 py-0.5 rounded-full">FEED EM TEMPO REAL</span>
                </h3>
                <div className="space-y-4">
                    {(trendVault && trendVault.length > 0 ? trendVault : [
                     { title: "Review de Tech Minimalista", thumbnail: "/influencers/brazilian_influencer_2_1778513129863.png", niche: "TECNOLOGIA, MINIMALISTA", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                     { title: "Vlog: Rotina de Criadora", thumbnail: "/influencers/brazilian_influencer_1_1778513115825.png", niche: "ESTILO DE VIDA, VLOG", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                     { title: "Dicas de Moda Verão", thumbnail: "/influencers/brazilian_influencer_3_1778513143227.png", niche: "MODA, TENDÊNCIA", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
                     { title: "Setup Gamer Pro", thumbnail: "/influencers/brazilian_influencer_4_1778513156892.png", niche: "GAMES, SETUP", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
                    ]).map((video, idx) => {
                       const isLockedVideo = !isPro && idx >= 2;
                       return (
                        <div 
                          key={idx} 
                          onClick={() => {
                            if (isLockedVideo) {
                              toast.info('🔒 Faça upgrade para o Plano Pro para ver todos os vídeos de referência!');
                              router.push('/dashboard/subscription');
                              return;
                            }
                            video.videoUrl && window.open(video.videoUrl, '_blank');
                          }}
                          className={`group relative aspect-video rounded-3xl overflow-hidden border cursor-pointer shadow-sm hover:shadow-xl hover:border-purple-300 transition-all ${
                            isDark ? 'border-white/5' : 'border-slate-100'
                          } ${isLockedVideo ? 'blur-[1.5px] opacity-60' : ''}`}
                        >
                          <img src={video.thumbnail || "/influencers/brazilian_influencer_1_1778513115825.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 group-hover:opacity-100" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent flex flex-col justify-end p-3">
                             <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col shadow-lg">
                                 <span className="text-[7px] font-black text-purple-300 uppercase tracking-widest mb-0.5">{video.niche || video.tags}</span>
                                <h4 className="text-white text-[10px] font-black uppercase tracking-tight leading-snug">{video.title}</h4>
                             </div>
                          </div>
                          
                          {isLockedVideo ? (
                            <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[2px]">
                               <Lock className="w-5 h-5 text-purple-400 mb-1" />
                               <span className="text-[8px] font-black text-purple-300 uppercase tracking-widest">Plano Pro</span>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                  <Play className="w-4 h-4 text-white fill-white" />
                                </div>
                            </div>
                          )}
                       </div>
                       );
                     })}
                </div>
             </div>
            
             {/* CRIADORES DE REFERÊNCIA (PERFIS) */}
             <div className={`border p-6 rounded-[2rem] space-y-4 border-l-4 border-l-rose-500 shadow-sm relative overflow-hidden ${
               isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
             }`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full" />
                <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-between ${isDark ? 'text-white' : 'text-slate-900'}`}>
                   <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-500" /> CRIADORES DE REFERÊNCIA
                   </div>
                   <span className="text-rose-500 text-[8px] font-black border border-rose-100 px-2 py-0.5 rounded-full">PERFIS EM ALTA</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { handle: "@marcos_creative", name: "Marcos Creative", niche: "Edição & Audiovisual", followers: "128K", link: "https://instagram.com" },
                    { handle: "@julia_tech", name: "Julia Tech", niche: "Tecnologia & Setup", followers: "84K", link: "https://instagram.com" },
                    { handle: "@gabriel_lifestyle", name: "Gabriel Silva", niche: "Vlog & Rotina", followers: "210K", link: "https://instagram.com" }
                  ].map((profile, idx) => (
                    <div 
                      key={idx}
                      onClick={() => window.open(profile.link, '_blank')}
                      className={`p-3 border rounded-2xl flex items-center justify-between group hover:border-rose-400 hover:bg-white/[0.02] cursor-pointer transition-all ${
                        isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 font-bold text-xs uppercase">
                          {profile.name.charAt(0)}
                        </div>
                        <div className="space-y-0.5 text-left">
                          <p className="text-[10px] font-black text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight">{profile.name}</p>
                          <p className="text-[8px] text-zinc-500 font-medium">{profile.handle} • {profile.niche}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/10">
                        {profile.followers}
                      </span>
                    </div>
                  ))}
                </div>
             </div>
            
             {/* Trending Audio Widget */}
             <div className={`border p-6 rounded-3xl space-y-4 shadow-sm border-t-4 border-t-pink-500 ${
               isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
             }`}>
                <h3 className="text-pink-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Music className="w-3 h-3" /> ÁUDIOS EM ALTA (TENDÊNCIAS)
                </h3>
                <div className="space-y-2">
                   {analysis.recommendations.trendingNow?.audios.map((audio: string, idx: number) => (
                     <div key={idx} className={`p-3 border rounded-xl flex items-center justify-between group hover:border-pink-200 transition-all ${
                       isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                     }`}>
                        <span className={`text-[9px] font-bold truncate max-w-[120px] ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>{audio}</span>
                        <span className="text-[8px] font-black text-pink-600">🔥 EM ALTA</span>
                     </div>
                   ))}
                </div>
             </div>
 
             {/* Checklist Action */}
             <div className={`border p-6 rounded-3xl space-y-4 shadow-sm ${
               isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
             }`}>
                <h3 className="text-purple-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <ClipboardList className="w-3 h-3" /> CRONOGRAMA DE AÇÃO
                </h3>
                <div className="space-y-3">
                   {analysis.recommendations.trends.map((trend: any, idx: number) => (
                     <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                       isDark ? 'bg-white/5 border-white/5 hover:bg-black/40 text-zinc-300' : 'bg-slate-50 border-slate-100 hover:bg-white'
                     }`}>
                        <div className="mt-1 w-2 h-2 bg-purple-500 rounded-sm" />
                        <div className="space-y-1">
                           <p className={`text-[9px] font-black uppercase tracking-tight ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>{trend.videoType}</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase">{trend.duration} // {trend.music}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
 
             {/* Telemetria de Resultados */}
             <div className={`border p-6 rounded-3xl space-y-4 border-t-4 border-t-emerald-500 shadow-sm ${
               isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
             }`}>
                <h3 className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Activity className="w-3 h-3" /> DESEMPENHO DO ALGORITMO (ROI)
                </h3>
                <div className="space-y-3">
                   {telemetry.length > 0 ? telemetry.map((item, idx) => (
                     <div key={idx} className={`p-4 border rounded-xl space-y-2 group transition-all ${
                       isDark ? 'bg-white/5 border-white/5 hover:bg-black/40' : 'bg-slate-50 border-slate-100 hover:bg-white'
                     }`}>
                        <p className={`text-[9px] font-black truncate uppercase tracking-tight ${isDark ? 'text-zinc-300' : 'text-slate-500'}`}>{item.title}</p>
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
         <div className={`border-2 border-dashed p-16 md:p-32 rounded-[3rem] text-center space-y-8 flex flex-col items-center justify-center shadow-sm ${
           isDark ? 'bg-black/35 border-white/5' : 'bg-white border-slate-100'
         }`}>
           <div className="p-6 bg-purple-50 rounded-full animate-bounce">
             <BrainCircuit className="w-16 h-16 text-purple-600" />
           </div>
           <div className="space-y-3">
             <p className={`text-2xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Pronto para Sincronizar?</p>
             <p className={`text-sm font-medium max-w-md mx-auto ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Sua Área de Trabalho está vazia. Inicie a sincronização neural para que o Consultor IA crie suas missões e roteiros estratégicos baseados em monetização real.</p>
           </div>
           <Button 
             onClick={generateNewAnalysis}
             disabled={isGenerating}
             className={`${isDark ? 'bg-white hover:bg-zinc-200 text-slate-950' : 'bg-slate-900 hover:bg-purple-600 text-white'} font-black px-12 h-16 rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-95 text-xs uppercase tracking-widest`}
           >
             {isGenerating ? 'ANALISANDO ALGORITMOS...' : 'SINCRONIZAR INTELIGÊNCIA AGORA'}
           </Button>
         </div>
       )}
    </div>
  );
}
