"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Palette, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Moon, 
  Sun,
  Layout,
  Rocket,
  Camera as InstagramIcon,
  Globe,
  Zap,
  Target,
  AtSign
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const InstagramOnboardingModal = dynamic<any>(
  () => import('@/components/InstagramOnboardingModal').then(mod => mod.InstagramOnboardingModal),
  { ssr: false }
);

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isIgModalOpen, setIsIgModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // States do Onboarding
  const [accentColor, setAccentColor] = useState('#a855f7');
  const [handle, setHandle] = useState('');
  const [niche, setNiche] = useState('');
  const [authUrls, setAuthUrls] = useState<any>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [careerObjective, setCareerObjective] = useState('');

  // States da Entrevista com a IA
  const [interviewStep, setInterviewStep] = useState(1);
  const [dream, setDream] = useState('');
  const [followersGoal, setFollowersGoal] = useState('');
  const [incomeTarget, setIncomeTarget] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [frequency, setFrequency] = useState('');
  const [boughtFollowers, setBoughtFollowers] = useState('');
  const [gender, setGender] = useState('');

  const getDerivedObjective = () => {
    if (dream === 'Trabalhar com grandes marcas' || dream === 'Viver de publis/parcerias') {
      return 'CONTRACTS';
    }
    if (dream === 'Ser a maior referência do meu nicho') {
      return 'AUTHORITY';
    }
    if (dream === 'Alcançar independência financeira') {
      return 'SALES';
    }
    return 'FAME';
  };

  const objectives = [
    { id: 'SALES', name: 'Vendas & Consultas', description: 'Foco em converter seguidores em clientes reais.', icon: Zap },
    { id: 'FAME', name: 'Fama & Engajamento', description: 'Foco em crescimento explosivo e reconhecimento.', icon: Sparkles },
    { id: 'CONTRACTS', name: 'Contratos & Marcas', description: 'Foco em atrair marcas para parcerias pagas.', icon: Target },
    { id: 'AUTHORITY', name: 'Autoridade & Nicho', description: 'Foco em ser a maior referência no seu tema.', icon: User }
  ];

  const colors = [
    { name: 'Roxo Elite', value: '#a855f7' },
    { name: 'Azul Tech', value: '#3b82f6' },
    { name: 'Verde ROI', value: '#10b981' },
    { name: 'Rosa Impacto', value: '#f43f5e' },
    { name: 'Âmbar Criativo', value: '#f59e0b' }
  ];

  useEffect(() => {
     if (step === 5) {
        fetchIntegrations();
     }
  }, [step]);

  const fetchIntegrations = async () => {
    try {
      const [connRes, urlsRes] = await Promise.all([
        api.get('/integrations/connected'),
        api.get('/integrations/urls')
      ]);
      setConnectedPlatforms(connRes.data.platforms || []);
      setAuthUrls(urlsRes.data);
    } catch (err) {
      console.error('Erro ao buscar integrações:', err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const platform = params.get('platform');
    
    if (status === 'success' && platform === 'instagram') {
      toast.success('✦ Instagram conectado com sucesso (Real)!');
      fetchIntegrations();
    } else if (status === 'success' && platform === 'tiktok') {
      toast.success('✦ TikTok conectado com sucesso!');
      fetchIntegrations();
    } else if (status === 'error') {
      const errorType = params.get('error');
      const errorMsg = errorType === 'no_business_account'
        ? 'Sua conta do Instagram não está vinculada a uma Página do Facebook ou não é Profissional.'
        : 'Erro ao conectar com a rede social.';
      toast.error(errorMsg);
    }
  }, []);

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      const derivedObj = getDerivedObjective();
      const interviewPayload = JSON.stringify({
        dream,
        followersGoal,
        incomeTarget,
        difficulty,
        experience,
        availability,
        frequency,
        boughtFollowers,
        gender
      });
      await api.patch('/influencers/profile', {
        handle,
        niche,
        careerObjective: derivedObj,
        aiInterview: interviewPayload,
        theme,
        accentColor,
        onboardingCompleted: true
      });
      
      Cookies.set('influnext_onboarding', 'true', { expires: 7 });
      toast.success('✦ Sistema Configurado! Bem-vindo à nova elite digital.');
      router.push('/dashboard/influencer');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar onboarding.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnect = (url: string) => {
    if (!url || url === '#') {
      toast.error('Configuração de API pendente no servidor.');
      return;
    }
    window.location.href = url;
  };

  const handleConnectPersonal = () => {
    api.get('/integrations/urls?from=onboarding')
      .then(res => {
        const url = res.data?.instagram;
        if (!url || url === '#') {
          toast.error('Configuração de API do Instagram pendente no servidor.');
          return;
        }
        window.location.href = url;
      })
      .catch(() => {
        toast.error('Erro ao obter link de conexão com o Instagram.');
      });
  };

  const handleConnectBusiness = () => {
    api.get('/integrations/urls?from=onboarding')
      .then(res => {
        const url = res.data?.instagram_business;
        if (!url || url === '#') {
          toast.error('Configuração de API do Instagram Business pendente no servidor.');
          return;
        }
        window.location.href = url;
      })
      .catch(() => {
        toast.error('Erro ao obter link de conexão com o Instagram Business.');
      });
  };

  const handleConnectSimulate = async () => {
    try {
      setIsSaving(true);
      await api.post('/integrations/simulate');
      Cookies.set('influnext_onboarding', 'true', { expires: 7 });
      toast.success('✦ Instagram conectado com sucesso (Simulado)!');
      
      const derivedObj = getDerivedObjective();
      const interviewPayload = JSON.stringify({
        dream,
        followersGoal,
        incomeTarget,
        difficulty,
        experience,
        availability,
        frequency,
        boughtFollowers
      });
      await api.patch('/influencers/profile', {
        handle,
        niche,
        careerObjective: derivedObj,
        aiInterview: interviewPayload,
        theme,
        accentColor,
        onboardingCompleted: true
      });
      
      router.push('/dashboard/influencer');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao simular conexão.');
    } finally {
      setIsSaving(false);
      setIsIgModalOpen(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#050508] text-white'} flex flex-col items-center justify-center p-6 overflow-hidden`}>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${theme === 'light' ? 'bg-purple-500/5' : 'bg-purple-500/10'} blur-[120px] rounded-full animate-pulse`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${theme === 'light' ? 'bg-blue-500/5' : 'bg-blue-500/10'} blur-[120px] rounded-full animate-pulse`} />
      </div>

      <div className="w-full max-w-xl relative">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${s <= step ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]' : theme === 'light' ? 'bg-slate-200' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-4">
              <div className={`w-16 h-16 ${theme === 'light' ? 'bg-purple-50' : 'bg-purple-500/10'} rounded-2xl flex items-center justify-center border ${theme === 'light' ? 'border-purple-100' : 'border-purple-500/20'}`}>
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                BEM-VINDO À <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">NOVA ERA</span> DA INFLUÊNCIA.
              </h1>
              <p className={`${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'} text-lg font-medium max-w-md`}>
                Você acaba de entrar no workspace mais avançado do mercado. Vamos configurar sua inteligência para começar.
              </p>
            </div>
            <Button 
              onClick={() => setStep(2)}
              className={`group ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-zinc-200'} px-10 h-16 rounded-[1.5rem] font-black text-lg transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95`}
            >
              INICIAR PROTOCOLO <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {/* STEP 2: IDENTITY */}
        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">Visual_Sistema</h2>
              <p className={`${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} text-sm font-bold uppercase tracking-widest`}>Tema e Identidade de Cor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('dark')}
                className={`p-6 rounded-[2rem] border-2 text-left space-y-4 transition-all ${theme === 'dark' ? 'border-purple-500 bg-purple-500/5' : theme === 'light' ? 'border-slate-200 bg-white opacity-60 hover:opacity-100' : 'border-zinc-800 bg-transparent opacity-40 hover:opacity-100'}`}
              >
                <div className={`w-12 h-12 ${theme === 'light' ? 'bg-slate-900' : 'bg-zinc-900'} rounded-xl flex items-center justify-center border border-white/5`}><Moon className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <p className="font-black text-sm uppercase tracking-widest">Dark Mode</p>
                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} font-bold`}>Foco total em performance.</p>
                </div>
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`p-6 rounded-[2rem] border-2 text-left space-y-4 transition-all ${theme === 'light' ? 'border-purple-500 bg-white' : 'border-zinc-800 bg-transparent opacity-40 hover:opacity-100'}`}
              >
                <div className={`w-12 h-12 ${theme === 'light' ? 'bg-white' : 'bg-zinc-100'} rounded-xl flex items-center justify-center border border-zinc-200 shadow-sm`}><Sun className="w-6 h-6 text-purple-600" /></div>
                <div>
                  <p className="font-black text-sm uppercase tracking-widest">Clean Mode</p>
                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} font-bold`}>Clareza e precisão analítica.</p>
                </div>
              </button>
            </div>

            <div className="space-y-4">
              <p className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} tracking-[0.3em]`}>Cromatismo de Destaque</p>
              <div className="flex flex-wrap gap-5 justify-between px-4">
                {colors.map((c) => (
                  <button 
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${accentColor === c.value ? theme === 'light' ? 'border-slate-900 scale-125 shadow-lg' : 'border-white scale-125 shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-40'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(1)} variant="outline" className={`h-14 px-10 rounded-2xl ${theme === 'light' ? 'border-slate-200 bg-white text-slate-400' : 'border-white/[0.05] bg-white/[0.02] text-zinc-500'} font-black tracking-widest uppercase text-[10px] hover:text-purple-500 transition-colors`}>Voltar</Button>
              <Button onClick={() => setStep(3)} className="h-14 flex-1 rounded-[1.5rem] bg-purple-600 hover:bg-purple-500 font-black shadow-[0_15px_30px_rgba(124,58,237,0.3)] transition-all">PRÓXIMO PASSO</Button>
            </div>
          </div>
        )}

        {/* STEP 3: PROFILE */}
        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase">Identidade_Pública</h2>
              <p className={`${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} text-sm font-bold uppercase tracking-widest`}>Como as marcas encontrarão você</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} tracking-[0.2em]`}>Sua Presença (@Handle)</label>
                <div className="relative">
                   <Input 
                     value={handle}
                     onChange={(e) => setHandle(e.target.value)}
                     placeholder="o_melhor_criador"
                     className={`h-16 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900/50 border-zinc-800'} rounded-2xl focus:border-purple-500 transition-all font-black text-xl pl-12`}
                   />
                   <AtSign className={`absolute left-4 top-5 w-6 h-6 ${theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} tracking-[0.2em]`}>Nicho de Domínio</label>
                <div className="relative">
                   <Input 
                     value={niche}
                     onChange={(e) => setNiche(e.target.value)}
                     placeholder="Games, Lifestyle, Tech..."
                     className={`h-16 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900/50 border-zinc-800'} rounded-2xl focus:border-purple-500 transition-all font-black text-lg pl-12`}
                   />
                   <Target className={`absolute left-4 top-5 w-6 h-6 ${theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}`} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(2)} variant="outline" className={`h-14 px-10 rounded-2xl ${theme === 'light' ? 'border-slate-200 bg-white text-slate-400' : 'border-white/[0.05] bg-white/[0.02] text-zinc-500'} font-black tracking-widest uppercase text-[10px]`}>Voltar</Button>
              <Button 
                onClick={() => {
                   if (!handle || !niche) {
                      toast.error('Preencha os campos para prosseguir.');
                      return;
                   }
                   setStep(4);
                }} 
                className="h-14 flex-1 rounded-[1.5rem] bg-purple-600 hover:bg-purple-500 font-black shadow-[0_15px_30px_rgba(124,58,237,0.3)] transition-all"
              >
                PROSSEGUIR
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CAREER INTERVIEW */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                  Entrevista de Alinhamento IA // Pergunta {interviewStep} de 9
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                {interviewStep === 1 && "Qual o seu maior sonho?"}
                {interviewStep === 2 && "Sua meta de seguidores"}
                {interviewStep === 3 && "Sua fonte de renda principal"}
                {interviewStep === 4 && "Seu maior desafio hoje"}
                {interviewStep === 5 && "Tempo atuando como influenciador?"}
                {interviewStep === 6 && "Seus horários mais disponíveis?"}
                {interviewStep === 7 && "Frequência de produção de conteúdo?"}
                {interviewStep === 8 && "Já realizou compra de seguidores?"}
                {interviewStep === 9 && "Como você se identifica / Gênero?"}
              </h2>
              <p className={`${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} text-xs font-bold uppercase tracking-widest`}>
                {interviewStep === 1 && "Defina o norte do seu posicionamento estratégico"}
                {interviewStep === 2 && "Onde você planeja estar em 12 meses?"}
                {interviewStep === 3 && "Qual modelo de monetização você quer priorizar?"}
                {interviewStep === 4 && "Onde a IA deve agir com mais intensidade?"}
                {interviewStep === 5 && "Seu nível de maturidade e experiência no mercado"}
                {interviewStep === 6 && "Qual o melhor momento para sua rotina de criação?"}
                {interviewStep === 7 && "Constância e ritmo de postagem desejados"}
                {interviewStep === 8 && "Seja sincero. A IA usará isso para reajustar o alcance real."}
                {interviewStep === 9 && "O estrategista de IA adaptará o nome (Vincenzo/Valentina) e pronomes de tratamento"}
              </p>
            </div>

            {/* Questions Wizard */}
            <div className="space-y-4 min-h-[260px]">
              {interviewStep === 1 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Viver de publis/parcerias",
                    "Trabalhar com grandes marcas",
                    "Alcançar independência financeira",
                    "Ser a maior referência do meu nicho"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setDream(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        dream === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {dream === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 2 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "10.000 seguidores",
                    "50.000 seguidores",
                    "100.000 seguidores",
                    "500.000+ seguidores"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFollowersGoal(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        followersGoal === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {followersGoal === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 3 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Publis/Parcerias",
                    "Infoprodutos / Mentorias",
                    "AdSense / Visualizações",
                    "Afiliados / Vendas"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setIncomeTarget(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        incomeTarget === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {incomeTarget === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 4 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Consistência de posts",
                    "Entender o algoritmo",
                    "Negociar com marcas",
                    "Qualidade dos vídeos"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setDifficulty(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        difficulty === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {difficulty === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 5 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Menos de 6 meses",
                    "De 6 meses a 2 anos",
                    "Mais de 2 anos"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setExperience(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        experience === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {experience === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 6 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Manhãs (8h às 12h)",
                    "Tardes (12h às 18h)",
                    "Noites (18h às 22h)",
                    "Finais de semana"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setAvailability(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        availability === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {availability === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 7 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Diariamente (várias vezes)",
                    "3 vezes por semana",
                    "Uma vez por semana"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFrequency(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        frequency === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {frequency === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 8 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Não, todo o crescimento foi orgânico",
                    "Sim, já comprei seguidores no passado",
                    "Prefiro não responder"
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => setBoughtFollowers(option)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        boughtFollowers === option
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option}</span>
                      {boughtFollowers === option && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}

              {interviewStep === 9 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: "masculino", label: "Masculino (Seu Estrategista será Vincenzo)" },
                    { value: "feminino", label: "Feminino (Sua Estrategista será Valentina)" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGender(option.value)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        gender === option.value
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option.label}</span>
                      {gender === option.value && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => {
                  if (interviewStep > 1) {
                    setInterviewStep(interviewStep - 1);
                  } else {
                    setStep(3);
                  }
                }}
                variant="outline"
                className={`h-14 px-10 rounded-2xl ${
                  theme === 'light'
                    ? 'border-slate-200 bg-white text-slate-400'
                    : 'border-white/[0.05] bg-white/[0.02] text-zinc-500'
                } font-black tracking-widest uppercase text-[10px]`}
              >
                Voltar
              </Button>

              <Button
                onClick={() => {
                  if (interviewStep === 1 && !dream) {
                    toast.error('Por favor, selecione seu sonho.');
                    return;
                  }
                  if (interviewStep === 2 && !followersGoal) {
                    toast.error('Por favor, selecione sua meta.');
                    return;
                  }
                  if (interviewStep === 3 && !incomeTarget) {
                    toast.error('Por favor, selecione sua fonte de renda.');
                    return;
                  }
                  if (interviewStep === 4 && !difficulty) {
                    toast.error('Por favor, selecione seu maior desafio.');
                    return;
                  }
                  if (interviewStep === 5 && !experience) {
                    toast.error('Por favor, selecione seu tempo de atuação.');
                    return;
                  }
                  if (interviewStep === 6 && !availability) {
                    toast.error('Por favor, selecione seus horários disponíveis.');
                    return;
                  }
                  if (interviewStep === 7 && !frequency) {
                    toast.error('Por favor, selecione sua frequência de posts.');
                    return;
                  }
                  if (interviewStep === 8 && !boughtFollowers) {
                    toast.error('Por favor, responda sobre compra de seguidores.');
                    return;
                  }
                  if (interviewStep === 9 && !gender) {
                    toast.error('Por favor, selecione como se identifica.');
                    return;
                  }

                  if (interviewStep < 9) {
                    setInterviewStep(interviewStep + 1);
                  } else {
                    setStep(5);
                  }
                }}
                className="h-14 flex-1 rounded-[1.5rem] bg-slate-900 hover:bg-emerald-600 hover:text-white dark:bg-white dark:text-black font-black transition-all text-[10px] tracking-widest uppercase"
              >
                {interviewStep < 8 ? "Avançar" : "Configurar IA"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: SOCIAL CONNECTIONS */}
        {step === 5 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">InfluScore_Boost</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase">Conexões_Neurais</h2>
              <p className={`${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} text-sm font-bold uppercase tracking-widest`}>Sincronize suas contas reais para maximizar seu score</p>
            </div>

            <div className="space-y-4">
               {/* Instagram Button */}
               <button 
                 onClick={() => setIsIgModalOpen(true)}
                 className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${connectedPlatforms.includes('INSTAGRAM') ? 'border-emerald-500 bg-emerald-500/5' : theme === 'light' ? 'border-slate-200 bg-white hover:border-rose-200' : 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/50'}`}
               >
                  <div className="flex items-center gap-6">
                     <div className={`p-4 ${theme === 'light' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-blue-600/10 text-blue-400'} rounded-2xl border group-hover:scale-110 transition-transform`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                           <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                           <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                        </svg>
                     </div>
                     <div className="text-left">
                        <p className="font-black text-sm uppercase tracking-widest text-blue-600 dark:text-blue-400">Conectar Instagram</p>
                        <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'} font-bold uppercase`}>Sincronizar conta e métricas</p>
                     </div>
                  </div>
                  {connectedPlatforms.includes('INSTAGRAM') ? (
                     <CheckCircle2 className="w-6 h-6 text-blue-500" />
                  ) : (
                     <div className={`w-10 h-10 rounded-full ${theme === 'light' ? 'bg-blue-50 text-blue-500' : 'bg-blue-500/10 text-blue-400'} flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                        <ArrowRight size={18} />
                     </div>
                  )}
               </button>

               {/* TikTok Button */}
               <button 
                 onClick={() => handleConnect(authUrls?.tiktok)}
                 className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${connectedPlatforms.includes('TIKTOK') ? 'border-emerald-500 bg-emerald-500/5' : theme === 'light' ? 'border-slate-200 bg-white hover:border-slate-400' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
               >
                  <div className="flex items-center gap-6">
                     <div className={`p-4 ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'} rounded-2xl group-hover:scale-110 transition-transform`}>
                        <Globe size={24} />
                     </div>
                     <div className="text-left">
                        <p className="font-black text-sm uppercase tracking-widest">TikTok Engine</p>
                        <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} font-bold uppercase`}>Sincronizar Trends & Performance</p>
                     </div>
                  </div>
                  {connectedPlatforms.includes('TIKTOK') ? (
                     <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                     <div className={`w-10 h-10 rounded-full ${theme === 'light' ? 'bg-slate-50 text-slate-400' : 'bg-white/5'} flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                        <ArrowRight size={18} />
                     </div>
                  )}
               </button>
            </div>

            <div className={`p-5 ${theme === 'light' ? 'bg-emerald-50 border-emerald-100' : 'bg-emerald-500/5 border-emerald-500/10'} border rounded-2xl flex items-center gap-4`}>
               <Zap className="w-6 h-6 text-emerald-500" />
               <p className={`text-[11px] font-bold ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300'} leading-relaxed uppercase`}>Contas conectadas garantem prioridade no marketplace e InfluScore +40%.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(4)} variant="outline" className={`h-14 px-10 rounded-2xl ${theme === 'light' ? 'border-slate-200 bg-white text-slate-400' : 'border-white/[0.05] bg-white/[0.02] text-zinc-500'} font-black tracking-widest uppercase text-[10px]`}>Voltar</Button>
              <Button 
                onClick={handleComplete} 
                disabled={isSaving}
                className="h-14 flex-1 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-500 font-black shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all"
              >
                {isSaving ? 'SINCRONIZANDO...' : 'FINALIZAR CONFIGURAÇÃO'}
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Footer Branding */}
      <div className={`mt-16 flex items-center gap-3 ${theme === 'light' ? 'opacity-20' : 'opacity-30'}`}>
        <Rocket className={`w-4 h-4 ${theme === 'light' ? 'text-slate-900' : 'text-purple-500'}`} />
        <span className={`text-[10px] font-black tracking-[0.4em] ${theme === 'light' ? 'text-slate-900' : 'text-zinc-500'} uppercase`}>InfluNext // Neural_Experience_2026</span>
      </div>
      <InstagramOnboardingModal 
        isOpen={isIgModalOpen}
        onClose={() => setIsIgModalOpen(false)}
        onConfirm={(mode: 'personal' | 'business' | 'simulate') => {
          if (mode === 'personal') {
            handleConnectPersonal();
          } else if (mode === 'business') {
            handleConnectBusiness();
          } else {
            handleConnectSimulate();
          }
        }}
      />

    </div>
  );
}

