import { Suspense } from 'react';
import SignupClient from './SignupClient';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">Carregando módulo de IA...</div>}>
      <SignupClient />
    </Suspense>
  );
}
