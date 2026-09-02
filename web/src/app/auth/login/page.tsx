'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, LoginResponse } from '@/lib/api';
import { getSocialAuthUrl, type SocialAuthProvider } from '@/lib/social-auth';
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

  const handleSocialRedirect = async (platform: SocialAuthProvider) => {
    try {
      setIsLoading(true);
      setError('');
      window.location.href = await getSocialAuthUrl(platform);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login social indisponível. Use e-mail e senha.');
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

    if (!data.user.onboardingCompleted) {
      if (data.user.role === 'INFLUENCER') router.push('/onboarding');
      else if (data.user.role === 'COMPANY') router.push('/onboarding/company');
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
      const res = await api.post<LoginResponse & { status?: string; tempToken?: string }>('/auth/login', { email, password });
      if (res.data.status === 'PENDING_2FA' && res.data.tempToken) {
        setTempToken(res.data.tempToken);
        setStep('otp');
      } else {
        completeLogin(res.data);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Credenciais inválidas.');
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj.response?.data?.error || 'Código inválido.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Card */}
      <div className="relative">
        {/* Glow border */}
        <div className="absolute -inset-px rounded-[2.5rem] bg-gradient-to-b from-orange-500/25 via-amber-500/10 to-transparent pointer-events-none" />
        
        <div
          className="relative bg-white border border-zinc-200/80 shadow-xl shadow-zinc-150/50 rounded-[2.5rem] p-8 md:p-10 space-y-8 overflow-hidden"
          style={{ backdropFilter: 'blur(40px)' }}
        >
          {/* Inner dynamic glows */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-500/5 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/3 blur-[60px] pointer-events-none" />

          {/* Inner top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

          <div className="relative z-10 space-y-8">
            {/* Logo + tagline (moved inside card for mobile centering and spacing) */}
            <div className="text-center space-y-3 pt-4 pb-6 border-b border-zinc-100">
              <Logo size="lg" href="/" className="justify-center" variant="dark" />
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-10 bg-zinc-200" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                  Studio Control Center
                </p>
                <div className="h-px w-10 bg-zinc-200" />
              </div>
            </div>

            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">
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
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl text-[10px] text-center font-black uppercase tracking-widest animate-in shake">
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
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 transition-all"
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
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-[#d96b27] hover:bg-[#c65e21] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.35em] rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                  <div className="w-full border-t border-zinc-100"></div>
                </div>
                <span className="relative px-3 bg-white text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                  ou autorize no provedor
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialRedirect('google')}
                  disabled={isLoading}
                  className="h-12 bg-zinc-50/50 border border-zinc-200/80 hover:bg-zinc-100/50 hover:border-orange-500/30 transition-all rounded-2xl flex items-center justify-center gap-1.5 group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600 group-hover:text-zinc-900 transition-colors">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialRedirect('instagram')}
                  disabled={isLoading}
                  className="h-12 bg-zinc-50/50 border border-zinc-200/80 hover:bg-zinc-100/50 hover:border-orange-500/30 transition-all rounded-2xl flex items-center justify-center gap-1.5 group"
                >
                  <svg className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600 group-hover:text-zinc-900 transition-colors">Instagram</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialRedirect('tiktok')}
                  disabled={isLoading}
                  className="h-12 bg-zinc-50/50 border border-zinc-200/80 hover:bg-zinc-100/50 hover:border-orange-500/30 transition-all rounded-2xl flex items-center justify-center gap-1.5 group"
                >
                  <svg className="w-4 h-4 text-zinc-800 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                  </svg>
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600 group-hover:text-zinc-900 transition-colors">TikTok</span>
                </button>
              </div>
              </>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-zinc-500 text-xs font-medium">Digite o código de 6 dígitos do seu autenticador</p>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-6 text-zinc-900 text-center text-3xl tracking-[0.5em] font-black focus:outline-none focus:border-orange-500/50 focus:bg-white transition-all"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-600/10"
                >
                  {isLoading ? 'Verificando...' : 'Confirmar Identidade'}
                </button>
              </form>
            )}

            {/* Bottom links */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <Link href="/auth/signup" className="text-[9px] text-zinc-400 hover:text-[#d96b27] transition-colors font-black uppercase tracking-widest">
                Criar conta grátis
              </Link>
              <Link href="/" className="text-[9px] text-zinc-400 hover:text-zinc-600 transition-colors font-black uppercase tracking-widest">
                Início
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 opacity-30">
        <Shield className="w-3 h-3 text-zinc-500" />
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
          SSL · AES-256 · Conexão Segura
        </span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Link href="/termos" target="_blank" className="text-[8px] text-zinc-400 hover:text-[#d96b27] transition-colors font-bold uppercase tracking-widest">
          Termos de Uso
        </Link>
        <span className="text-zinc-300">·</span>
        <Link href="/privacidade" target="_blank" className="text-[8px] text-zinc-400 hover:text-[#d96b27] transition-colors font-bold uppercase tracking-widest">
          Privacidade
        </Link>
      </div>

    </div>
  );
}
