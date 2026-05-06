import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-purple-100 font-sans relative overflow-hidden">
      {/* Background atmosphere unificado - Ultra Soft */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-purple-50/40 blur-[180px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-slate-50/50 blur-[150px]" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Children renderizam seu próprio conteúdo e Logo se necessário */}
        {children}
      </div>
    </div>
  );
}
