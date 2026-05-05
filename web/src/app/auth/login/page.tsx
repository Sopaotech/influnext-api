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
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
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
      <div className="text-center">
        <Logo size="lg" href="/" className="justify-center" />
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-600">
          Plataforma de Marketing de Influência
        </p>
      </div>


        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-b from-purple-500/20 via-purple-500/5 to-transparent" />
          <div className="relative bg-[#0d0b1a]/90 backdrop-blur-3xl rounded-[2rem] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.8)] space-y-8 border border-white/[0.06]">

            <div className="space-y-1">
              <h1 className="text-xl font-black text-white tracking-tight">
                {step === 'credentials' ? 'Entrar na plataforma' : 'Verificação em dois fatores'}
              </h1>
              <p className="text-zinc-600 text-xs">
                {step === 'credentials' ? 'Acesse sua conta para continuar.' : 'Insira o código do seu app autenticador.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/8 border border-red-500/25 text-red-400 p-3 rounded-xl text-xs text-center font-semibold">
                {error}
              </div>
            )}

            {step === 'credentials' ? (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                      Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
                    />
                  </div>

                  <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-[0_15px_30px_rgba(139,92,246,0.2)] hover:shadow-[0_20px_40px_rgba(139,92,246,0.3)] transition-all duration-500 active:scale-[0.98]"
              >
                {isLoading ? 'PROCESSANDO...' : 'Acessar Console →'}
              </button>

              </form>
              </>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <p className="text-zinc-400 text-xs text-center">
                  Código de 6 dígitos do seu app autenticador
                </p>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-black focus:outline-none focus:border-purple-500/40 transition-all"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-12 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-sm"
                >
                  {isLoading ? 'Verificando...' : 'Confirmar identidade'}
                </button>
              </form>
            )}

            <div className="pt-1 border-t border-white/[0.05] flex items-center justify-between">
              <Link href="/auth/signup" className="text-xs text-zinc-600 hover:text-purple-400 transition-colors font-semibold">
                Criar conta gratis
              </Link>
              <Link href="/" className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors">
                Voltar ao inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
}
