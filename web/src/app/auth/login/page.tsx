'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, LoginResponse } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialPlatform, setSocialPlatform] = useState<'INSTAGRAM' | 'TIKTOK'>('INSTAGRAM');
  const [socialHandle, setSocialHandle] = useState('');
  const [socialGender, setSocialGender] = useState<'masculino' | 'feminino'>('feminino');
  const [socialNiche, setSocialNiche] = useState('Lifestyle');

  const openSocialModal = (platform: 'INSTAGRAM' | 'TIKTOK') => {
    setSocialPlatform(platform);
    setSocialHandle('');
    setSocialModalOpen(true);
  };

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialHandle) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post<any>('/auth/social-login', {
        platform: socialPlatform,
        username: socialHandle,
        gender: socialGender,
        niche: socialNiche
      });
      setSocialModalOpen(false);
      completeLogin(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao conectar via rede social.');
    } finally {
      setIsLoading(false);
    }
  };

  const cookieOptions: Cookies.CookieAttributes = {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  };

  const completeLogin = (data: LoginResponse) => {
    Cookies.set('influnext_token', data.token, cookieOptions);
    Cookies.set('influnext_role', data.user.role, cookieOptions);
    Cookies.set('influnext_onboarding', data.user.onboardingCompleted ? 'true' : 'false', cookieOptions);

    if (!data.user.onboardingCompleted && data.user.role === 'INFLUENCER') {
      router.push('/onboarding');
      return;
    }

    if (data.user.role === 'INFLUENCER') router.push('/dashboard/influencer');
    else if (data.user.role === 'COMPANY') router.push('/dashboard/company');
    else router.push('/dashboard/admin');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post<any>('/auth/login', { email, password });
      if (res.data.status === 'PENDING_2FA') {
        setTempToken(res.data.tempToken);
        setStep('otp');
      } else {
        completeLogin(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciais inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/2fa/verify', { tempToken, code: otpCode });
      completeLogin(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Logo + tagline */}
      <div className="text-center space-y-3">
        <Logo size="lg" href="/" className="justify-center" variant="light" />
        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-10 bg-white/10" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
            Studio Control Center
          </p>
          <div className="h-px w-10 bg-white/10" />
        </div>
      </div>

      {/* Card */}
      <div className="relative">
        {/* Glow border */}
        <div className="absolute -inset-px rounded-[2.5rem] bg-gradient-to-b from-violet-500/20 via-pink-500/10 to-transparent pointer-events-none" />
        
        <div
          className="relative bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 space-y-8 overflow-hidden"
          style={{ backdropFilter: 'blur(40px)' }}
        >
          {/* Inner dynamic glows */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-pink-650/10 blur-[60px] pointer-events-none" />

          {/* Inner top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tighter">
                {step === 'credentials' ? 'Acessar Studio' : 'Verificação 2FA'}
              </h1>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.25em]">
                {step === 'credentials'
                  ? 'Identifique-se para entrar no ecossistema'
                  : 'Insira o código do seu app autenticador'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-[10px] text-center font-black uppercase tracking-widest animate-in shake">
                {error}
              </div>
            )}

            {step === 'credentials' ? (
              <>
                <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">
                    E-mail Profissional
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemplo@email.com"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-sm font-medium text-white placeholder:text-zinc-650 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-sm font-medium text-white placeholder:text-zinc-650 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.35em] rounded-2xl shadow-xl shadow-violet-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sincronizando...
                    </span>
                  ) : (
                    <>Entrar no Dashboard <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <span className="relative px-3 bg-[#0a0a10] text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                  ou acesse instantaneamente via
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openSocialModal('INSTAGRAM')}
                  className="h-12 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-pink-500/30 transition-all rounded-2xl flex items-center justify-center gap-2 group"
                >
                  <svg className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Instagram</span>
                </button>

                <button
                  type="button"
                  onClick={() => openSocialModal('TIKTOK')}
                  className="h-12 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-zinc-300/30 transition-all rounded-2xl flex items-center justify-center gap-2 group"
                >
                  <svg className="w-4 h-4 text-zinc-100 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">TikTok</span>
                </button>
              </div>
              </>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Shield className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-zinc-400 text-xs">Digite o código de 6 dígitos do seu autenticador</p>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-2xl px-4 py-6 text-white text-center text-3xl tracking-[0.5em] font-black focus:outline-none focus:border-violet-500/50 transition-all"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl"
                >
                  {isLoading ? 'Verificando...' : 'Confirmar Identidade'}
                </button>
              </form>
            )}

            {/* Bottom links */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <Link href="/auth/signup" className="text-[9px] text-zinc-650 hover:text-violet-400 transition-colors font-black uppercase tracking-widest">
                Criar conta grátis
              </Link>
              <Link href="/" className="text-[9px] text-zinc-650 hover:text-zinc-350 transition-colors font-black uppercase tracking-widest">
                Início
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 opacity-30">
        <Shield className="w-3 h-3 text-zinc-500" />
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
          SSL · AES-256 · Conexão Segura
        </span>
      </div>

      {socialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm bg-[#0a0a0f] border border-white/10 rounded-[2rem] p-6 space-y-5 shadow-2xl overflow-hidden">
            {/* Modal inner glows */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-purple-650/10 blur-[45px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-pink-650/10 blur-[45px] pointer-events-none" />

            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            
            <div className="relative z-10 space-y-5">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
                  Conectar {socialPlatform === 'INSTAGRAM' ? 'Instagram' : 'TikTok'}
                </h2>
                <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                  Acesso Neural Simulado
                </p>
              </div>

              <form onSubmit={handleSocialLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-1">
                    @ Nome de Usuário ({socialPlatform === 'INSTAGRAM' ? 'Instagram' : 'TikTok'})
                  </label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    required
                    placeholder={socialPlatform === 'INSTAGRAM' ? '@seu_perfil' : '@seu_tiktok'}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-zinc-650 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-1">
                    Nicho de Atuação
                  </label>
                  <select
                    value={socialNiche}
                    onChange={(e) => setSocialNiche(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-purple-500/50 transition-all"
                  >
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Games">Games & Esports</option>
                    <option value="Tech">Tecnologia & Programação</option>
                    <option value="Moda">Moda & Beleza</option>
                    <option value="Finanças">Finanças & Negócios</option>
                    <option value="Saúde">Saúde & Fitness</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.25em] ml-1">
                    Gênero (Para Personalização da IA)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSocialGender('feminino')}
                      className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                        socialGender === 'feminino'
                          ? 'border-purple-500 bg-purple-500/10 text-white'
                          : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]'
                      }`}
                    >
                      Feminino (Valentina)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSocialGender('masculino')}
                      className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all ${
                        socialGender === 'masculino'
                          ? 'border-purple-500 bg-purple-500/10 text-white'
                          : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]'
                      }`}
                    >
                      Masculino (Vincenzo)
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSocialModalOpen(false)}
                    className="flex-1 h-11 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] text-[8px] font-black uppercase tracking-widest text-zinc-450 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !socialHandle}
                    className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-[8px] font-black uppercase tracking-widest text-white rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Conectando...' : 'Conectar & Entrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
