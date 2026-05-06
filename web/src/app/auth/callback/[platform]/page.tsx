"use client";
import { useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SocialCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const platform = params.platform as string;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId

  useEffect(() => {
    async function processCallback() {
      if (!code || !platform) {
        toast.error('Dados de autenticação inválidos.');
        router.push('/dashboard/influencer');
        return;
      }

      try {
        await api.get(`/auth/social/callback/${platform}?code=${code}&state=${state}`);
        toast.success(`Conta ${platform.toUpperCase()} conectada com sucesso!`);
        router.push('/dashboard/influencer');
      } catch (error) {
        console.error('Erro no callback social:', error);
        toast.error('Falha ao conectar conta social.');
        router.push('/dashboard/influencer');
      }
    }

    processCallback();
  }, [code, platform, state, router]);

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin relative" />
      </div>
      <div className="text-center space-y-2 relative">
        <h2 className="text-xl font-black text-white uppercase tracking-widest">Sincronizando Radar...</h2>
        <p className="text-zinc-500 text-sm font-medium italic">Estamos vinculando sua conta do {platform?.toUpperCase()}</p>
      </div>
    </div>
  );
}
