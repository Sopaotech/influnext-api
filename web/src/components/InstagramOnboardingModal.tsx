'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface InstagramOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstagramOnboardingModal({ isOpen, onClose }: InstagramOnboardingModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ instagram?: string; authUrl?: string; configured?: { instagram?: boolean } }>(
        '/integrations/instagram/auth-url', { params: { from: 'onboarding' } },
      );
      const url = data.instagram || data.authUrl;
      if (!data.configured?.instagram || !url || url === '#') {
        setError('A conexão com Instagram está temporariamente indisponível. Tente novamente mais tarde.');
        setLoading(false);
        return;
      }
      window.location.assign(url);
    } catch {
      setError('Não foi possível iniciar a conexão. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="instagram-connect-title">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white">
        <div>
          <h2 id="instagram-connect-title" className="text-xl font-bold">Conectar Instagram</h2>
          <p className="mt-2 text-sm text-zinc-300">É necessária uma conta profissional (Creator ou Business).</p>
        </div>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/15 px-4 py-3">Cancelar</button>
          <button type="button" disabled={loading} onClick={connect} className="flex-1 rounded-xl bg-orange-600 px-4 py-3 font-semibold disabled:opacity-60">
            {loading ? 'Redirecionando…' : 'Conectar Instagram'}
          </button>
        </div>
      </div>
    </div>
  );
}
