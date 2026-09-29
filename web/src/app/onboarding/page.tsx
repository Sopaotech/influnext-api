"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Rocket,
  Globe,
  Zap,
  Target,
  AtSign
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import {
  buildAiInterviewPayload,
  clearCreatorOnboardingDraft,
  clearLegacyCreatorOnboardingDraft,
  createEmptyCreatorOnboardingDraft,
  deriveCareerObjective,
  getCreatorOnboardingDraftStorageKey,
  loadCreatorOnboardingDraft,
  saveCreatorOnboardingDraft,
  type CreatorOnboardingDraft,
} from '@/lib/onboarding-draft';

const InstagramOnboardingModal = dynamic(
  () => import('@/components/InstagramOnboardingModal').then(mod => mod.InstagramOnboardingModal),
  { ssr: false }
);

const TikTokOnboardingModal = dynamic(
  () => import('@/components/TikTokOnboardingModal').then(mod => mod.TikTokOnboardingModal),
  { ssr: false }
);

export default function OnboardingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isIgModalOpen, setIsIgModalOpen] = useState(false);
  const [isTtModalOpen, setIsTtModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // States do Onboarding
  const [handle, setHandle] = useState('');
  const [niche, setNiche] = useState('');
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [audienceTarget, setAudienceTarget] = useState('');
  const [desiredMonetization, setDesiredMonetization] = useState('');
  const [draftStorageKey, setDraftStorageKey] = useState<string | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);

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
  const [assistantStyle, setAssistantStyle] = useState('');

  const buildCurrentDraft = useCallback((): CreatorOnboardingDraft => ({
    ...createEmptyCreatorOnboardingDraft(),
    step,
    interviewStep,
    handle,
    niche,
    audienceTarget,
    answers: {
      careerGoal: dream,
      currentMonetization: incomeTarget,
      desiredMonetization,
      followersGoal,
      primaryFormats: frequency,
      availability,
      difficulty,
      brandExperience: experience,
      growthHistory: boughtFollowers,
      assistantStyle,
    },
  }), [assistantStyle, audienceTarget, boughtFollowers, desiredMonetization, difficulty, dream, experience, followersGoal, frequency, handle, incomeTarget, interviewStep, niche, step, availability]);

  useEffect(() => {
    let isMounted = true;

    const restoreDraft = async () => {
      try {
        const { data } = await api.get<{ id?: string }>('/auth/me');
        const userId = typeof data.id === 'string' ? data.id : '';
        const storageKey = getCreatorOnboardingDraftStorageKey(userId);

        // Never migrate an unscoped legacy draft: it may belong to a prior user of this browser tab.
        clearLegacyCreatorOnboardingDraft(window.sessionStorage);
        const restored = loadCreatorOnboardingDraft(window.sessionStorage, storageKey);
        if (!isMounted) return;

        setStep(restored.step);
        setInterviewStep(restored.interviewStep);
        setHandle(restored.handle);
        setNiche(restored.niche);
        setAudienceTarget(restored.audienceTarget);
        setDream(restored.answers.careerGoal);
        setFollowersGoal(restored.answers.followersGoal);
        setIncomeTarget(restored.answers.currentMonetization);
        setDesiredMonetization(restored.answers.desiredMonetization);
        setDifficulty(restored.answers.difficulty);
        setExperience(restored.answers.brandExperience);
        setAvailability(restored.answers.availability);
        setFrequency(restored.answers.primaryFormats);
        setBoughtFollowers(restored.answers.growthHistory);
        setAssistantStyle(restored.answers.assistantStyle);
        setDraftStorageKey(storageKey);
      } catch (error) {
        if (!isMounted) return;
        console.warn('Não foi possível restaurar o rascunho do onboarding:', error);
      } finally {
        if (isMounted) setIsDraftHydrated(true);
      }
    };

    void restoreDraft();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isDraftHydrated || !draftStorageKey) return;
    try {
      // Only creator-entered draft answers are stored here; sessions and OAuth tokens remain out of browser storage.
      saveCreatorOnboardingDraft(window.sessionStorage, draftStorageKey, buildCurrentDraft());
    } catch (error) {
      console.warn('Não foi possível salvar o rascunho do onboarding:', error);
    }
  }, [buildCurrentDraft, draftStorageKey, isDraftHydrated]);

  async function fetchIntegrations() {
    try {
      const connRes = await api.get<{ platforms?: string[] }>('/integrations/connected');
      setConnectedPlatforms(Array.isArray(connRes.data.platforms)
        ? connRes.data.platforms.map((platform) => String(platform).toUpperCase())
        : []);
    } catch (err) {
      console.error('Erro ao buscar integrações:', err);
    }
  }

  useEffect(() => {
     if (step !== 5) return;
     const fetchTimer = window.setTimeout(() => {
       void fetchIntegrations();
     }, 0);
     return () => window.clearTimeout(fetchTimer);
  }, [step]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data && data.type === 'social-auth-success') {
        toast.success(`✦ ${data.platform?.toUpperCase()} conectado com sucesso!`);
        fetchIntegrations();
      } else if (data && data.type === 'social-auth-error') {
        toast.error(data.error || 'Erro ao conectar com a rede social.');
      }
    };

    window.addEventListener('message', handleMessage);

    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const platform = params.get('platform');
    
    if (status === 'success' && platform === 'instagram') {
      toast.success('✦ Instagram conectado com sucesso (Real)!');
      window.setTimeout(() => void fetchIntegrations(), 0);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'success' && platform === 'tiktok') {
      toast.success('✦ TikTok conectado com sucesso!');
      window.setTimeout(() => void fetchIntegrations(), 0);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'error') {
      const errorType = params.get('error');
      const isAccountTypeError = errorType === 'no_business_account' || errorType === 'no_creator_account';
      const errorMsg = isAccountTypeError
        ? 'Sua conta do Instagram é Pessoal. A Meta exige uma conta do tipo Criador de Conteúdo ou Comercial para conectar à API.'
        : 'Erro ao conectar com a rede social.';
      toast.error(errorMsg);
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      const draft = buildCurrentDraft();
      const derivedObj = deriveCareerObjective(draft.answers.careerGoal);
      const interviewPayload = buildAiInterviewPayload(draft);
      await api.patch('/influencers/profile', {
        handle,
        niche,
        careerObjective: derivedObj,
        aiInterview: interviewPayload,
        onboardingCompleted: true
      });
      
      if (draftStorageKey) clearCreatorOnboardingDraft(window.sessionStorage, draftStorageKey);
      Cookies.set('influnext_onboarding', 'true', { expires: 7 });
      toast.success('✦ Sistema Configurado! Bem-vindo à nova elite digital.');
      router.push('/dashboard/influencer');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao salvar onboarding.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectSimulate = async (platform: 'TIKTOK', username?: string, followersRange?: string) => {
    try {
      setIsSaving(true);
      await api.post('/integrations/simulate', { platform, username, followersRange });
      Cookies.set('influnext_onboarding', 'true', { expires: 7 });
      toast.success(`✦ ${platform === 'INSTAGRAM' ? 'Instagram' : 'TikTok'} conectado com sucesso (Simulado)!`);
      
      const draft = buildCurrentDraft();
      const derivedObj = deriveCareerObjective(draft.answers.careerGoal);
      const interviewPayload = buildAiInterviewPayload(draft);
      await api.patch('/influencers/profile', {
        handle: handle || username,
        niche: niche || 'Lifestyle',
        careerObjective: derivedObj,
        aiInterview: interviewPayload,
        onboardingCompleted: true
      });
      
      if (draftStorageKey) clearCreatorOnboardingDraft(window.sessionStorage, draftStorageKey);
      router.push('/dashboard/influencer');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(errorObj.response?.data?.error || 'Erro ao simular conexão.');
    } finally {
      setIsSaving(false);
      setIsIgModalOpen(false);
      setIsTtModalOpen(false);
    }
  };

  if (!isDraftHydrated) {
    return (
      <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">Retomando seu onboarding…</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#050508] text-white'} flex flex-col items-center justify-center p-6 overflow-hidden`}>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${theme === 'light' ? 'bg-orange-500/5' : 'bg-orange-500/10'} blur-[120px] rounded-full animate-pulse`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${theme === 'light' ? 'bg-blue-500/5' : 'bg-blue-500/10'} blur-[120px] rounded-full animate-pulse`} />
      </div>

      <div className="w-full max-w-xl relative">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${s <= step ? 'bg-orange-500 shadow-[0_0_15px_rgba(217,107,39,0.6)]' : theme === 'light' ? 'bg-slate-200' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-4">
              <div className={`w-16 h-16 ${theme === 'light' ? 'bg-orange-50' : 'bg-orange-500/10'} rounded-2xl flex items-center justify-center border ${theme === 'light' ? 'border-orange-100' : 'border-orange-500/20'}`}>
                <Sparkles className="w-8 h-8 text-orange-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                BEM-VINDO À <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-blue-500">NOVA ERA</span> DA INFLUÊNCIA.
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

        {/* STEP 2: PROFILE */}
        {step === 2 && (
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
                     className={`h-16 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900/50 border-zinc-800'} rounded-2xl focus:border-orange-500 transition-all font-black text-xl pl-12`}
                   />
                   <AtSign className={`absolute left-4 top-5 w-6 h-6 ${theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} tracking-[0.2em]`}>Nicho e Subnicho</label>
                <div className="relative">
                   <Input 
                     value={niche}
                     onChange={(e) => setNiche(e.target.value)}
                      placeholder="Games, Lifestyle, Tech..."
                     className={`h-16 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900/50 border-zinc-800'} rounded-2xl focus:border-orange-500 transition-all font-black text-lg pl-12`}
                   />
                   <Target className={`absolute left-4 top-5 w-6 h-6 ${theme === 'light' ? 'text-slate-300' : 'text-zinc-700'}`} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} tracking-[0.2em]`}>Para Quem Você Cria?</label>
                <Input
                  value={audienceTarget}
                  onChange={(e) => setAudienceTarget(e.target.value)}
                  placeholder="Ex.: empreendedoras iniciantes interessadas em moda acessível"
                  className={`h-16 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900/50 border-zinc-800'} rounded-2xl focus:border-orange-500 transition-all font-bold text-base px-5`}
                />
              </div>
              <div className="space-y-2">
                <label className={`text-[10px] font-black uppercase ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} tracking-[0.2em]`}>Monetização Que Quer Priorizar</label>
                <Input
                  value={desiredMonetization}
                  onChange={(e) => setDesiredMonetization(e.target.value)}
                  placeholder="Ex.: publis, mentoria, afiliados ou produtos próprios"
                  className={`h-16 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-zinc-900/50 border-zinc-800'} rounded-2xl focus:border-orange-500 transition-all font-bold text-base px-5`}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(1)} variant="outline" className={`h-14 px-10 rounded-2xl ${theme === 'light' ? 'border-slate-200 bg-white text-slate-400' : 'border-white/[0.05] bg-white/[0.02] text-zinc-500'} font-black tracking-widest uppercase text-[10px]`}>Voltar</Button>
              <Button 
                onClick={() => {
                    if (!handle || !niche || !audienceTarget || !desiredMonetization) {
                       toast.error('Preencha perfil, nicho, público e monetização desejada para prosseguir.');
                      return;
                   }
                    setStep(3);
                }} 
                className="h-14 flex-1 rounded-[1.5rem] bg-orange-600 hover:bg-orange-500 font-black shadow-[0_15px_30px_rgba(124,58,237,0.3)] transition-all"
              >
                PROSSEGUIR
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CAREER INTERVIEW */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                  Entrevista de Alinhamento IA // Pergunta {interviewStep} de 9
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                {interviewStep === 1 && "Qual é seu objetivo principal nos próximos 12 meses?"}
                {interviewStep === 2 && "Sua meta de seguidores"}
                {interviewStep === 3 && "Como você monetiza hoje?"}
                {interviewStep === 4 && "Seu maior desafio hoje"}
                {interviewStep === 5 && "Qual sua experiência com publis e marcas?"}
                {interviewStep === 6 && "Seus horários mais disponíveis?"}
                {interviewStep === 7 && "Qual formato e ritmo você consegue sustentar?"}
                {interviewStep === 8 && "Você usou estratégia de crescimento não orgânico?"}
                {interviewStep === 9 && "Como prefere receber orientação?"}
              </h2>
              <p className={`${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} text-xs font-bold uppercase tracking-widest`}>
                {interviewStep === 1 && "Isso orienta o foco estratégico do seu plano"}
                {interviewStep === 2 && "Onde você planeja estar em 12 meses?"}
                {interviewStep === 3 && "Este é seu ponto de partida, separado da meta de monetização"}
                {interviewStep === 4 && "Vamos concentrar as primeiras recomendações aqui"}
                {interviewStep === 5 && "Isso ajuda a sugerir o suporte comercial adequado ao seu momento"}
                {interviewStep === 6 && "Qual o melhor momento para sua rotina de criação?"}
                {interviewStep === 7 && "Prefira uma capacidade sustentável a uma promessa impossível"}
                {interviewStep === 8 && "Opcional. A resposta só dá contexto e não altera score, alcance ou prioridade automaticamente"}
                {interviewStep === 9 && "Opcional e separado da sua análise estratégica"}
              </p>
            </div>

            {/* Questions Wizard */}
            <div className="space-y-4 min-h-[260px]">
              {interviewStep === 1 && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    "Parcerias pagas com marcas",
                    "Vender produtos, serviços ou consultorias",
                    "Crescer audiência e alcance",
                    "Ser referência no meu nicho"
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
                    "Ainda não monetizo meu conteúdo",
                    "Publis e parcerias com marcas",
                    "Produtos, serviços ou mentorias",
                    "Afiliados, anúncios ou comissões"
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
                    "Ainda não fechei parceria paga",
                    "Já fiz propostas, mas sem fechar",
                    "Já fechei algumas campanhas",
                    "Tenho parcerias recorrentes"
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
                    "Reels e vídeos curtos — 3x ou mais por semana",
                    "Stories e bastidores — quase diariamente",
                    "Feed e carrosséis — semanalmente",
                    "Ainda estou estruturando a rotina"
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
                    "Não, meu crescimento foi orgânico",
                    "Sim, já usei no passado",
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
                    { value: "direta", label: "Direta e objetiva" },
                    { value: "didatica", label: "Estratégica e didática" },
                    { value: "motivadora", label: "Motivadora e prática" },
                    { value: "sem-preferencia", label: "Sem preferência" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAssistantStyle(option.value)}
                      className={`p-5 rounded-[1.2rem] border-2 text-left flex items-center justify-between transition-all ${
                        assistantStyle === option.value
                          ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                          : theme === 'light'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-zinc-800 bg-transparent hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-bold text-xs md:text-sm uppercase tracking-wide">{option.label}</span>
                      {assistantStyle === option.value && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
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
                    setStep(2);
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
                    toast.error('Por favor, selecione seu objetivo principal.');
                    return;
                  }
                  if (interviewStep === 2 && !followersGoal) {
                    toast.error('Por favor, selecione sua meta.');
                    return;
                  }
                  if (interviewStep === 3 && !incomeTarget) {
                    toast.error('Por favor, selecione sua monetização atual.');
                    return;
                  }
                  if (interviewStep === 4 && !difficulty) {
                    toast.error('Por favor, selecione seu maior desafio.');
                    return;
                  }
                  if (interviewStep === 5 && !experience) {
                    toast.error('Por favor, selecione sua experiência com marcas.');
                    return;
                  }
                  if (interviewStep === 6 && !availability) {
                    toast.error('Por favor, selecione seus horários disponíveis.');
                    return;
                  }
                  if (interviewStep === 7 && !frequency) {
                    toast.error('Por favor, selecione um formato e ritmo de conteúdo.');
                    return;
                  }

                  if (interviewStep < 9) {
                    setInterviewStep(interviewStep + 1);
                  } else {
                    setStep(4);
                  }
                }}
                className="h-14 flex-1 rounded-[1.5rem] bg-slate-900 hover:bg-emerald-600 hover:text-white dark:bg-white dark:text-black font-black transition-all text-[10px] tracking-widest uppercase"
              >
                {interviewStep < 9 ? "Avançar" : "Ir para conexões"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: SOCIAL CONNECTIONS */}
        {step === 4 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Conexões</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase">Conexões_Neurais</h2>
               <p className={`${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} text-sm font-bold uppercase tracking-widest`}>Conecte dados reais quando fizer sentido para seu planejamento</p>
            </div>

            <div className="space-y-4">
               {/* Instagram Button */}
               <button 
                  onClick={() => setIsIgModalOpen(true)}
                  disabled={connectedPlatforms.includes('INSTAGRAM')}
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
                         <p className="font-black text-sm uppercase tracking-widest text-blue-600 dark:text-blue-400">{connectedPlatforms.includes('INSTAGRAM') ? 'Instagram conectado' : 'Conectar Instagram'}</p>
                         <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-zinc-400'} font-bold uppercase`}>{connectedPlatforms.includes('INSTAGRAM') ? 'Conta já reconhecida' : 'Sincronizar conta e métricas'}</p>
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
                  onClick={() => connectedPlatforms.includes('TIKTOK') ? toast.message('TikTok já está conectado a esta conta.') : setIsTtModalOpen(true)}
                 className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${connectedPlatforms.includes('TIKTOK') ? 'border-emerald-500 bg-emerald-500/5' : theme === 'light' ? 'border-slate-200 bg-white hover:border-slate-400' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
               >
                  <div className="flex items-center gap-6">
                     <div className={`p-4 ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'} rounded-2xl group-hover:scale-110 transition-transform`}>
                        <Globe size={24} />
                     </div>
                     <div className="text-left">
                         <p className="font-black text-sm uppercase tracking-widest">{connectedPlatforms.includes('TIKTOK') ? 'TikTok conectado' : 'Conectar TikTok'}</p>
                         <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-zinc-500'} font-bold uppercase`}>{connectedPlatforms.includes('TIKTOK') ? 'Conta já reconhecida' : 'Sincronizar tendências e performance'}</p>
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
                <p className={`text-[11px] font-bold ${theme === 'light' ? 'text-emerald-700' : 'text-emerald-300'} leading-relaxed uppercase`}>A conexão adiciona dados da conta quando disponíveis. Ela não cria bônus automático de score ou prioridade no marketplace.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(3)} variant="outline" className={`h-14 px-10 rounded-2xl ${theme === 'light' ? 'border-slate-200 bg-white text-slate-400' : 'border-white/[0.05] bg-white/[0.02] text-zinc-500'} font-black tracking-widest uppercase text-[10px]`}>Voltar</Button>
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
        <Rocket className={`w-4 h-4 ${theme === 'light' ? 'text-slate-900' : 'text-orange-500'}`} />
        <span className={`text-[10px] font-black tracking-[0.4em] ${theme === 'light' ? 'text-slate-900' : 'text-zinc-500'} uppercase`}>InfluNext // Neural_Experience_2026</span>
      </div>
      <InstagramOnboardingModal 
        isOpen={isIgModalOpen}
        onClose={() => setIsIgModalOpen(false)}
      />
      <TikTokOnboardingModal 
        isOpen={isTtModalOpen}
        onClose={() => setIsTtModalOpen(false)}
        onConfirm={(mode: 'oauth' | 'simulate', username?: string, followersRange?: string) => {
          if (mode === 'simulate') {
            handleConnectSimulate('TIKTOK', username, followersRange);
          }
          setIsTtModalOpen(false);
        }}
      />

    </div>
  );
}
