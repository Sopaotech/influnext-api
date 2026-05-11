"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

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
      return;
    }

    setStatus('loading');
    try {
      await api.get(`/auth/social/callback/${platform}?code=${code}&state=${state}`);
      setStatus('success');
      toast.success(`Conta ${platform.toUpperCase()} conectada com sucesso!`);
      router.push('/dashboard/influencer');
    } catch (error: any) {
      console.error('Erro no callback social:', error);
      setStatus('error');
      
      const message = error.response?.data?.message || 'Falha ao conectar conta social. Verifique sua conexão ou tente novamente.';
      setErrorMessage(message);
      toast.error(message);
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
                  onClick={() => router.push('/dashboard/influencer')}
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
                <div className="absolute inset-0 bg-green-600/20 blur-3xl rounded-full" />
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center relative">
                  <RefreshCw className="w-8 h-8 text-black animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider text-green-500">Sucesso!</h2>
                <p className="text-zinc-400 text-sm">
                  Redirecionando para o seu dashboard...
                </p>
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

