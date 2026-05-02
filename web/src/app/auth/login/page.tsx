'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, LoginResponse } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowRight } from 'lucide-react';

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
      const res = await api.post<LoginResponse>('/auth/2fa/verify', { 
        tempToken, 
        code: otpCode 
      });
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
    if (data.user.scoreDecayed && data.user.scoreDecayed > 0) {
      Cookies.set('influnext_decayed', data.user.scoreDecayed.toString(), cookieOptions);
    }
    
    if (data.user.role === 'INFLUENCER') {
      router.push('/dashboard/influencer');
    } else if (data.user.role === 'COMPANY') {
      router.push('/dashboard/company');
    } else {
      router.push('/dashboard/admin');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080810] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* 3 Animated Orbs */}
      <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-purple-600/30 rounded-full blur-[60px] animate-orb" />
      <div className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-pink-600/20 rounded-full blur-[80px] animate-orb" style={{ animationDelay: '-5s' }} />
      <div className="absolute top-[50%] left-[60%] w-48 h-48 bg-blue-600/15 rounded-full blur-[60px] animate-orb" style={{ animationDelay: '-10s' }} />

      <div className="w-[280px] z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-[#100c1e] border border-[#1e1430] p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
          
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-[#e8e0f5] tracking-tighter">
              InfluNext
            </h1>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
              {step === 'credentials' ? 'Acesso Restrito' : 'Segurança 2FA'}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-[10px] text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-400 text-[10px] uppercase font-bold ml-1">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="bg-[#080810] border-[#1e1430] text-[#e8e0f5] focus:ring-purple-500 rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-400 text-[10px] uppercase font-bold ml-1">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-[#080810] border-[#1e1430] text-[#e8e0f5] focus:ring-purple-500 rounded-xl h-10 text-xs"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] text-xs"
              >
                {isLoading ? '...' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="flex justify-center">
                <ShieldCheck className="w-8 h-8 text-purple-400" />
              </div>
              <div className="space-y-2 text-center">
                <Input 
                  id="otp" 
                  type="text" 
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required 
                  className="bg-[#080810] border-[#1e1430] text-[#e8e0f5] text-center text-xl tracking-[0.3em] font-bold h-12"
                  placeholder="000000"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg text-xs"
              >
                {isLoading ? '...' : 'Validar'}
              </Button>
            </form>
          )}

          <div className="pt-2 text-center">
            <Link href="/auth/signup" className="text-zinc-500 text-[10px] hover:text-purple-400 transition-colors uppercase font-bold flex items-center justify-center gap-1">
              Criar Conta <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
