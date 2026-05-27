'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, LoginResponse } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cookieOptions: Cookies.CookieAttributes = {
    expires: 7,
    secure: process.env.NODE_ENV === 'production', // Só exige HTTPS em produção
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Lax localmente, None em prod (cross-domain)
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
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
      
      {/* Background layer inside the auth wrapper if needed, or rely on layout */}
      
      <div className="text-center">
        <Logo size="lg" href="/" className="justify-center" />
        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
          Studio Control Center
        </p>
      </div>

      {/* Card Glassmorphic */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 rounded-[3rem] blur opacity-25"></div>
        <div 
          className="relative bg-white/10 border border-white/20 rounded-[3rem] p-10 space-y-8 shadow-2xl overflow-hidden"
          style={{ backdropFilter: 'blur(30px)' }}
        >
          <div className="space-y-1 relative z-10">
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
              {step === 'credentials' ? 'Acessar Studio' : 'Verificação'}
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
              {step === 'credentials' ? 'Identifique-se para entrar no ecossistema' : 'Insira o código do seu app autenticador'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-[9px] text-center font-black uppercase tracking-widest animate-in shake">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                  E-mail Profissional
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="exemplo@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white/15 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white/15 transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {isLoading ? 'SINCRONIZANDO...' : 'ENTRAR NO DASHBOARD'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-6 relative z-10">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-6 text-slate-900 text-center text-3xl tracking-[0.5em] font-black focus:outline-none focus:bg-white/15 transition-all"
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl"
              >
                {isLoading ? 'Verificando...' : 'Confirmar Identidade'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
            <Link href="/auth/signup" className="text-[9px] text-slate-400 hover:text-slate-900 transition-colors font-black uppercase tracking-widest">
              Criar conta grátis
            </Link>
            <Link href="/" className="text-[9px] text-slate-400 hover:text-slate-900 transition-colors font-black uppercase tracking-widest">
              Início
            </Link>
          </div>
        </div>
      </div>
    </div>
    );
}
