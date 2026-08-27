'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Brain, 
  ChevronDown, 
  Lock, 
  TrendingUp, 
  FileText, 
  Check, 
  Shield, 
  Zap, 
  CheckCheck,
  Sparkles,
  Target,
  Eye,
  MapPin,
  CreditCard,
  ArrowUpRight,
  Activity,
  DollarSign,
  Users,
  Share2
} from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  { 
    q: 'O que é a Metodologia SafePay da InfluNext?', 
    a: 'É o nosso sistema de garantia financeira e custódia segura integrado ao Mercado Pago. A marca deposita o orçamento antes da gravação. O valor permanece 100% protegido na plataforma e é transferido instantaneamente via Pix para o criador assim que a entrega for conferida e aprovada.' 
  },
  { 
    q: 'Como o influenciador tem a certeza de que receberá o cachê?', 
    a: 'Você só inicia a produção após a confirmação de que o saldo já está depositado em custódia no SafePay. Isso elimina totalmente a possibilidade de calote após a publicação.' 
  },
  { 
    q: 'Como a marca garante que o influenciador cumprirá o briefing?', 
    a: 'O contrato define prazos, formatos e entregáveis auditados. Se o criador não cumprir o combinado ou não postar no prazo, a marca conta com suporte de mediação e garantia de estorno de 100% do saldo.' 
  },
  { 
    q: 'Como funcionam as taxas da plataforma?', 
    a: 'Nas contas gratuitas (Free), a taxa de intermediação é de 15% por contrato. Ao assinar o Creator Premium (R$ 59,90/mês) ou Company Premium (R$ 120,00/mês), a taxa cai para apenas 7%, além de liberar ferramentas avançadas de IA e destaque prioritário.' 
  },
  { 
    q: 'O que é o Selo de Auditoria SHA-256?', 
    a: 'A InfluNext conecta-se diretamente às APIs oficiais do Instagram e TikTok, gerando um hash criptográfico imutável que atesta que os dados de público, engajamento e alcance são 100% autênticos, sem prints falsos.' 
  },
  { 
    q: 'Como e quando o criador recebe o pagamento?', 
    a: 'No momento em que a empresa aprova a entrega, o SafePay processa a transferência instantânea via Pix para a chave cadastrada no perfil do influenciador, sem custos ocultos ou prazos longos de saque.' 
  },
];

export default function LandingPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [pricingTab, setPricingTab] = useState<'creator' | 'brand'>('creator');
  const [productTourTab, setProductTourTab] = useState<'creator' | 'company' | 'mediakit'>('creator');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col font-sans overflow-x-hidden selection:bg-[#FF5E00] selection:text-white">

      {/* ─── TOP NAVBAR (EXACT REPLICA) ─────────────────────────────────── */}
      <header className="w-full pt-4 px-6 lg:px-16 z-50 sticky top-0">
        <div className={`max-w-7xl mx-auto rounded-3xl px-7 py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-md shadow-zinc-900/5' 
            : 'bg-white border border-zinc-200/80 shadow-sm'
        }`}>
          {/* Logo Oficial Proporcional */}
          <div className="flex items-center">
            <Logo size="md" href="/" variant="dark" />
          </div>
          
          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold text-zinc-800">
            <a href="#safepay" className="hover:text-[#FF5E00] transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Metodologia SafePay
            </a>
            <a href="#inteligencia-artificial" className="hover:text-[#FF5E00] transition-colors">IAs Especializadas</a>
            <a href="#plataforma" className="hover:text-[#FF5E00] transition-colors">Por Dentro do App</a>
            <a href="#planos" className="hover:text-[#FF5E00] transition-colors">Planos & Preços</a>
            <a href="#faq" className="hover:text-[#FF5E00] transition-colors">Dúvidas</a>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login" 
              className="text-xs font-bold text-zinc-800 hover:text-[#FF5E00] px-5 py-2.5 rounded-full border border-zinc-300 hover:border-zinc-400 transition-all bg-white"
            >
              Entrar
            </Link>
            
            <Link 
              href="/auth/signup" 
              className="text-xs font-bold bg-[#FF5E00] hover:bg-[#ff4900] text-white px-6 py-2.5 rounded-full transition-all shadow-md shadow-orange-500/20 active:scale-95"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION (WITH VIBRANT ORANGE AMBIENT GLOW) ─────────────── */}
      <section className="relative w-full pt-12 pb-16 md:pt-20 md:pb-24 px-6 lg:px-16 overflow-hidden bg-white">
        
        {/* Sombreado de Laranja Radiante no Fundo (Warm Orange Ambient Glow) */}
        <div className="absolute -top-20 -right-20 w-[850px] h-[750px] bg-[radial-gradient(circle,_rgba(255,107,0,0.32)_0%,_rgba(255,140,50,0.18)_35%,_rgba(255,255,255,0)_70%)] blur-[70px] pointer-events-none z-0" />
        <div className="absolute top-28 right-[10%] w-[500px] h-[450px] bg-[radial-gradient(circle,_rgba(255,94,0,0.22)_0%,_rgba(255,255,255,0)_65%)] blur-[90px] pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Left Column: 4-Lines Headline, Subtitle, Dual Pill Buttons */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight text-[#0F172A] leading-[1.08] mb-6">
              Para influenciadores<br />
              que geram vendas.<br />
              <span className="text-[#FF5E00]">
                Para marcas que<br />
                buscam retorno.
              </span>
            </h1>

            <p className="text-zinc-600 text-sm sm:text-base max-w-lg leading-relaxed mb-8 font-normal">
              A plataforma definitiva para contratação de marketing de influência com métricas auditadas, roteiros estratégicos e pagamentos 100% protegidos via Metodologia SafePay.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <Link 
                href="/auth/signup?type=influencer"
                className="px-7 py-3.5 rounded-full bg-[#FF5E00] hover:bg-[#ff4900] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/25 active:scale-95"
              >
                Entrar como Influenciador
              </Link>

              <Link 
                href="/auth/signup?type=company"
                className="px-7 py-3.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-900 text-zinc-900 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                Criar Conta Grátis
              </Link>
            </div>

          </div>

          {/* Right Column: Exact Glass Window with 3 Cards */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-[2rem] p-5 sm:p-6 shadow-2xl shadow-zinc-900/10 relative overflow-hidden">
              
              {/* Window Dots Header */}
              <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-zinc-100">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              </div>

              {/* 3 Horizontal Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* Card 1: SafePay Ativo */}
                <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-bold">SafePay</span>
                    </div>
                    <span className="text-[9px] font-bold bg-emerald-100/80 text-emerald-700 px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 block">Cachê Garantido</span>
                    <span className="text-xl sm:text-2xl font-black text-[#16A34A] tracking-tight block mt-0.5">
                      R$ 2.400,00
                    </span>
                  </div>
                </div>

                {/* Card 2: IA Vincenzo Script Generator */}
                <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                      <Brain className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-900 leading-tight">
                      IA Vincenzo
                    </span>
                  </div>

                  <div className="bg-orange-50/80 border border-orange-200/70 rounded-xl p-2.5 text-[10px] text-zinc-700 leading-snug">
                    <span className="font-bold text-orange-600 block mb-0.5">Viral video hook: ✨</span>
                    &quot;O erro que te impede de fechar publis reais 🔥&quot;
                  </div>
                </div>

                {/* Card 3: Audited Media Kit */}
                <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-500" />
                    <span className="text-[11px] font-bold text-zinc-900">
                      Audited Kit
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-zinc-400 block">Engajamento</span>
                    <span className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight block mt-0.5">
                      8.4%
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 bg-blue-50/80 border border-blue-200/60 text-blue-700 text-[9px] font-bold px-2 py-1 rounded-lg">
                    <Shield className="w-3 h-3 text-blue-600 flex-shrink-0" />
                    <span>SHA-256 Verified</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ─── METRICS STRIP (EXACT 1:1 MATCH TO IMAGE) ──────────────────── */}
        <div className="max-w-6xl mx-auto mt-16 pt-10 border-t border-zinc-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight block">+R$ 1.5M</span>
            <p className="text-xs font-semibold text-zinc-500 mt-1">Protegidos</p>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight block">0%</span>
            <p className="text-xs font-semibold text-zinc-500 mt-1">Calote</p>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight block">100%</span>
            <p className="text-xs font-semibold text-zinc-500 mt-1">Métricas Reais</p>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight block">1s</span>
            <p className="text-xs font-semibold text-zinc-500 mt-1">Pix Mercado Pago</p>
          </div>
        </div>

      </section>

      {/* ─── METODOLOGIA SAFEPAY (POLISHED & HIGH-END) ──────────────────── */}
      <section id="safepay" className="w-full bg-[#09090B] text-white py-24 px-6 lg:px-16 relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#FF5E00] uppercase tracking-widest block mb-3">
              Custódia Financeira & Garantia Mútua
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Como funciona a Metodologia SafePay?
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              O ecossistema financeiro que protege o cachê do criador antes da gravação e garante à marca entregas auditadas com retorno real.
            </p>
          </div>

          {/* 4 Large & Dynamic Cards - Unified Orange Brand Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-7 space-y-5 transition-all duration-300 hover:-translate-y-1 shadow-xl group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#FF5E00]">01</span>
                  <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5E00] group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Proposta em 1 Clique</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                    A marca seleciona os formatos no Mídia Kit público do criador e formaliza a proposta com briefing detalhado em segundos.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  Contrato Digital Seguro
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-7 space-y-5 transition-all duration-300 hover:-translate-y-1 shadow-xl group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#FF5E00]">02</span>
                  <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5E00] group-hover:scale-110 transition-transform">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Depósito em Custódia</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                    A marca realiza o pagamento via Pix pelo Mercado Pago. O valor fica 100% blindado e protegido no cofre SafePay.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Garantia Mercado Pago
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-7 space-y-5 transition-all duration-300 hover:-translate-y-1 shadow-xl group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#FF5E00]">03</span>
                  <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5E00] group-hover:scale-110 transition-transform">
                    <Brain className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Gravação Protegida</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                    O influenciador recebe a confirmação de saldo garantido e produz com tranquilidade, sabendo que receberá o cachê integral.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  Sem Risco de Calote
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-zinc-900/90 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-7 space-y-5 transition-all duration-300 hover:-translate-y-1 shadow-xl group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#FF5E00]">04</span>
                  <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5E00] group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">Liquidação no Pix</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                    A marca aprova a entrega dos links e o valor líquido é transferido instantaneamente via Pix para a chave do criador.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  Saque Imediato
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── IAS ESPECIALIZADAS (HIGH-END INTERACTIVE SHOWCASE) ─────────── */}
      <section id="inteligencia-artificial" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-24">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-bold text-[#FF5E00] uppercase tracking-widest block mb-3">
            Inteligência Artificial Proprietária
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight mb-4">
            Duas IAs feitas sob medida para o seu sucesso
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
            Nada de prompts genéricos. Nossas IAs foram treinadas com dados de campanhas reais, psicologia de vendas e métricas oficiais de conversão.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* IA 1: Vincenzo & Valentina (Para Creators) */}
          <div className="bg-white border-2 border-orange-500/20 hover:border-orange-500/50 rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-orange-500/5 transition-all duration-300 flex flex-col justify-between space-y-8 group">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF5E00] group-hover:scale-105 transition-transform shadow-inner">
                    <Brain className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">Para Criadores de Conteúdo</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-zinc-950">IA Vincenzo</h3>
                  </div>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Roteiros & Vendas
                </span>
              </div>

              <p className="text-sm text-zinc-600 leading-relaxed font-normal">
                O seu co-piloto diário de criação, precificação e posicionamento comercial. Transforme seu perfil em uma máquina de fechar contratos em dinheiro real.
              </p>

              {/* Live Interactive UI Simulation (Simulador ao Vivo) */}
              <div className="bg-[#FAF8F5] border border-orange-200/60 rounded-2xl p-5 space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-orange-200/40">
                  <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF5E00]" />
                    Simulação: Gerador de Roteiro Viral 30s
                  </span>
                  <span className="text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-0.5 rounded-full">
                    Instagram & TikTok
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-white rounded-xl p-3 border border-orange-100 text-xs text-zinc-700 shadow-sm">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Prompt do Creator:</span>
                    &quot;Roteiro para produto de skin care com foco em conversão rápida&quot;
                  </div>

                  <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-3.5 text-xs text-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#FF5E00] uppercase tracking-wider">Resposta da IA Vincenzo:</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Retenção Estimada 84%</span>
                    </div>
                    <p className="font-semibold text-zinc-900 leading-snug">
                      🎯 <strong className="text-orange-600">Gancho (0-3s):</strong> &quot;Se você ainda lava o rosto assim, você está jogando dinheiro fora...&quot;
                    </p>
                    <p className="text-[11px] text-zinc-600">
                      ⚡ <strong className="text-zinc-800">CTA Final:</strong> Chamada para ação com cupom exclusivo no Mídia Kit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Badges Grid */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 block">Recursos Inclusos da IA Vincenzo:</span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-orange-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-[#FF5E00] flex-shrink-0" />
                    <span>Roteiros 30s e 60s</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-orange-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-[#FF5E00] flex-shrink-0" />
                    <span>Calculadora de Cachê</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-orange-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-[#FF5E00] flex-shrink-0" />
                    <span>Pitch Comercial Pronto</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-orange-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-[#FF5E00] flex-shrink-0" />
                    <span>Melhores Horários</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>Disponível no Plano Creator</span>
              <span className="font-bold text-[#FF5E00] uppercase tracking-wider bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60">
                Ilimitado no PRO
              </span>
            </div>
          </div>

          {/* IA 2: Vektor (Para Empresas & Marcas) */}
          <div className="bg-white border-2 border-emerald-500/20 hover:border-emerald-500/50 rounded-[2.5rem] p-8 sm:p-10 shadow-xl shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between space-y-8 group">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shadow-inner">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Para Marcas & Comércios</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-zinc-950">IA Vektor</h3>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  Estratégia & ROI
                </span>
              </div>

              <p className="text-sm text-zinc-600 leading-relaxed font-normal">
                O diretor de marketing de influência com IA da sua empresa. Selecione influenciadores locais com precisão cirúrgica e meça cada centavo de retorno sobre o investimento.
              </p>

              {/* Live Interactive UI Simulation (Simulador ao Vivo de ROI & Matching) */}
              <div className="bg-[#F4F9F6] border border-emerald-200/60 rounded-2xl p-5 space-y-3.5 shadow-inner">
                <div className="flex items-center justify-between text-xs pb-2.5 border-b border-emerald-200/40">
                  <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    Simulação: Matching Local & Previsão de ROI
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Geolocalizado
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-white rounded-xl p-3 border border-emerald-100 text-xs text-zinc-700 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Critérios da Campanha:</span>
                      <span className="font-semibold text-zinc-800">&quot;Restaurante / Hamburgueria em Campinas - SP&quot;</span>
                    </div>
                    <span className="text-[10px] font-bold bg-zinc-100 px-2.5 py-1 rounded-lg text-zinc-600">Verba: R$ 3.000</span>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Relatório da IA Vektor:</span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">ROI Projetado: 5.8x</span>
                    </div>
                    <p className="font-semibold text-zinc-900 leading-snug">
                      📍 <strong>Recomendação:</strong> 2 micro-influencers com 88% de público na sua cidade e CPM de R$ 11,40.
                    </p>
                    <p className="text-[11px] text-zinc-600">
                      🛡️ <strong>Segurança:</strong> Contrato e custódia SafePay gerados automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Badges Grid */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 block">Recursos Inclusos da IA Vektor:</span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-emerald-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Matching por Cidade</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-emerald-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Cálculo de CPM e ROI</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-emerald-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Auditoria de Entregas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-50 border border-zinc-200/60 font-semibold text-zinc-700 hover:border-emerald-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Relatórios em PDF</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>Disponível no Plano Company</span>
              <span className="font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                15 Análises Mensais no PRO
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* ─── POR DENTRO DA PLATAFORMA (INTERACTIVE PRODUCT TOUR) ───────── */}
      <section id="plataforma" className="w-full bg-[#F8FAFC] border-t border-zinc-200/80 py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-[#FF5E00] uppercase tracking-widest block mb-3">
              Experiência Intuitiva & Alta Performance
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight mb-4">
              Veja como é usar a InfluNext por dentro
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
              Painéis modernos desenhados para dar autonomia e segurança financeira aos criadores, e precisão cirúrgica de ROI para as marcas.
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-zinc-200/80 p-1.5 rounded-full shadow-inner flex-wrap justify-center gap-1">
              <button
                onClick={() => setProductTourTab('creator')}
                className={`px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  productTourTab === 'creator'
                    ? 'bg-white text-zinc-950 shadow-md font-black'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${productTourTab === 'creator' ? 'text-[#FF5E00]' : ''}`} />
                <span>Painel do Criador</span>
              </button>

              <button
                onClick={() => setProductTourTab('company')}
                className={`px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  productTourTab === 'company'
                    ? 'bg-white text-zinc-950 shadow-md font-black'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <TrendingUp className={`w-3.5 h-3.5 ${productTourTab === 'company' ? 'text-emerald-600' : ''}`} />
                <span>Painel da Empresa</span>
              </button>

              <button
                onClick={() => setProductTourTab('mediakit')}
                className={`px-6 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  productTourTab === 'mediakit'
                    ? 'bg-white text-zinc-950 shadow-md font-black'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                <Share2 className={`w-3.5 h-3.5 ${productTourTab === 'mediakit' ? 'text-blue-600' : ''}`} />
                <span>Mídia Kit Público com Checkout</span>
              </button>
            </div>
          </div>

          {/* Product Window Simulation Frame */}
          <div className="bg-white rounded-[2.5rem] border border-zinc-200/90 shadow-2xl shadow-zinc-900/10 overflow-hidden transition-all duration-300">
            
            {/* Window Top Bar */}
            <div className="bg-zinc-50 border-b border-zinc-200/80 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-[11px] font-mono text-zinc-500 bg-white border border-zinc-200/80 rounded-full px-4 py-1 flex items-center gap-1.5 shadow-sm">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>app.influnext.com/{productTourTab === 'creator' ? 'dashboard/creator' : productTourTab === 'company' ? 'dashboard/company' : 'p/mariana.creator'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-zinc-600">Online & Protegido</span>
              </div>
            </div>

            {/* TAB CONTENT 1: PAINEL DO CRIADOR */}
            {productTourTab === 'creator' && (
              <div className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-300">
                {/* Header Profile Greeting & Pix Balance */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Bem-vinda de volta,</span>
                    <h3 className="text-2xl font-black text-zinc-950 flex items-center gap-2">
                      Mariana Silva
                      <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full">PRO</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Saldo Disponível no Pix</span>
                      <span className="text-xl font-black text-emerald-600">R$ 14.850,00</span>
                    </div>
                    <Link 
                      href="/auth/signup?type=influencer"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Sacar no Pix
                    </Link>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Cachês em Custódia</span>
                      <Lock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-2xl font-black text-zinc-900">R$ 6.400,00</div>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      2 contratos blindados no SafePay
                    </span>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Média por Campanha</span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-zinc-900">R$ 3.200,00</div>
                    <span className="text-[11px] font-semibold text-orange-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +28% acima da média regional
                    </span>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Roteiros da IA Vincenzo</span>
                      <Brain className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-zinc-900">24 Gerados</div>
                    <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1 mt-1">
                      Taxa de aprovação: 100%
                    </span>
                  </div>
                </div>

                {/* Active Contracts Table */}
                <div className="space-y-3">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Contratos Ativos em Andamento:</h4>
                  <div className="border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100">
                    <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5E00] flex items-center justify-center font-black">
                          GS
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-zinc-900">Campanha Summer Glow 2026</h5>
                          <span className="text-xs text-zinc-500">Marca: Glow Skincare • Entregável: 1x Reels 60s</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-zinc-900">R$ 3.200,00</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                          <Lock className="w-3 h-3" />
                          SafePay Retido
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                          FT
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-zinc-900">Divulgação Nova Coleção FitTech</h5>
                          <span className="text-xs text-zinc-500">Marca: FitTech Brasil • Entregável: Combo Reels + 3x Stories</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-zinc-900">R$ 3.200,00</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Entregável Aprovado
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: PAINEL DA EMPRESA */}
            {productTourTab === 'company' && (
              <div className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-300">
                {/* Header Company Greeting */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Central da Marca</span>
                    <h3 className="text-2xl font-black text-zinc-950 flex items-center gap-2">
                      Glow Skincare & Cosméticos
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Company PRO</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase block">Verba em Custódia SafePay</span>
                      <span className="text-xl font-black text-zinc-900">R$ 22.400,00</span>
                    </div>
                    <Link 
                      href="/auth/signup?type=company"
                      className="px-4 py-2.5 rounded-xl bg-[#FF5E00] text-white font-bold text-xs hover:bg-[#ff4900] transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Buscar Criadores
                    </Link>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">ROI Real de Campanhas</span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-[#16A34A]">6.4x</div>
                    <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1 mt-1">
                      Auditado via IA Vektor
                    </span>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">CPM Médio Auditado</span>
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-zinc-900">R$ 11,80</div>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      -35% vs anúncios tradicionais
                    </span>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Criadores Locais</span>
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="text-2xl font-black text-zinc-900">8 Ativos</div>
                    <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1 mt-1">
                      Campinas & São Paulo / SP
                    </span>
                  </div>
                </div>

                {/* Matching Radar Simulation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Influenciadores Auditados Sugeridos:</h4>
                    <span className="text-xs text-[#FF5E00] font-bold">Filtro: Cidade São Paulo • Nicho Beleza</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between hover:border-orange-500/40 transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-300 text-white font-black flex items-center justify-center text-base">
                          MS
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-zinc-900">Mariana Silva</span>
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-xs text-zinc-500">128k seguidores • Engajamento 8.4%</p>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                            82% Público em SP
                          </span>
                        </div>
                      </div>
                      <button className="text-xs font-bold bg-[#FF5E00] text-white px-4 py-2 rounded-xl hover:bg-[#ff4900] transition-colors">
                        Contratar
                      </button>
                    </div>

                    <div className="p-5 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between hover:border-orange-500/40 transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-400 to-indigo-300 text-white font-black flex items-center justify-center text-base">
                          LC
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-zinc-900">Lucas Costa</span>
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="text-xs text-zinc-500">94k seguidores • Engajamento 9.1%</p>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                            78% Público em Campinas
                          </span>
                        </div>
                      </div>
                      <button className="text-xs font-bold bg-[#FF5E00] text-white px-4 py-2 rounded-xl hover:bg-[#ff4900] transition-colors">
                        Contratar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: MÍDIA KIT PÚBLICO COM CHECKOUT */}
            {productTourTab === 'mediakit' && (
              <div className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-300 bg-zinc-50/50">
                {/* Profile Header */}
                <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-2xl flex items-center justify-center shadow-md">
                      MS
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-zinc-950">@mariana.creator</h3>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Selo SHA-256
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">Lifestyle • Moda • Beleza • São Paulo - SP</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-center border-t sm:border-t-0 sm:border-l border-zinc-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-around">
                    <div>
                      <span className="text-xl font-black text-zinc-900 block">128.4K</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Seguidores</span>
                    </div>
                    <div>
                      <span className="text-xl font-black text-emerald-600 block">8.4%</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Engajamento</span>
                    </div>
                    <div>
                      <span className="text-xl font-black text-orange-600 block">42.8K</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Visualizações</span>
                    </div>
                  </div>
                </div>

                {/* Rate Card & Direct Checkout */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Pacotes de Publicidade com SafePay:</h4>
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Garantia Financeira Mercado Pago
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-zinc-200 hover:border-orange-500/60 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm transition-all">
                      <div>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Reels Dedicado</span>
                        <h5 className="text-lg font-black text-zinc-900 mt-1">1x Vídeo Reels 60s</h5>
                        <p className="text-xs text-zinc-500 leading-relaxed mt-1">Roteiro estratégico criado com IA Vincenzo, gravação em alta definição e entrega em até 5 dias.</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block">Valor do Pacote</span>
                          <span className="text-xl font-black text-zinc-900">R$ 1.800,00</span>
                        </div>
                        <Link 
                          href="/auth/signup?type=company"
                          className="px-5 py-2.5 rounded-full bg-[#FF5E00] text-white font-bold text-xs hover:bg-[#ff4900] transition-all shadow-md shadow-orange-500/20"
                        >
                          Contratar com SafePay
                        </Link>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-orange-500 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-md transition-all relative">
                      <div className="absolute -top-2.5 right-6 bg-[#FF5E00] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
                        Mais Vendido
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Combo Completo</span>
                        <h5 className="text-lg font-black text-zinc-900 mt-1">1x Reels + 3x Stories</h5>
                        <p className="text-xs text-zinc-500 leading-relaxed mt-1">Sequência persuasiva de Stories com link rastreado + 1 Reels fixado no feed para máxima conversão.</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold block">Valor do Pacote</span>
                          <span className="text-xl font-black text-[#FF5E00]">R$ 2.600,00</span>
                        </div>
                        <Link 
                          href="/auth/signup?type=company"
                          className="px-5 py-2.5 rounded-full bg-[#FF5E00] text-white font-bold text-xs hover:bg-[#ff4900] transition-all shadow-md shadow-orange-500/20"
                        >
                          Contratar com SafePay
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ─── PLANOS & PREÇOS ────────────────────────────────────────────── */}
      <section id="planos" className="w-full bg-[#FAFAFA] border-t border-zinc-200/80 py-24 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto text-center">
          
          <span className="text-xs font-black text-[#FF5E00] uppercase tracking-widest block mb-3">
            Transparência Total de Valores
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight mb-4">
            Escolha o plano ideal para a sua escala
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-12">
            Comece sem custo fixo e faça o upgrade conforme seu faturamento e suas campanhas crescem.
          </p>

          {/* Pricing Switcher */}
          <div className="inline-flex bg-zinc-200/80 p-1.5 rounded-full mb-14 shadow-inner">
            <button
              onClick={() => setPricingTab('creator')}
              className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                pricingTab === 'creator'
                  ? 'bg-white text-zinc-950 shadow-md font-black'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Para Criadores de Conteúdo
            </button>
            <button
              onClick={() => setPricingTab('brand')}
              className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                pricingTab === 'brand'
                  ? 'bg-white text-zinc-950 shadow-md font-black'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Para Marcas & Agências
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left items-stretch">
            {pricingTab === 'creator' ? (
              <>
                {/* Creator Free */}
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between space-y-8 shadow-sm">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Iniciante</span>
                      <h3 className="text-2xl font-black text-zinc-900">Creator Free</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">Ideal para quem está começando a organizar suas primeiras parcerias de publicidade.</p>
                    </div>

                    <div className="py-2 border-y border-zinc-100">
                      <span className="text-4xl font-black text-zinc-900">R$ 0</span>
                      <span className="text-zinc-400 text-xs font-bold ml-1">/ para sempre</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-zinc-600 font-medium">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Taxa SafePay de 15% por contrato fechado</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Mídia Kit público com checkout direto</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Conexão de 1 rede social (Instagram)</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Acesso básico à IA Vincenzo para roteiros</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Garantia de recebimento via Pix no SafePay</span>
                      </li>
                    </ul>
                  </div>

                  <Link 
                    href="/auth/signup?type=influencer"
                    className="w-full text-center py-4 rounded-full border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-black uppercase tracking-wider block transition-all"
                  >
                    Começar Gratuitamente
                  </Link>
                </div>

                {/* Creator Premium */}
                <div className="bg-white border-2 border-[#FF5E00] rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between space-y-8 relative shadow-2xl shadow-orange-500/10">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FF7A00] to-[#FF4500] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                    Mais Recomendado
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-[#FF5E00] uppercase tracking-widest">Profissional PRO</span>
                      <h3 className="text-2xl font-black text-zinc-900">Creator Premium</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">O plano para criadores profissionais que buscam faturar alto e reter o máximo de lucro.</p>
                    </div>

                    <div className="py-2 border-y border-zinc-100">
                      <span className="text-4xl font-black text-[#FF5E00]">R$ 59,90</span>
                      <span className="text-zinc-500 text-xs font-bold ml-1">/ por mês</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-zinc-750 font-semibold">
                      <li className="flex items-center gap-2.5 text-zinc-950 font-black">
                        <Check className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                        <span>Taxa SafePay reduzida para apenas 7% (retenha mais lucro)</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                        <span>Acesso 100% ilimitado à IA Vincenzo & Valentina</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-zinc-950 font-black">
                        <Check className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                        <span>Selo Verificado PRO com destaque nas buscas das marcas</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                        <span>Conexão de contas ilimitadas (Instagram + TikTok)</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                        <span>Contratos simultâneos ativos sem limite</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#FF5E00] flex-shrink-0" />
                        <span>Geração ilimitada de propostas e pitch comercial</span>
                      </li>
                    </ul>
                  </div>

                  <Link 
                    href="/auth/signup?type=influencer"
                    className="w-full text-center py-4 rounded-full bg-[#FF5E00] hover:bg-[#ff4900] text-white text-xs font-black uppercase tracking-wider block transition-all shadow-lg shadow-orange-500/25 active:scale-95"
                  >
                    Assinar Creator Premium
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Brand Free */}
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between space-y-8 shadow-sm">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Iniciante</span>
                      <h3 className="text-2xl font-black text-zinc-900">Company Free</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">Para comércios e empresas contratarem criadores com total segurança SafePay.</p>
                    </div>

                    <div className="py-2 border-y border-zinc-100">
                      <span className="text-4xl font-black text-zinc-900">R$ 0</span>
                      <span className="text-zinc-400 text-xs font-bold ml-1">/ para sempre</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-zinc-600 font-medium">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Taxa SafePay de 15% por contratação</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Busca de criadores e contratação direta no Mídia Kit</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Até 3 contratos ativos simultâneos</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Garantia de estorno caso o criador não entregue</span>
                      </li>
                    </ul>
                  </div>

                  <Link 
                    href="/auth/signup?type=company"
                    className="w-full text-center py-4 rounded-full border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-black uppercase tracking-wider block transition-all"
                  >
                    Começar como Empresa
                  </Link>
                </div>

                {/* Company Premium */}
                <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-8 sm:p-10 flex flex-col justify-between space-y-8 relative shadow-2xl shadow-emerald-500/10">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                    Recomendado para Empresas
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Empresas & Agências</span>
                      <h3 className="text-2xl font-black text-zinc-900">Company Premium</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">A central definitiva para gerenciar múltiplos influenciadores com ROI auditado.</p>
                    </div>

                    <div className="py-2 border-y border-zinc-100">
                      <span className="text-4xl font-black text-emerald-600">R$ 120,00</span>
                      <span className="text-zinc-500 text-xs font-bold ml-1">/ por mês</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-zinc-750 font-semibold">
                      <li className="flex items-center gap-2.5 text-zinc-950 font-black">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Taxa SafePay reduzida para apenas 7%</span>
                      </li>
                      <li className="flex items-center gap-2.5 text-zinc-950 font-black">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>15 relatórios avançados de ROI e CPM com a IA Vektor</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Matching geolocalizado de influenciadores locais</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Contratos e campanhas simultâneas ilimitadas</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Painel colaborativo multi-usuários para a equipe</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Auditoria automática e relatórios em PDF para clientes</span>
                      </li>
                    </ul>
                  </div>

                  <Link 
                    href="/auth/signup?type=company"
                    className="w-full text-center py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider block transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    Assinar Company Premium
                  </Link>
                </div>
              </>
            )}
          </div>

        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" className="w-full max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <span className="text-xs font-black text-[#FF5E00] uppercase tracking-widest block mb-2">
            Tire suas Dúvidas
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="border border-zinc-200 rounded-2xl bg-white overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 select-none"
                >
                  <span className="text-sm font-bold text-zinc-900">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-[#FF5E00]' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-zinc-600 leading-relaxed font-medium border-t border-zinc-100 pt-4 animate-in fade-in duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="w-full bg-white border-t border-zinc-200 py-12 px-6 lg:px-16 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/" variant="dark" />
            <span className="text-zinc-300">|</span>
            <span className="text-[11px] text-zinc-500 font-medium">Marketing de Influência & SafePay</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-bold text-zinc-600">
            <Link href="/termos" className="hover:text-[#FF5E00] transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-[#FF5E00] transition-colors">Privacidade</Link>
          </div>

          <p className="text-[10px] text-zinc-400">
            © {new Date().getFullYear()} InfluNext. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
