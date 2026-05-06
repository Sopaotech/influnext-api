import { Suspense } from 'react';
import SignupClient from './SignupClient';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-400 flex items-center justify-center font-black uppercase text-[10px] tracking-widest">Carregando módulo de IA...</div>}>
      <SignupClient />
    </Suspense>
  );
}
