'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function LandingPageClient() {
  // Sem toast/Plim — exclusivo do Dashboard

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col font-sans">
      {/* Navbar */}
      <nav className="w-full px-6 py-5 flex justify-between items-center z-20 border-b border-white/5 bg-[#050508]/80 backdrop-blur-md sticky top-0">
        <Logo size="md" href="/" />
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-zinc-400 hover:text-white text-sm px-4 py-2 font-semibold transition-colors">
            Entrar
          </Link>
          <Link href="/auth/signup?type=company" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-all">
            Para Marcas
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-purple-600/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[400px] bg-pink-600/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(168,85,247,1) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,1) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }} />

        {/* Hero */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28 flex flex-col items-center text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Plataforma de Marketing de Influência
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.05] mb-6 max-w-4xl">
            PARE DE BRINCAR<br />DE SER INFLUENCER.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500">
              CONSTRUA UM IMPÉRIO.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
            O único ecossistema que une <strong className="text-white">Workspace com IA</strong> para sua carreira e{' '}
            <strong className="text-white">Marketplace seguro com Escrow</strong> para marcas contratarem com risco zero.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signup?type=influencer"
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] text-sm"
            >
              Quero ser Elite →
            </Link>
            <Link
              href="/auth/signup?type=company"
              className="border border-purple-500/30 hover:bg-purple-500/10 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-wider transition-all text-sm"
            >
              Contratar com Segurança
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-12 md:gap-20">
            {[
              { value: '1.200+', label: 'Perfis Auditados' },
              { value: 'R$ 500k+', label: 'Em Escrow Protegido' },
              { value: '100%', label: 'Foco Local' },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black text-white">{stat.value}</span>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pilares */}
        <section className="w-full max-w-6xl mx-auto px-6 pb-24 z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '📍',
                color: 'purple',
                title: 'DOMINE SUA CIDADE.',
                text: 'O Influnext é o iFood da influência. Marcas locais buscam rostos locais. Conectamos você com os negócios da sua região que precisam da sua voz hoje.',
              },
              {
                icon: '🛡️',
                color: 'pink',
                title: 'CONTRATAÇÃO CIRÚRGICA.',
                text: 'Pare de queimar dinheiro. Contrate influencers auditados com métricas reais. O pagamento só sai do seu caixa via Escrow após o trabalho aprovado.',
              },
              {
                icon: '🤖',
                color: 'blue',
                title: 'IA NA SUA CARREIRA.',
                text: 'Nossa IA gerencia sua carreira em tempo real. Seja na Música, Moda ou Fitness, o sistema dita suas tendências e te motiva a não desistir.',
              },
            ].map(p => (
              <div key={p.title} className="bg-white/[0.02] border border-white/5 rounded-2xl p-7 hover:bg-white/[0.04] transition-colors group">
                <div className="text-3xl mb-5">{p.icon}</div>
                <h3 className="text-lg font-black mb-3 leading-tight">{p.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rate Card */}
        <section className="w-full max-w-4xl mx-auto px-6 pb-24 z-10">
          <h2 className="text-2xl font-black mb-3 text-center">Transparência Total na Contratação</h2>
          <p className="text-zinc-500 text-sm text-center mb-8">Veja exatamente quanto custa antes de contratar.</p>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-0">
              <div className="flex items-center gap-4 p-6 w-full">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-base">Maria Silva
                    <span className="ml-2 text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Lifestyle</span>
                  </h4>
                  <p className="text-zinc-500 text-xs mt-0.5">São Paulo, SP • 12.5k Seguidores</p>
                </div>
              </div>
              <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-white/5 p-6 flex items-center gap-8">
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Pacote Start</p>
                  <p className="text-sm font-medium text-zinc-300">3 Stories + 1 Feed</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">R$&nbsp;450<span className="text-sm text-zinc-500">,00</span></p>
                </div>
                <Link href="/auth/signup?type=company" className="bg-white text-black text-xs font-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap">
                  Contratar
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-10 px-6 bg-black/30 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <Logo size="sm" href="/" />
            <p className="text-zinc-600 text-xs">© 2026 Influnext. Todos os direitos reservados.</p>
            <a href="mailto:contato@influnext.com.br" className="text-zinc-500 text-xs hover:text-purple-400 transition-colors">
              contato@influnext.com.br
            </a>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-zinc-400 tracking-wider flex items-center gap-2">
              🛡️ Powered by IA & Escrow Security
            </div>
            <div className="flex gap-4 text-xs text-zinc-600">
              <Link href="/auth/login" className="hover:text-zinc-400 transition-colors">Entrar</Link>
              <Link href="/auth/signup" className="hover:text-zinc-400 transition-colors">Cadastrar</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
