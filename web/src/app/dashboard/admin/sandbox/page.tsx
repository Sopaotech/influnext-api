'use client';

import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function SandboxLabPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Módulo Desativado</h1>
      <p className="text-zinc-500 max-w-md mb-8 font-medium">
        O Laboratório de Simulação foi removido permanentemente. A plataforma agora opera exclusivamente com dados reais e integrações de produção.
      </p>
      <Link 
        href="/dashboard/admin"
        className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all"
      >
        Voltar para o Painel
      </Link>
    </div>
  );
}
