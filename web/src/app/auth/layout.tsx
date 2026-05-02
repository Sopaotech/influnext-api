import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-purple-500/30 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">
           <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]">
             <span className="text-3xl font-extrabold text-white tracking-tighter">IX</span>
           </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          InfluNext
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
        <div className="bg-zinc-900/80 py-8 px-4 shadow-2xl backdrop-blur-md sm:rounded-2xl sm:px-10 border border-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );
}
