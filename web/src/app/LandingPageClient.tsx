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
    <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="w-full px-6 lg:px-12 py-5 flex justify-between items-center z-30 border-b border-white/[0.04] bg-[#080810]/95 backdrop-blur-xl sticky top-0">
        <Logo size="md" href="/" />
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="text-zinc-500 hover:text-white text-sm px-4 py-2 font-semibold transition-colors hidden sm:block">
            Entrar
          </Link>
          <Link href="/auth/signup?type=influencer" className="bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-white text-sm px-4 py-2.5 rounded-xl font-bold transition-all">
            Criar conta
          </Link>
          <Link href="/auth/signup?type=company" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm px-4 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_16px_rgba(192,132,252,0.25)]">
            Para Marcas
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center relative overflow-hidden">

        {/* Atmospheric bg */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[10%] w-[800px] h-[600px] rounded-full bg-purple-700/[0.07] blur-[150px]" />
          <div className="absolute top-[50%] right-[-10%] w-[600px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[130px]" />
          <div className="absolute bottom-[5%] left-[-5%] w-[500px] h-[400px] rounded-full bg-pink-700/[0.04] blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.018]" style={{
            backgroundImage: 'linear-gradient(rgba(192,132,252,1) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        </div>

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-24 md:pt-36 pb-20 flex flex-col items-center text-center z-10">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/[0.08] border border-purple-500/[0.15] text-purple-300 text-[11px] font-bold uppercase tracking-[0.2em] mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            A plataforma de influência mais séria do Brasil
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-[-0.04em] leading-[1.02] mb-8 max-w-5xl">
            Pare de contratar{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 to-zinc-200">números.</span>
            <br />
            Comece a contratar{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-[#c084fc] to-violet-400">
              resultados.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-12 leading-relaxed font-medium">
            A INFLUNEXT conecta marcas e influencers com{' '}
            <span className="text-zinc-200 font-semibold">dados reais</span>,
            gestão profissional de carreira e{' '}
            <span className="text-zinc-200 font-semibold">segurança total nas transações</span>{' '}
            — do comércio de bairro à multinacional.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              href="/auth/signup?type=influencer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_32px_rgba(192,132,252,0.3)] hover:shadow-[0_0_52px_rgba(192,132,252,0.5)]"
            >
              Começar agora, é grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signup?type=company"
              className="border border-purple-500/25 hover:bg-purple-500/[0.06] hover:border-purple-500/40 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all"
            >
              Sou uma Marca →
            </Link>
          </div>

          {/* Metrics bar */}
          <div className="w-full max-w-2xl border border-white/[0.06] bg-white/[0.02] rounded-2xl grid grid-cols-3 divide-x divide-white/[0.06]">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col items-center py-5 px-4">
                <span className="text-2xl md:text-3xl font-black text-white tracking-tight" style={{ textShadow: '0 0 20px rgba(192,132,252,0.35)' }}>
                  {s.value}
                </span>
                <span className="text-[10px] md:text-[11px] text-zinc-600 font-bold uppercase tracking-widest mt-1 text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── A FERIDA ───────────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24 z-10">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 space-y-8">

            <div className="space-y-2">
              <p className="text-red-400 text-[11px] font-black uppercase tracking-[0.25em]">⚠ Você ainda faz isso?</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Se você respondeu <span className="text-red-400">SIM</span> para qualquer um destes…
              </h2>
              <p className="text-zinc-500 text-sm">…você está deixando dinheiro e crescimento na mesa todo dia.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAIN_POINTS.map((pain, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 bg-red-950/20 border border-red-500/[0.15] rounded-2xl group hover:border-red-500/[0.30] transition-all"
                >
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300 font-medium leading-relaxed">{pain}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-zinc-500 text-sm font-semibold">
                Isso tem solução. E ela chama-se <span className="text-white font-black">INFLUNEXT</span>.
              </p>
              <Link
                href="/auth/signup?type=influencer"
                className="inline-flex items-center gap-2 text-sm font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider"
              >
                Quero resolver isso agora <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── ECOSYSTEM FLOW ─────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24 z-10">
          <div className="text-center mb-12 space-y-2">
            <p className="text-purple-400 text-[11px] font-black uppercase tracking-[0.25em]">Como o Ecossistema Funciona</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">O fluxo que elimina o risco</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-0">
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={i}>
                <div className={`flex flex-col items-center text-center p-6 rounded-2xl min-w-[160px] transition-all ${step.highlight
                  ? 'bg-gradient-to-br from-purple-600/20 to-violet-600/10 border border-purple-500/30 shadow-[0_0_30px_rgba(192,132,252,0.15)]'
                  : 'bg-white/[0.02] border border-white/[0.05]'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mb-3 ${step.highlight ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(192,132,252,0.4)]' : 'bg-white/[0.06] text-zinc-400'}`}>
                    {i + 1}
                  </div>
                  <p className={`font-black text-sm ${step.highlight ? 'text-[#c084fc]' : 'text-white'}`}>{step.label}</p>
                  <p className="text-[10px] text-zinc-600 font-semibold mt-1 max-w-[120px]">{step.sub}</p>
                </div>

                {i < FLOW_STEPS.length - 1 && (
                  <div className="flex items-center justify-center w-8 md:w-12 h-8 md:h-auto my-2 md:my-0 flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-purple-500/50 rotate-90 md:rotate-0" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── O ABRAÇO: CREATOR + BRAND ──────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24 z-10">
          <div className="text-center mb-12 space-y-2">
            <p className="text-purple-400 text-[11px] font-black uppercase tracking-[0.25em]">A Proposta de Valor</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Dois lados. Um ecossistema. Resultado real.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Creator Side */}
            <div className="relative bg-white/[0.02] border border-purple-500/[0.12] hover:border-purple-500/[0.25] rounded-3xl p-8 md:p-10 overflow-hidden group transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-600/10 blur-[80px] group-hover:bg-purple-600/15 transition-all" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-[0_0_24px_rgba(192,132,252,0.3)]">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Para Influencers</p>
                    <h3 className="text-xl font-black text-white">Workspace de Carreira</h3>
                  </div>
                </div>

                <p className="text-zinc-500 text-sm leading-relaxed">
                  Pare de improvisar. Nossa IA gerencia sua carreira em tempo real — você foca em criar, a plataforma cuida do resto.
                </p>

                <ul className="space-y-3">
                  {CREATOR_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <span className="text-sm text-zinc-300 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup?type=influencer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(192,132,252,0.2)] hover:shadow-[0_0_32px_rgba(192,132,252,0.35)]"
                >
                  Quero meu Workspace <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Brand Side */}
            <div className="relative bg-white/[0.02] border border-blue-500/[0.10] hover:border-blue-500/[0.22] rounded-3xl p-8 md:p-10 overflow-hidden group transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-600/8 blur-[80px] group-hover:bg-blue-600/12 transition-all" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.3)]">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Para Marcas</p>
                    <h3 className="text-xl font-black text-white">Marketplace com Escrow</h3>
                  </div>
                </div>

                <p className="text-zinc-500 text-sm leading-relaxed">
                  Contrate com dados. Pague com segurança. Acompanhe o ROI. Sem planilha, sem DM, sem surpresa.
                </p>

                <ul className="space-y-3">
                  {BRAND_FEATURES.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-sm text-zinc-300 font-medium">{text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signup?type=company"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_32px_rgba(59,130,246,0.35)]"
                >
                  Quero contratar com segurança <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ────────────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-24 z-10">
           <div className="text-center mb-12 space-y-2">
              <p className="text-purple-400 text-[11px] font-black uppercase tracking-[0.25em]">Investimento</p>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Um plano simples para escala global</h2>
           </div>

           <div className="max-w-md mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-[#100c1e] border border-purple-500/30 rounded-3xl p-10 flex flex-col items-center text-center space-y-8">
                 <div className="space-y-1">
                    <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">Plano InfluNext Pro</span>
                    <div className="flex items-baseline gap-1 justify-center">
                       <span className="text-2xl font-black text-zinc-400">R$</span>
                       <span className="text-6xl font-black text-white tracking-tighter">97</span>
                       <span className="text-xl font-bold text-zinc-500">/mês</span>
                    </div>
                 </div>

                 <ul className="w-full space-y-4 text-left">
                    {[
                      'Media Kit Dinâmico (Sempre Atualizado)',
                      'Acesso ao Marketplace de Marcas',
                      'Contratos e Pagamentos via Escrow Seguro',
                      'Roteiros e Briefings Gerados por IA',
                      'Agenda de Carreira Inteligente',
                      'Suporte Prioritário 24/7'
                    ].map(benefit => (
                      <li key={benefit} className="flex items-center gap-3">
                         <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                         <span className="text-sm text-zinc-300 font-medium">{benefit}</span>
                      </li>
                    ))}
                 </ul>

                 <Link
                   href="/auth/signup?type=influencer"
                   className="w-full py-4 bg-white text-[#080810] font-black rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                 >
                   COMEÇAR AGORA <ArrowRight className="w-4 h-4" />
                 </Link>
                 <p className="text-[10px] text-zinc-600 font-bold uppercase">Teste grátis por 7 dias — Cancele quando quiser</p>
              </div>
           </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-28 z-10">
          <div className="relative rounded-3xl overflow-hidden">
            {/* BG layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-[#0a0618] to-violet-950/40" />
            <div className="absolute inset-0 border border-purple-500/[0.15] rounded-3xl" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <div className="absolute inset-0 opacity-50" style={{
              backgroundImage: 'radial-gradient(ellipse at 50% -20%, rgba(192,132,252,0.12) 0%, transparent 65%)',
            }} />

            <div className="relative z-10 text-center px-8 py-16 md:py-24 space-y-6 max-w-3xl mx-auto">
              <p className="text-purple-400 text-[11px] font-black uppercase tracking-[0.25em]">Chega de amadorismo</p>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-[-0.03em] leading-tight">
                O amadorismo está{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-400">
                  custando caro.
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-[#c084fc] to-violet-400">
                  Profissionaliza agora.
                </span>
              </h2>

              <p className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                Seja você uma marca que quer{' '}
                <span className="text-zinc-300 font-semibold">resultado real</span>{' '}
                ou um criador que quer ser{' '}
                <span className="text-zinc-300 font-semibold">levado a sério</span>{' '}
                — o seu lugar é aqui.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/auth/signup?type=influencer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white px-10 py-5 rounded-2xl font-black text-base uppercase tracking-wider transition-all shadow-[0_0_40px_rgba(192,132,252,0.35)] hover:shadow-[0_0_70px_rgba(192,132,252,0.55)]"
                >
                  Começar agora, é grátis <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth/login"
                  className="border border-white/[0.08] hover:bg-white/[0.04] text-zinc-500 hover:text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all"
                >
                  Já tenho conta
                </Link>
              </div>

              <p className="text-zinc-700 text-xs pt-2">
                Sem cartão de crédito. Sem fidelidade. Cancele quando quiser.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-white/[0.04] py-10 px-6 lg:px-12 bg-[#080810] z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <Logo size="sm" href="/" />
            <p className="text-zinc-700 text-xs">© 2026 INFLUNEXT. Todos os direitos reservados.</p>
            <a href="mailto:contato@influnext.com.br" className="text-zinc-600 text-xs hover:text-purple-400 transition-colors">
              contato@influnext.com.br
            </a>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] text-[11px] font-bold text-zinc-600 tracking-wider">
              🛡️ Powered by IA & Escrow — Feito no Brasil
            </div>
            <div className="flex gap-6 text-[11px] text-zinc-700">
              <Link href="/auth/login" className="hover:text-zinc-400 transition-colors font-semibold">Entrar</Link>
              <Link href="/auth/signup" className="hover:text-zinc-400 transition-colors font-semibold">Cadastrar</Link>
              <Link href="/dashboard/marketplace" className="hover:text-zinc-400 transition-colors font-semibold">Marketplace</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
