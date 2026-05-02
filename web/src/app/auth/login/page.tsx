'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, LoginResponse } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const completeLogin = (data: LoginResponse) => {
    const cookieOptions: Cookies.CookieAttributes = {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined
    };
    Cookies.set('influnext_token', data.token, cookieOptions);
    Cookies.set('influnext_role', data.user.role, cookieOptions);
    // @ts-ignore
    if (data.user.scoreDecayed && data.user.scoreDecayed > 0) {
      // @ts-ignore
      Cookies.set('influnext_decayed', data.user.scoreDecayed.toString(), cookieOptions);
    }
    if (data.user.role === 'INFLUENCER') router.push('/dashboard/influencer');
    else if (data.user.role === 'COMPANY') router.push('/dashboard/company');
    else router.push('/dashboard/admin');
  };

  return (
    <div className="min-h-screen w-full bg-[#050508] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-[#050508] to-pink-950/20" />

      {/* Animated orbs */}
      <div className="absolute top-[5%] left-[10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[5%] right-[10%] w-80 h-80 bg-pink-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[45%] right-[25%] w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />

      {/* Grid overlay sutil */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full max-w-sm z-10">
        {/* Logo acima do card */}
        <div className="text-center mb-8">
          <Logo size="lg" href="/" className="justify-center" />
          <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest font-bold">
            Plataforma de Marketing de Influência
          </p>
        </div>

        {/* Card com glassmorphism */}
        <div className="relative">
          {/* Borda gradiente */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-purple-500/30 via-transparent to-pink-500/20" />
          
          <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 shadow-[0_40px_60px_rgba(0,0,0,0.6)] space-y-6">
            
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white tracking-tight">
                {step === 'credentials' ? 'Acesse sua conta' : 'Verificação em 2 etapas'}
              </h1>
              <p className="text-zinc-500 text-xs">
                {step === 'credentials' ? 'Digite suas credenciais para continuar.' : 'Insira o código do seu autenticador.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs text-center font-semibold">
                {error}
              </div>
            )}

            {step === 'credentials' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-zinc-400 text-[11px] uppercase font-bold flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-purple-500/50 rounded-xl h-11 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-zinc-400 text-[11px] uppercase font-bold flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-purple-500/50 rounded-xl h-11 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Autenticando...
                    </span>
                  ) : 'Entrar na plataforma'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <p className="text-zinc-400 text-xs text-center">Código de 6 dígitos do seu app autenticador</p>
                </div>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-[0.5em] font-black h-14 rounded-xl"
                  placeholder="000000"
                />
                <Button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl"
                >
                  {isLoading ? 'Verificando...' : 'Confirmar identidade'}
                </Button>
              </form>
            )}

            <div className="pt-1 border-t border-white/5 text-center">
              <Link href="/auth/signup" className="text-zinc-500 text-xs hover:text-purple-400 transition-colors font-semibold flex items-center justify-center gap-1.5">
                Não tem conta? Criar agora <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
