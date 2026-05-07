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
          <div className="relative bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-8 border border-slate-100">

            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {step === 'credentials' ? 'Entrar na plataforma' : 'Verificação de Identidade'}
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                {step === 'credentials' ? 'Acesse sua conta para continuar.' : 'Insira o código do seu app autenticador.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[10px] text-center font-black uppercase tracking-widest animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            {step === 'credentials' ? (
              <>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      E-mail Profissional
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="exemplo@email.com"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-purple-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Sua Senha
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-purple-300 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-slate-900 hover:bg-purple-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-slate-900/10 transition-all duration-500 active:scale-95"
                  >
                    {isLoading ? 'PROCESSANDO...' : 'Acessar Painel →'}
                  </button>

              </form>
              </>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">
                  Código de 6 dígitos
                </p>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-5 text-slate-900 text-center text-2xl tracking-[0.5em] font-black focus:outline-none focus:border-purple-300 transition-all"
                  placeholder="000000"
                />
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-600/10"
                >
                  {isLoading ? 'Verificando...' : 'Confirmar Identidade'}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
              <Link href="/auth/signup" className="text-[10px] text-slate-400 hover:text-purple-600 transition-colors font-black uppercase tracking-widest">
                Criar conta grátis
              </Link>
              <button 
                onClick={() => {
                  const url = process.env.NEXT_PUBLIC_API_URL;
                  alert(`DEBUG - API URL: ${url || 'FALLBACK (Local)'}\nENV: ${process.env.NODE_ENV}`);
                }}
                className="text-[10px] text-slate-200 hover:text-slate-400 transition-colors font-black uppercase tracking-widest opacity-20"
              >
                Debug
              </button>
              <Link href="/" className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors font-black uppercase tracking-widest">
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
}
