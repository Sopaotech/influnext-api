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
  Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // States do Onboarding
  const [accentColor, setAccentColor] = useState('#a855f7');
  const [handle, setHandle] = useState('');
  const [niche, setNiche] = useState('');
  const [authUrls, setAuthUrls] = useState<any>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  const colors = [
    { name: 'Roxo Elite', value: '#a855f7' },
    { name: 'Azul Tech', value: '#3b82f6' },
    { name: 'Verde ROI', value: '#10b981' },
    { name: 'Rosa Impacto', value: '#f43f5e' },
    { name: 'Âmbar Criativo', value: '#f59e0b' }
  ];

  useEffect(() => {
     if (step === 4) {
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

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      await api.patch('/influencers/profile', {
        handle,
        niche,
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
    if (!url) {
       toast.error('Configuração de API pendente no servidor.');
       return;
    }
    // Save current onboarding state to cookies/localStorage if needed before redirect
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div className="w-full max-w-xl relative">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${s <= step ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <Sparkles className="w-8 h-8 text-purple-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                BEM-VINDO À <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">NOVA ERA</span> DA INFLUÊNCIA.
              </h1>
              <p className="text-zinc-400 text-lg font-medium max-w-md">
                Você acaba de entrar no workspace mais avançado do mercado. Vamos configurar sua inteligência para começar.
              </p>
            </div>
            <Button 
              onClick={() => setStep(2)}
              className="group bg-white text-black hover:bg-zinc-200 px-10 h-16 rounded-[1.5rem] font-black text-lg transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
            >
              INICIAR PROTOCOLO <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {/* STEP 2: IDENTITY */}
        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">VISUAL_SISTEMA</h2>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Tema e Identidade de Cor</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setTheme('dark')}
                className={`p-6 rounded-[2rem] border-2 text-left space-y-4 transition-all ${theme === 'dark' ? 'border-purple-500 bg-purple-500/5' : 'border-zinc-800 bg-transparent opacity-40 hover:opacity-100'}`}
              >
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5"><Moon className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <p className="font-black text-sm uppercase tracking-widest">Dark Mode</p>
                  <p className="text-[10px] text-zinc-500 font-bold">Foco total em performance.</p>
                </div>
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`p-6 rounded-[2rem] border-2 text-left space-y-4 transition-all ${theme === 'light' ? 'border-purple-500 bg-white/10' : 'border-zinc-800 bg-transparent opacity-40 hover:opacity-100'}`}
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200"><Sun className="w-6 h-6 text-purple-400" /></div>
                <div>
                  <p className="font-black text-sm uppercase tracking-widest">Clean Mode</p>
                  <p className="text-[10px] text-zinc-500 font-bold">Clareza e precisão analítica.</p>
                </div>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Cromatismo de Destaque</p>
              <div className="flex flex-wrap gap-5 justify-between px-4">
                {colors.map((c) => (
                  <button 
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${accentColor === c.value ? 'border-white scale-125 shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-40'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(1)} variant="outline" className="h-14 px-10 rounded-2xl border-white/[0.05] bg-white/[0.02] text-zinc-500 font-black tracking-widest uppercase text-[10px] hover:text-white">Voltar</Button>
              <Button onClick={() => setStep(3)} className="h-14 flex-1 rounded-[1.5rem] bg-purple-600 hover:bg-purple-500 font-black shadow-[0_15px_30px_rgba(124,58,237,0.3)] transition-all">PRÓXIMO PASSO</Button>
            </div>
          </div>
        )}

        {/* STEP 3: PROFILE */}
        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight">IDENTIDADE_PÚBLICA</h2>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Como as marcas encontrarão você</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Sua Presença (@Handle)</label>
                <div className="relative">
                   <Input 
                     value={handle}
                     onChange={(e) => setHandle(e.target.value)}
                     placeholder="o_melhor_criador"
                     className="h-16 bg-zinc-900/50 border-zinc-800 rounded-2xl focus:border-purple-500 transition-all font-black text-xl pl-12"
                   />
                   <AtSign className="absolute left-4 top-5 w-6 h-6 text-zinc-700" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Nicho de Domínio</label>
                <div className="relative">
                   <Input 
                     value={niche}
                     onChange={(e) => setNiche(e.target.value)}
                     placeholder="Games, Lifestyle, Tech..."
                     className="h-16 bg-zinc-900/50 border-zinc-800 rounded-2xl focus:border-purple-500 transition-all font-black text-lg pl-12"
                   />
                   <Target className="absolute left-4 top-5 w-6 h-6 text-zinc-700" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(2)} variant="outline" className="h-14 px-10 rounded-2xl border-white/[0.05] bg-white/[0.02] text-zinc-500 font-black tracking-widest uppercase text-[10px]">Voltar</Button>
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

        {/* STEP 4: SOCIAL CONNECTIONS (THE NEW STEP) */}
        {step === 4 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                 <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">InfluScore_Boost</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">CONEXÕES_NEURAIS</h2>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Sincronize suas contas reais para maximizar seu score</p>
            </div>

            <div className="space-y-4">
               {/* Instagram Button */}
               <button 
                 onClick={() => handleConnect(authUrls?.instagram)}
                 className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${connectedPlatforms.includes('INSTAGRAM') ? 'border-emerald-500 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5 hover:border-rose-500/50'}`}
               >
                  <div className="flex items-center gap-6">
                     <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-400 group-hover:scale-110 transition-transform">
                        <InstagramIcon size={24} />
                     </div>
                     <div className="text-left">
                        <p className="font-black text-sm uppercase tracking-widest">Instagram Official</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Sincronizar Métricas & Audiência</p>
                     </div>
                  </div>
                  {connectedPlatforms.includes('INSTAGRAM') ? (
                     <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                     </div>
                  )}
               </button>

               {/* TikTok Button */}
               <button 
                 onClick={() => handleConnect(authUrls?.tiktok)}
                 className={`w-full p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all group ${connectedPlatforms.includes('TIKTOK') ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
               >
                  <div className="flex items-center gap-6">
                     <div className="p-4 bg-white/10 rounded-2xl text-white group-hover:scale-110 transition-transform">
                        <Globe size={24} />
                     </div>
                     <div className="text-left">
                        <p className="font-black text-sm uppercase tracking-widest">TikTok Engine</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Sincronizar Trends & Performance</p>
                     </div>
                  </div>
                  {connectedPlatforms.includes('TIKTOK') ? (
                     <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                        <ArrowRight size={18} />
                     </div>
                  )}
               </button>
            </div>

            <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
               <Zap className="w-6 h-6 text-emerald-500" />
               <p className="text-[11px] font-bold text-emerald-300 leading-relaxed uppercase">Contas conectadas garantem prioridade no marketplace e InfluScore +40%.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => setStep(3)} variant="outline" className="h-14 px-10 rounded-2xl border-white/[0.05] bg-white/[0.02] text-zinc-500 font-black tracking-widest uppercase text-[10px]">Voltar</Button>
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
      <div className="mt-16 flex items-center gap-3 opacity-30">
        <Rocket className="w-4 h-4 text-purple-500" />
        <span className="text-[10px] font-black tracking-[0.4em] text-zinc-500 uppercase">InfluNext // Neural_Experience_2026</span>
      </div>
    </div>
  );
}
