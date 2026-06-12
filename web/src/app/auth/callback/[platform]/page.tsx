"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Cookies from 'js-cookie';

export default function SocialCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const platform = params.platform as string;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const processCallback = useCallback(async () => {
    if (!code || !platform) {
      setStatus('error');
      setErrorMessage('Dados de autenticação incompletos ou inválidos.');
      toast.error('Dados de autenticação inválidos.');
      if (window.opener) {
        window.opener.postMessage({ type: 'social-auth-error', platform, error: 'Dados de autenticação incompletos.' }, window.location.origin);
        setTimeout(() => window.close(), 3000);
      }
      return;
    }

    setStatus('loading');
    try {
      const res = await api.get<any>(`/auth/social/callback/${platform}?code=${code}&state=${state}`);
      setStatus('success');
      
      if (res.data?.token) {
        const cookieOptions = {
          expires: 7,
          secure: window.location.protocol === 'https:',
          path: '/',
        };
        const user = res.data.user;
        Cookies.set('influnext_token', res.data.token, cookieOptions);
        Cookies.set('influnext_role', user.role, cookieOptions);
        Cookies.set('influnext_onboarding', user.onboardingCompleted ? 'true' : 'false', cookieOptions);

        if (window.opener) {
          window.opener.postMessage({ 
            type: 'social-auth-success', 
            platform, 
            status: 'success', 
            user, 
            token: res.data.token 
          }, window.location.origin);
          setTimeout(() => {
            window.close();
          }, 1500);
          return;
        }

        setTimeout(() => {
          if (!user.onboardingCompleted && user.role === 'INFLUENCER') {
            router.push('/onboarding');
          } else {
            router.push('/dashboard/influencer');
          }
        }, 1500);
        return;
      }

      if (window.opener) {
        window.opener.postMessage({ 
          type: 'social-auth-success', 
          platform, 
          status: 'success' 
        }, window.location.origin);
        setTimeout(() => {
          window.close();
        }, 1500);
        return;
      }

      // Delay de 2 segundos para o usuário ver o feedback de sucesso premium
      setTimeout(() => {
        if (state && state.endsWith('_onboarding')) {
          router.push(`/onboarding?status=success&platform=${platform}`);
        } else {
          router.push(`/dashboard/settings?status=success&platform=${platform}`);
        }
      }, 2000);
    } catch (error: any) {
      console.error('Erro no callback social:', error);
      setStatus('error');
      
      const message = error.response?.data?.message || 'Falha ao conectar conta social. Verifique sua conexão ou tente novamente.';
      setErrorMessage(message);
      toast.error(message);

      if (window.opener) {
        window.opener.postMessage({ 
          type: 'social-auth-error', 
          platform, 
          status: 'error', 
          error: message 
        }, window.location.origin);
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    }
  }, [code, platform, state, router]);

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center space-y-8">
          {status === 'loading' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin relative" />
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider">Sincronizando...</h2>
                <p className="text-zinc-400 text-sm font-medium">
                  Estamos vinculando sua conta do <span className="text-purple-400 font-bold">{platform?.toUpperCase()}</span> ao radar InfluNext.
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full" />
                <AlertCircle className="w-16 h-16 text-red-500 relative" />
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider text-red-500">Erro na Conexão</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              
              <div className="flex flex-col w-full gap-3 pt-4">
                <button
                  onClick={() => processCallback()}
                  className="flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </button>
                <button
                  onClick={() => {
                    if (state && state.endsWith('_onboarding')) {
                      router.push(`/onboarding?status=error&platform=${platform}`);
                    } else {
                      router.push(`/dashboard/settings?status=error&platform=${platform}`);
                    }
                  }}
                  className="flex items-center justify-center gap-2 bg-zinc-800 text-zinc-300 font-bold py-4 rounded-2xl hover:bg-zinc-700 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Dashboard
                </button>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center relative shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-in zoom-in duration-500">
                  <svg 
                    className="w-10 h-10 text-black" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={4}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider text-green-500">Conectado!</h2>
                <p className="text-zinc-400 text-sm font-medium">
                  Sua conta {platform?.toUpperCase()} foi vinculada com sucesso.
                </p>
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-8 text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-bold">
        InfluNext © 2026 • Secure Social Auth
      </p>
    </div>
  );
}

