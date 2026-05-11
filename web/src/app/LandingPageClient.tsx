'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { XCircle, Rocket, BarChart3, Zap, Brain, TrendingUp, ShieldCheck, Target, ArrowRight, CheckCircle2 } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '+3.200', label: 'Influencers Ativos' },
  { value: '+480', label: 'Marcas Conectadas' },
  { value: '360°', label: 'Gestão de Carreira' },
];

const PAIN_POINTS = [
  'Não sabe quantos Stories, curtidas ou engajamento o influencer realmente gera',
  'Gerencia campanha de R$ 10 mil por DM e planilha',
  'Como influencer, não sabe o que postar, quando postar ou como crescer',
  'Recebe briefing confuso e corre atrás do pagamento',
];

const CREATOR_FEATURES = [
  { icon: Brain, text: 'Agenda inteligente com IA' },
  { icon: Zap, text: 'Ideias de conteúdo geradas automaticamente' },
  { icon: TrendingUp, text: 'Painel de crescimento em tempo real' },
  { icon: Target, text: 'Fim do achismo — dados reais guiam tudo' },
  { icon: BarChart3, text: 'Gestão profissional de negócio' },
];

const BRAND_FEATURES = [
  { icon: ShieldCheck, text: 'Dados reais antes de contratar' },
  { icon: XCircle, text: 'Zero fraude — sistema anti-bot' },
  { icon: CheckCircle2, text: 'Gestão sem burocracia, sem DM' },
  { icon: TrendingUp, text: 'ROI em tempo real por campanha' },
  { icon: Target, text: 'Escrow total — pague só após aprovação' },
];

const FLOW_STEPS = [
  { label: 'Influencer', sub: 'com dados reais auditados' },
  { label: 'Stories / Curtidas', sub: 'métricas verificadas' },
  { label: 'Empresa decide', sub: 'com segurança total' },
  { label: 'INFLUNEXT', sub: 'Conexão + Pagamento Escrow', highlight: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPageClient() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="w-full px-6 lg:px-12 py-5 flex justify-between items-center z-30 border-b border-slate-50 bg-white/80 backdrop-blur-xl sticky top-0">
        <Logo size="md" href="/" />
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="text-slate-500 hover:text-slate-900 text-sm px-4 py-2 font-semibold transition-colors hidden sm:block">
            Entrar
          </Link>
          <Link href="/auth/signup?type=influencer" className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-sm px-4 py-2.5 rounded-xl font-bold transition-all">
            Criar conta
          </Link>
          <Link href="/auth/signup?type=company" className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20">
            Para Marcas
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center relative overflow-hidden">

        {/* Atmospheric bg - Lighter and softer, optimized for performance */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[10%] w-[80vw] md:w-[800px] h-[60vh] md:h-[600px] rounded-full bg-purple-100/30 blur-[80px] md:blur-[150px]" />
          <div className="absolute top-[50%] right-[-10%] w-[60vw] md:w-[600px] h-[50vh] md:h-[500px] rounded-full bg-violet-50/30 blur-[60px] md:blur-[130px]" />
        </div>

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-24 md:pt-36 pb-20 flex flex-col items-center text-center z-10">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[11px] font-bold uppercase tracking-[0.2em] mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            A plataforma de influência mais séria do Brasil
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-[-0.04em] leading-[1.1] md:leading-[1.02] mb-6 md:mb-8 max-w-5xl text-slate-900">
            Pare de contratar{' '}
            <span className="text-slate-400">números.</span>
            <br className="hidden md:block" />
            Comece a contratar{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              resultados.
            </span>
          </h1>

          <p className="text-base md:text-xl text-slate-500 max-w-2xl mb-10 md:mb-12 leading-relaxed font-medium px-4 md:px-0">
            A INFLUNEXT conecta marcas e influencers com{' '}
            <span className="text-slate-900 font-semibold underline decoration-purple-500/30">dados reais</span>,
            gestão profissional de carreira e{' '}
            <span className="text-slate-900 font-semibold underline decoration-purple-500/30">segurança total</span>{' '}
            — do comércio de bairro à multinacional.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16 md:mb-20 w-full sm:w-auto px-6 sm:px-0">
            <Link
              href="/auth/signup?type=influencer"
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-95"
            >
              Começar agora <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signup?type=company"
              className="inline-flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all"
            >
              Sou uma Marca →
            </Link>
          </div>

          {/* Metrics bar - Stacks on mobile */}
          <div className="w-full max-w-2xl border border-slate-100 bg-white shadow-xl shadow-purple-500/5 rounded-2xl flex flex-col md:grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col items-center py-4 md:py-5 px-4">
                <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {s.value}
                </span>
                <span className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── A FERIDA ───────────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24 z-10">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 md:p-12 space-y-8 shadow-inner">

            <div className="space-y-2 text-center md:text-left">
              <p className="text-red-500 text-[11px] font-black uppercase tracking-[0.25em]">⚠ Você ainda faz isso?</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Se você respondeu <span className="text-red-500">SIM</span> para qualquer um destes…
              </h2>
              <p className="text-slate-500 text-sm">…você está deixando dinheiro e crescimento na mesa todo dia.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAIN_POINTS.map((pain, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 bg-white border border-red-100 rounded-2xl group hover:border-red-200 transition-all shadow-sm"
                >
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{pain}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm font-semibold">
                Isso tem solução. E ela chama-se <span className="text-slate-900 font-black">InfluNext</span>.
              </p>
              <Link
                href="/auth/signup?type=influencer"
                className="inline-flex items-center gap-2 text-sm font-black text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-wider"
              >
                Quero resolver isso agora <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── ECOSYSTEM FLOW ─────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24 z-10">
          <div className="text-center mb-12 space-y-2">
            <p className="text-purple-600 text-[11px] font-black uppercase tracking-[0.25em]">Como o Ecossistema Funciona</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">O fluxo que elimina o risco</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div className={`flex flex-col items-center text-center p-6 rounded-2xl min-w-[180px] transition-all ${step.highlight
                  ? 'bg-white border-2 border-purple-200 shadow-xl shadow-purple-500/10'
                  : 'bg-white border border-slate-100 shadow-sm'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mb-3 ${step.highlight ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <p className={`font-black text-sm ${step.highlight ? 'text-purple-600' : 'text-slate-900'}`}>{step.label}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1 max-w-[120px]">{step.sub}</p>
                </div>

                {i < FLOW_STEPS.length - 1 && (
                  <div className="flex items-center justify-center w-8 md:w-12 h-8 md:h-auto my-2 md:my-0 flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-slate-200 rotate-90 md:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── O ABRAÇO: CREATOR + BRAND ──────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24 z-10">
          <div className="text-center mb-12 space-y-2">
            <p className="text-purple-600 text-[11px] font-black uppercase tracking-[0.25em]">A Proposta de Valor</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Dois lados. Um ecossistema. Resultado real.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Creator Side */}
            <div className="relative bg-white border border-slate-100 hover:border-purple-200 rounded-[2.5rem] p-8 md:p-10 overflow-hidden group transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-purple-500/5">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-50 blur-[80px] group-hover:bg-purple-100 transition-all" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Para Influencers</p>
                    <h3 className="text-xl font-black text-slate-900">Workspace de Carreira</h3>
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed">
                  Pare de improvisar. Nossa IA gerencia sua carreira em tempo real — você foca em criar, a plataforma cuida do resto.
                </p>

                <ul className="space-y-3">
                  {CREATOR_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup?type=influencer"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all"
                >
                  Quero meu Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Brand Side */}
            <div className="relative bg-white border border-slate-100 hover:border-blue-200 rounded-[2.5rem] p-8 md:p-10 overflow-hidden group transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-blue-500/5">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-50 blur-[80px] group-hover:bg-blue-100 transition-all" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Para Marcas</p>
                    <h3 className="text-xl font-black text-slate-900">Marketplace com Escrow</h3>
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed">
                  Contrate com dados. Pague com segurança. Acompanhe o ROI. Sem planilha, sem DM, sem surpresa.
                </p>

                <ul className="space-y-3">
                  {BRAND_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup?type=company"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all"
                >
                  Quero contratar com segurança <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-28 z-10">
          <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 p-8 md:p-16 lg:p-24 shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-600/20 to-transparent" />
            
            <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
              <p className="text-purple-400 text-[11px] font-black uppercase tracking-[0.25em]">Chega de amadorismo</p>

              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-tight">
                O amadorismo está{' '}
                <span className="text-red-400">custando caro.</span>
                <br />
                <span className="text-purple-400">Profissionaliza agora.</span>
              </h2>

              <p className="text-slate-400 text-base md:text-xl leading-relaxed max-w-2xl mx-auto">
                Seja você uma marca que quer{' '}
                <span className="text-white font-semibold">resultado real</span>{' '}
                ou um criador que quer ser{' '}
                <span className="text-white font-semibold">levado a sério</span>{' '}
                — o seu lugar é aqui.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link
                  href="/auth/signup?type=influencer"
                  className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95"
                >
                  Começar agora, é grátis <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth/login"
                  className="border border-white/10 hover:bg-white/5 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-slate-50 py-12 px-6 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size="sm" href="/" />
            <p className="text-slate-400 text-xs">© 2026 InfluNext. Todos os direitos reservados.</p>
          </div>
          
          <div className="flex gap-8 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
            <Link href="/auth/login" className="hover:text-purple-600 transition-colors">Entrar</Link>
            <Link href="/auth/signup" className="hover:text-purple-600 transition-colors">Cadastrar</Link>
            <Link href="/dashboard/marketplace" className="hover:text-purple-600 transition-colors">Marketplace</Link>
          </div>

          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 tracking-wider">
            🛡️ TECNOLOGIA IA & ESCROW — FEITO NO BRASIL
          </div>
        </div>
      </footer>
    </div>
  );
}
