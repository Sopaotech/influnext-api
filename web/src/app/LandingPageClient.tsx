'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPageClient() {
  const [showPlim, setShowPlim] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPlim(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans selection:bg-purple-500/30">
      {/* Navbar com Logo */}
      <nav className="w-full p-6 flex justify-between items-center z-20 border-b border-white/5 bg-[#080810]/80 backdrop-blur-md sticky top-0">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-1 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          INFLUNEX<span className="text-purple-500 transform -rotate-12 inline-block">↗</span>
        </div>
        <div className="flex gap-4">
          <Link href="/auth/login" className="text-zinc-400 hover:text-white px-4 py-2 font-medium transition-colors">Login</Link>
          <Link href="/auth/signup?type=company" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold transition-all border border-white/10">Para Marcas</Link>
        </div>
      </nav>

      {/* Notificação "Plim" (IA) */}
      <div className={`fixed top-24 right-4 z-50 transition-all duration-500 transform ${showPlim ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
        <div className="bg-gradient-to-r from-purple-900/90 to-purple-800/90 border border-purple-500/30 p-4 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md flex gap-3 max-w-sm">
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse mt-2 flex-shrink-0" />
          <div>
            <span className="text-xs text-purple-300 font-bold tracking-wider uppercase block mb-1">Assistente IA</span>
            <p className="text-sm font-medium leading-relaxed">
              Plim! Bom dia, Alex. Temos 2 tarefas pendentes para o seu objetivo de [Fitness]. Vamos pro topo?
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/4 w-full max-w-2xl h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-full max-w-lg h-[400px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Launchpad Ativo
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] mb-6">
            PARE DE BRINCAR DE SER INFLUENCER.<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-500">
              CONSTRUA UM IMPÉRIO.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mb-12 leading-relaxed">
            O único ecossistema que une Workspace com IA para sua carreira e Marketplace seguro para marcas locais. 
            <strong className="text-white font-semibold"> Profissionalize-se ou fique para trás.</strong>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/auth/signup?type=influencer" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-5 rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] text-center">
              Quero Ser Elite
            </Link>
            <Link href="/auth/signup?type=company" className="border border-purple-500/30 hover:bg-purple-500/10 text-white px-8 py-5 rounded-xl font-bold uppercase tracking-widest transition-all text-center">
              Contratar com Segurança
            </Link>
          </div>
          
          {/* Social Proof */}
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-8 md:gap-16 text-zinc-500 text-sm font-semibold uppercase tracking-widest">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl text-white font-black">1.200+</span>
              <span>Perfis Auditados</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl text-white font-black">R$ 500k+</span>
              <span>Em Escrow Protegido</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl text-white font-black">Local</span>
              <span>Foco Regional</span>
            </div>
          </div>
        </section>

        {/* Pilares */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pilar 1 */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] transition-colors group">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <h3 className="text-2xl font-black mb-4">DOMINE SUA RUA, SEU BAIRRO, SUA CIDADE.</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              O Influnext é o iFood da influência. Marcas locais buscam rostos locais. Conectamos você com os negócios da sua região que precisam da sua voz hoje.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="bg-white/[0.02] border border-purple-500/20 rounded-3xl p-8 hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -z-10" />
            <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
            </div>
            <h3 className="text-2xl font-black mb-4 text-purple-50">CONTRATAÇÃO CIRÚRGICA. RISCO ZERO.</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Pare de queimar dinheiro. Contrate influencers auditados com métricas reais. O pagamento só sai via Escrow após aprovação. Segurança bancária.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] transition-colors group">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-2xl font-black mb-4">O EMPRESÁRIO DIGITAL NÃO ESTÁ SÓ.</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              Nossa IA gerencia sua carreira em tempo real. Seja na Música, Moda ou Fitness, o sistema dita tendências, cuida da agenda e te motiva a não desistir.
            </p>
          </div>
        </section>

        {/* Rate Card Component */}
        <section className="w-full max-w-4xl mx-auto px-6 py-16 z-10 flex flex-col items-center">
          <h2 className="text-3xl font-black mb-10 text-center">Transparência Brutal na Contratação</h2>
          
          <div className="w-full bg-[#11111a] border border-white/10 rounded-2xl p-1 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-3xl transform hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-4 p-4 w-full">
              <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full p-0.5">
                <div className="w-full h-full bg-[#080810] rounded-full border-2 border-transparent" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg">Maria Silva <span className="text-purple-400 text-xs uppercase tracking-wider ml-2 bg-purple-500/10 px-2 py-0.5 rounded">Lifestyle</span></h4>
                    <p className="text-zinc-500 text-sm mt-1">São Paulo, SP • 12.5k Followers</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 p-6 flex items-center justify-between gap-8 bg-white/[0.02] rounded-b-xl md:rounded-r-xl md:rounded-bl-none">
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Pacote Start</p>
                <p className="text-sm font-medium">3 Stories + 1 Feed</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">R$ 450<span className="text-sm text-zinc-500">,00</span></p>
              </div>
              <button className="bg-white text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-zinc-200 transition-colors whitespace-nowrap">
                Contratar
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Institucional */}
      <footer className="w-full border-t border-white/5 py-12 px-6 mt-12 bg-black/50 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="text-xl font-black tracking-tighter flex items-center gap-1 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              INFLUNEX<span className="text-purple-500 transform -rotate-12 inline-block">↗</span>
            </div>
            <p className="text-zinc-500 text-sm">© 2026 Influnext SA. Todos os direitos reservados.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              Powered by IA & Escrow Security
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
