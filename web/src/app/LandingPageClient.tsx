'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Brain, 
  ChevronDown, 
  User,
  DollarSign,
  Layout,
  MessageSquare,
  Calendar
} from 'lucide-react';


const FAQ = [
  { 
    q: 'O que é o Escrow Seguro da InfluNext?', 
    a: 'É um sistema de garantia financeira mútua. A marca deposita o orçamento em uma conta de garantia (escrow) retida pela plataforma. O influenciador produz protegido sabendo que o saldo existe, e o valor é liberado automaticamente assim que nossa IA audita a publicação e aprova o link do post.' 
  },
  { 
    q: 'Por que o modelo híbrido de taxas transacionais diminui com o plano?', 
    a: 'No plano Free, cobramos 15% de comissão por transação. No plano Pro (R$ 49/mês), a comissão cai para 10%. No plano Master (R$ 149/mês), cai para 5%. Criamos essa progressão de escala para que influenciadores profissionais e agências retenham muito mais lucro à medida que faturam alto.' 
  },
  { 
    q: 'Como o Mentor de IA Vektor ajuda marcas sem experiência em marketing?', 
    a: 'O Vektor atua como um co-piloto estratégico de branding e ROI. Ele ajuda marcas iniciantes a entenderem que marketing de influência de sucesso não exige gastar milhões de uma vez, mas sim ter consistência, escala gradativa e foco claro no posicionamento do produto. Com o Vektor, você aprende a escolher e negociar com os influenciadores certos, obtendo muito mais alcance local e vendas reais gastando menos.'
  },
  { 
    q: 'Como funciona a proteção contra calotes no interior?', 
    a: 'Para comércios locais (clínicas, lojas e restaurantes), criamos o micro-escrow. A marca pode contratar campanhas de R$ 300 a R$ 1.500 com total segurança, garantindo que o dinheiro só saia do caixa quando o post local for entregue.' 
  },
  { 
    q: 'O Mentor de IA analisa meus dados reais?', 
    a: 'Sim! A IA analisa seu nicho, seu engajamento real do Instagram/TikTok/YouTube e os relatórios de onboarding. A partir disso, ela gera roteiros de alta conversão, e-mails de pitch comercial e analisa tendências específicas para a sua geolocalização.' 
  },
];

export default function LandingPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col font-sans overflow-x-hidden">

      {/* NAV */}
      <nav className={`w-full px-6 lg:px-16 py-5 flex justify-between items-center z-50 sticky top-0 transition-all duration-300 ${scrolled ? 'bg-[#050508]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/80' : 'bg-transparent'}`}>
        <Logo size="md" href="/" variant="light" />
        
        {/* Navigation Menu centered */}
        <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-widest text-zinc-200">
          <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
          <a href="#preview" className="hover:text-white transition-colors">Visualizar Painel</a>
          <a href="#problema" className="hover:text-white transition-colors">O Problema</a>
          <a href="#planos" className="hover:text-white transition-colors">Planos & Preços</a>
        </div>
        
        {/* Right controls */}
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:text-white transition-colors px-2.5 py-1.5">
            Entrar
          </Link>
          
          <Link href="/auth/signup?type=influencer" className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-purple-600/20">
            Cadastrar
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative w-full min-h-[95vh] flex flex-col items-center justify-center text-center px-6 pt-4 pb-24 overflow-hidden">
        {/* bg glows */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-[500px] h-[400px] rounded-full bg-pink-600/8 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-5xl">
          {/* Logo completo centralizado no Hero */}
          <div className="mb-6 scale-110 sm:scale-125 transition-all duration-300">
            <Logo size="xxl" href={null} variant="light" />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter leading-[1.0] md:leading-[0.95] mt-4 mb-8 max-w-3xl">
            Para influenciadores que geram vendas<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500">Para marcas que buscam retorno</span>
          </h1>
          
          <p className="text-zinc-200 text-base md:text-lg max-w-3xl leading-relaxed mb-10">
            O fim das permutas sem valor e dos contratos baseados em promessas. A InfluNext é o primeiro ecossistema completo que profissionaliza e gerencia a rotina de criadores de conteúdo para atrair e fechar publicidades reais, enquanto fornece às marcas a segurança de contratar com pagamento via Escrow protegido e retorno real garantido por nossa Inteligência Artificial.
          </p>

          {/* Crucial Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-20 pt-10 border-t border-white/5 w-full max-w-5xl relative z-10">
            {/* Benefício 1: Gestão de Carreira */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-purple-500/20 transition-all duration-300 gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Criadores & Marcas</p>
                <h4 className="text-sm font-bold text-white mb-2">Carreira & Rotina por IA</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-bold">
                  Nossa IA organiza a rotina do criador e gera roteiros locais virais, garantindo à marca postagens consistentes e alinhadas ao cronograma.
                </p>
              </div>
            </div>

            {/* Benefício 2: Negociação Racional */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-pink-500/20 transition-all duration-300 gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">Decisão por Dados</p>
                <h4 className="text-sm font-bold text-white mb-2">Acordos via Métricas Reais</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-bold">
                  Negociação justa baseada em dados reais de engajamento locais e público-alvo, eliminando fraudes e precificações arbitrárias.
                </p>
              </div>
            </div>

            {/* Benefício 3: Escrow de Pagamento Seguro */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-emerald-500/20 transition-all duration-300 gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Garantia Financeira</p>
                <h4 className="text-sm font-bold text-white mb-2">Escrow 100% Protegido</h4>
                <p className="text-zinc-400 text-xs leading-relaxed font-bold">
                  O cachê é depositado em juízo antes de postar. O influenciador sabe que vai receber e a marca só libera o pagamento após postagem validada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOCKUP PREVIEW - Finance */}
      <section id="preview" className="relative w-full max-w-6xl mx-auto px-6 py-20">
         <div className="text-center mb-12">
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">✦ Controle Total</p>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95]">Controle financeiro e contratos inteligentes<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Gerencie tudo em uma única tela segura</span></h2>
            <p className="text-zinc-300 text-xs mt-4 max-w-xl mx-auto leading-relaxed">
               Acompanhe suas parcerias do início ao fim, controle prazos de entrega e garanta o recebimento seguro via Escrow sem burocracia.
            </p>
         </div>

         {/* Dashboard Window Chrome Mockup - Finance */}
         <div className="border border-white/10 rounded-[2rem] bg-black/40 overflow-hidden shadow-2xl relative shadow-purple-900/10">
            {/* Header chrome buttons */}
            <div className="h-12 border-b border-white/5 px-6 flex items-center justify-between bg-zinc-950/60">
               <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
               </div>
               <div className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">dashboard.influnext.com</div>
               <div className="w-12" />
            </div>

            {/* Dashboard Mockup Body */}
            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-85 hover:opacity-100 transition-opacity duration-300">
               {/* Left Column: Wallet & Escrow Status */}
               <div className="space-y-6">
                  {/* Escrow Status Card */}
                  <div className="p-6 rounded-3xl border border-green-500/20 bg-green-500/5 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Escrow Ativo</span>
                        <ShieldCheck className="text-green-400 w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-zinc-200">Garantia Retida em Juízo</p>
                        <p className="text-3xl font-black text-white tracking-tighter mt-1">R$ 3.500,00</p>
                     </div>
                     <p className="text-[9px] text-zinc-300 leading-relaxed font-bold uppercase tracking-wider">
                        Depósito Loreal Brasil SA verificado. Pagamento garantido assim que o Reels for postado.
                     </p>
                  </div>

                  {/* Wallet Faturamento Card */}
                  <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-zinc-350 uppercase tracking-widest">Saldo Disponível</span>
                        <DollarSign className="text-zinc-400 w-4 h-4" />
                     </div>
                     <div>
                        <p className="text-3xl font-black text-white tracking-tighter">R$ 4.250,00</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="text-[8px] bg-green-500/10 text-green-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Livre para Saque</span>
                     </div>
                  </div>
               </div>

               {/* Center Column: Deliverables & Campaign Tasks */}
               <div className="p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col justify-between gap-6 md:col-span-2">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
                           <Layout size={18} />
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Cronograma de Entrega</p>
                           <p className="text-sm font-bold text-white">Entregáveis do Contrato Ativo</p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-zinc-350 uppercase tracking-wider">Tarefa 1: Publicações Iniciais</span>
                              <span className="text-[8px] bg-yellow-500/10 text-yellow-500 font-bold px-2 py-0.5 rounded">Em produção</span>
                           </div>
                           <p className="text-[10px] text-zinc-300 leading-relaxed font-bold">
                              Preparar três posts para o produto total para a empresa Loreal Brasil SA.
                           </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-wider">Tarefa 2: Stories Sequenciais</span>
                              <span className="text-[8px] bg-green-500/10 text-green-500 font-bold px-2 py-0.5 rounded">Aprovado</span>
                           </div>
                           <p className="text-[10px] text-zinc-300 leading-relaxed font-bold">
                              Criar um post de feed e quatro stories de engajamento demonstrando a aplicação real do produto.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Simulated Status Footer */}
                  <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-zinc-300">
                     <span>Próximo prazo: 15 de Junho de 2026</span>
                     <span className="font-bold text-white uppercase tracking-wider">Acompanhar Progresso</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* MOCKUP PREVIEW 2 (IA & Hábitos) */}
      <section id="preview-ai" className="relative w-full max-w-6xl mx-auto px-6 pb-20">
         <div className="text-center mb-12">
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">✦ Inteligência & Consistência</p>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95]">Consistência e roteiros guiados por IA<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Crie publicações de alto engajamento em segundos</span></h2>
            <p className="text-zinc-300 text-xs mt-4 max-w-xl mx-auto leading-relaxed">
               Receba orientações personalizadas por IA para seu nicho e mantenha a disciplina através de um calendário projetado para transformar visualizações em conversão de vendas.
            </p>
         </div>

         {/* Dashboard Window Chrome Mockup - IA & Habits */}
         <div className="border border-white/10 rounded-[2rem] bg-black/40 overflow-hidden shadow-2xl relative shadow-purple-900/10">
            {/* Header chrome buttons */}
            <div className="h-12 border-b border-white/5 px-6 flex items-center justify-between bg-zinc-950/60">
               <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
               </div>
               <div className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">dashboard.influnext.com/workspace</div>
               <div className="w-12" />
            </div>

            {/* Dashboard Mockup Body */}
            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-85 hover:opacity-100 transition-opacity duration-300">
               {/* Left Column: AI Assistant suggestions */}
               <div className="space-y-6">
                  {/* AI Tip Card */}
                  <div className="p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">IA Estrategista</span>
                        <Brain className="text-purple-400 w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-zinc-300">Análise de Engajamento:</p>
                        <p className="text-sm font-bold text-white mt-1">Sua audiência local sobe +22% às quartas-feiras às 19h no interior.</p>
                     </div>
                     <p className="text-[8px] text-zinc-400 uppercase tracking-wider font-bold">
                        Sugestão: Agendar Reels de moda local para quarta.
                     </p>
                  </div>

                  {/* AI Strategy Box */}
                  <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-3">
                     <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Métricas Ativas</span>
                        <Zap className="text-yellow-500 w-4 h-4" />
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                           <span className="text-zinc-400">Público Alvo</span>
                           <span className="font-bold text-emerald-400">94% Regional (SP)</span>
                        </div>
                         <div className="flex justify-between text-[10px]">
                            <span className="text-zinc-400">Gancho Viral (Hook)</span>
                            <span className="font-bold text-white">&quot;3 Looks que parecem caros...&quot;</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Center/Right Column: Habits, Motivation & Task Calendar */}
                <div className="p-6 rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col justify-between gap-6 md:col-span-2">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
                               <Calendar size={18} className="text-purple-400" />
                            </div>
                            <div>
                               <p className="text-[8px] font-black text-zinc-350 uppercase tracking-widest">Rotina e Hábitos</p>
                               <p className="text-sm font-bold text-white">Calendário de Hábitos do Criador</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="text-[9px] bg-purple-500/10 text-purple-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">Força do Hábito: 85%</span>
                         </div>
                      </div>

                      {/* Calendar Habits List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div className="p-4 rounded-2xl bg-zinc-950/85 border border-white/5 flex items-center justify-between">
                            <div>
                               <p className="text-[9px] text-zinc-400 font-black uppercase">Segunda-feira</p>
                               <p className="text-xs font-bold text-white mt-0.5">Postar 3 Stories</p>
                            </div>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">Feito</span>
                         </div>

                         <div className="p-4 rounded-2xl bg-zinc-950/85 border border-white/5 flex items-center justify-between">
                            <div>
                               <p className="text-[9px] text-zinc-400 font-black uppercase">Terça-feira</p>
                               <p className="text-xs font-bold text-white mt-0.5">Gravar 2 Reels</p>
                            </div>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded">Feito</span>
                         </div>

                         <div className="p-4 rounded-2xl bg-zinc-950/85 border border-purple-500/30 bg-purple-500/5 flex items-center justify-between animate-pulse">
                            <div>
                               <p className="text-[9px] text-purple-400 font-black uppercase">Quarta-feira (Hoje)</p>
                               <p className="text-xs font-bold text-white mt-0.5">Publicar Reels de Outono</p>
                            </div>
                            <span className="text-[8px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded">Agendado</span>
                         </div>

                         <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex items-center justify-between opacity-50">
                            <div>
                               <p className="text-[9px] text-zinc-400 font-black uppercase">Quinta-feira</p>
                               <p className="text-xs font-bold text-white mt-0.5">Responder Directs</p>
                            </div>
                            <span className="text-[8px] bg-zinc-800 text-zinc-400 font-bold px-2 py-0.5 rounded">Pendente</span>
                         </div>
                      </div>
                   </div>

                   {/* Motivation Bar */}
                   <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-zinc-350">
                      <p className="font-bold text-white">🔥 Meta Semanal: 4/5 tarefas concluídas. Você está focado!</p>
                      <span className="font-bold text-purple-400 uppercase tracking-widest">Ver Painel Completo</span>
                   </div>
                </div>
            </div>
         </div>
      </section>

      {/* MOCKUP PREVIEW 3 (Chat com o Mentor por IA) */}
      <section id="preview-chat" className="relative w-full max-w-6xl mx-auto px-6 pb-20">
         <div className="text-center mb-12">
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">✦ Interatividade em Tempo Real</p>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95]">Mentoria inteligente em tempo real<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Obtenha ganchos de alta conversão para seus posts</span></h2>
            <p className="text-zinc-300 text-xs mt-4 max-w-xl mx-auto leading-relaxed">
               Veja como o seu Mentor de IA (Vincenzo) acompanha seu fluxo de caixa de contratos e cria ganchos prontos para suas publicações.
            </p>
         </div>

         {/* Chat Preview Widget */}
         <InteractiveChatPreview />
      </section>

      {/* O PROBLEMA (Foco na dor do influenciador local e marcas locais) */}
      <section id="problema" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-20">
        <div className="border border-red-500/10 bg-red-500/5 rounded-[3rem] p-8 md:p-14">
          <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">⚠ A dura realidade que ninguém te conta</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-10 leading-tight">
            Relações informais geram desperdício e calotes.<br />
            <span className="text-red-400">Dê um fim às permutas vazias e parcerias sem garantia.</span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LADO DO CRIADOR */}
            <div className="bg-black/40 border border-red-900/30 rounded-[2rem] p-8 space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                Lado do Criador (Creators)
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-white/[0.01] border border-red-500/5 rounded-2xl">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Permutas Sem Valor</h4>
                     <p className="text-xs text-zinc-300 leading-relaxed font-bold">
                      Micro-influenciadores trabalhando em troca de &quot;recebidos e lanches&quot; gratuitos, enquanto marcas lucram em cima do seu engajamento hiper-local.
                     </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-white/[0.01] border border-red-500/5 rounded-2xl">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">WhatsApp & Calote</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-bold">
                      Parcerias fechadas na base da palavra que somem na hora do pagamento. Você produz, posta, entrega alcance e fica sem receber o cachê.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DA EMPRESA */}
            <div className="bg-black/40 border border-pink-900/30 rounded-[2rem] p-8 space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                Lado da Empresa (Brands)
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 bg-white/[0.01] border border-pink-500/5 rounded-2xl">
                  <XCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-1">Seguidores Falsos & Fraude</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-bold">
                      Dinheiro jogado fora com influenciadores inflados que compram seguidores falsos e não geram uma única venda real no seu comércio local.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-5 bg-white/[0.01] border border-pink-500/5 rounded-2xl">
                  <XCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-1">Atraso & Falta de ROI</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed font-bold">
                      Impossibilidade de medir o retorno financeiro da campanha e falta de comprometimento dos criadores com prazos e briefings acordados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-red-500/10 text-center">
             <p className="text-zinc-200 text-xs font-bold leading-relaxed">
                A InfluNext profissionaliza essa relação bilateral. Conectamos criadores locais a marcas locais sob um ecossistema com **pagamento em Escrow seguro**, garantindo que o criador receba e que a marca receba a postagem exata auditada.
             </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO ECOSSISTEMA DE IA */}
      <section id="inteligencia-ia" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-24 relative overflow-hidden">
        {/* Glows de fundo */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-[500px] h-[500px] rounded-full bg-pink-600/5 blur-[120px] pointer-events-none" />

        <div className="text-center mb-16 relative z-10">
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">✦ Cérebro do Ecossistema</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95] mb-4">
            Duas IAs especializadas. Uma para cada ponta.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Inteligência que gera dinheiro real, não curtidas.</span>
          </h2>
          <p className="text-zinc-400 text-xs max-w-2xl mx-auto leading-relaxed">
            Eliminamos a intermediação humana ineficiente. Nossos modelos de IA são treinados com dados de geolocalização e engajamento hiper-local para otimizar campanhas e valorizar o trabalho de criadores e o retorno de marcas.
          </p>
        </div>

        {/* Grid das duas IAs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 max-w-5xl mx-auto items-stretch">
          
          {/* Card 1: IA Vincenzo (Creators) */}
          <div className="border border-purple-500/20 bg-gradient-to-b from-purple-950/10 to-transparent rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-all duration-300 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-950/10">
            <div>
              {/* Header do Card */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-purple-400 text-[9px] font-black uppercase tracking-widest block">Para Criadores de Conteúdo</span>
                    <h3 className="text-2xl font-black text-white">IA Vincenzo</h3>
                  </div>
                </div>
                <span className="text-[9px] bg-purple-500/15 text-purple-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-purple-500/10">
                  Gestão & Monetização
                </span>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed mb-6 font-bold">
                O Vincenzo é o estrategista de carreira do criador de conteúdo. Ele analisa seu perfil real e garante que você receba propostas em dinheiro, acabando com as permutas sem valor de &ldquo;recebidos e lanches&rdquo;.
              </p>

              {/* Tópicos de Inteligência */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Especialização por Nicho</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                      A IA mapeia a linguagem e o tom de voz do seu nicho exato (moda, beleza, gastronomia), gerando roteiros locais que convertem.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Contratos Reais em Dinheiro</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                      A IA formata propostas comerciais estruturadas e cobra um cachê justo da marca, garantido pelo nosso sistema de Escrow Seguro.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Crescimento de Carreira Guiado</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                      Mapeamento de hábitos de postagem e rotina de gravação baseados em dados reais de engajamento do seu perfil.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Card: Administração */}
            <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Administrado por: <strong className="text-purple-450 font-bold">O Criador (Via Redes Sociais)</strong></span>
              <span className="text-purple-400 font-bold uppercase tracking-wider">Ativo</span>
            </div>
          </div>

          {/* Card 2: IA Vektor (Brands) */}
          <div className="border border-pink-500/20 bg-gradient-to-b from-pink-950/10 to-transparent rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between transition-all duration-300 hover:border-pink-500/40 hover:shadow-2xl hover:shadow-pink-950/10">
            <div>
              {/* Header do Card */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-inner">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-pink-400 text-[9px] font-black uppercase tracking-widest block">Para Marcas & Comércios Locais</span>
                    <h3 className="text-2xl font-black text-white">IA Vektor</h3>
                  </div>
                </div>
                <span className="text-[9px] bg-pink-500/15 text-pink-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-pink-500/10">
                  Branding & ROI
                </span>
              </div>

              <p className="text-zinc-300 text-xs leading-relaxed mb-6 font-bold">
                O Vektor atua como o co-piloto estratégico da marca. Ele garante que cada centavo retorne em vendas, orientando sobre branding, calculando o ROI e fazendo a seleção inteligente do influencer ideal.
              </p>

              {/* Tópicos de Inteligência */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Posicionamento de Marca & ROI</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                      A IA orienta marcas a definirem o orçamento ideal e estruturarem o cronograma de campanhas locais de forma inteligente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Escolha de Influencers por Geolocalização</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                      Varre o mapa para encontrar criadores que possuam audiência real na mesma geolocalização e cidade do comércio da marca.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Análise de Pitch & Relatório de Posição</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                      Geração automatizada de pitch de abordagem e relatórios consolidados pós-campanha para mensurar o ganho real de visibilidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Card: Administração */}
            <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-zinc-400 flex items-center justify-between">
              <span>Administrado por: <strong className="text-pink-450 font-bold">A Marca (Via Painel Brand Agency)</strong></span>
              <span className="text-pink-400 font-bold uppercase tracking-wider">Ativo</span>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO DE PLANOS & PREÇOS */}
      <section id="planos" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-20 relative overflow-hidden">
        {/* bg glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

        <div className="text-center mb-16 relative z-10">
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">✦ Transparência Total</p>
          <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95] mb-4">
            Escolha o plano ideal para a sua<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">escala de faturamento</span>
          </h2>
          <p className="text-zinc-400 text-xs max-w-xl mx-auto leading-relaxed">
            Dê risco zero à sua carreira. Comece sem custo fixo e faça o upgrade conforme suas campanhas crescem e seu faturamento aumenta.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 max-w-4xl mx-auto items-stretch">
          
          {/* Card 1: Creator Premium */}
          <div className="border border-purple-500/20 bg-gradient-to-b from-purple-950/10 to-transparent hover:border-purple-500/40 rounded-[2.5rem] p-10 flex flex-col justify-between transition-all duration-300 shadow-xl relative group">
            {/* Tag popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-400/20 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
              Recomendado para Criadores
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-purple-400 text-[9px] font-black uppercase tracking-widest">Elite Creator</span>
                <h3 className="text-2xl font-black text-white">Creator Premium</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-bold">O plano definitivo para o Creator profissional gerenciar sua carreira e faturar alto em dinheiro real.</p>
              </div>

              <div className="py-4 border-y border-white/5 space-y-1">
                <span className="text-sm font-bold text-purple-400">R$</span>
                <span className="text-5xl font-black text-white tracking-tighter">49,90</span>
                <span className="text-zinc-500 text-[10px] font-bold block uppercase tracking-wider">Por mês</span>
              </div>

              <ul className="space-y-3.5 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Taxa de comissão reduzida de apenas <strong className="text-white font-black">5% por campanha</strong> para você reter mais lucro líquido.</span>
                </li>
                <li className="flex items-center gap-3 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Acesso ilimitado ao Vincenzo, nosso <strong className="text-white font-black">gerador de roteiros de alta conversão</strong>.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Recomendação inteligente de <strong className="text-white font-black">perfis semelhantes</strong> e ganchos de vídeo personalizados.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Garantia de <strong className="text-white font-black">contratos em dinheiro real</strong>, eliminando parcerias em troca de lanches.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Conexão para <strong className="text-white font-black">redes sociais ilimitadas</strong> (Instagram, TikTok e YouTube).</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Destaque máximo com o selo <strong className="text-white font-black">Verificado PRO</strong> nas buscas feitas pelas marcas.</span>
                </li>
              </ul>
            </div>
 
            <div className="pt-8">
              <Link href="/auth/signup?type=influencer" className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 active:scale-95">
                Escolher Plano Creator Premium
              </Link>
            </div>
          </div>
 
          {/* Card 2: Brand Agency */}
          <div className="border border-pink-500/20 bg-gradient-to-b from-pink-950/10 to-transparent rounded-[2.5rem] p-10 flex flex-col justify-between transition-all duration-300 shadow-xl relative group">
            {/* Tag popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-600 to-purple-600 border border-pink-400/20 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
              Recomendado para Empresas
            </div>
 
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-pink-400 text-[9px] font-black uppercase tracking-widest">Enterprise Partner</span>
                <h3 className="text-2xl font-black text-white">Brand Agency</h3>
                <p className="text-zinc-400 text-xs leading-relaxed font-bold">A central de inteligência para marcas e agências gerenciarem criadores locais com ROI auditado.</p>
              </div>
 
              <div className="py-4 border-y border-white/5 space-y-1">
                <span className="text-sm font-bold text-pink-400">R$</span>
                <span className="text-5xl font-black text-white tracking-tighter">110,00</span>
                <span className="text-zinc-500 text-[10px] font-bold block uppercase tracking-wider">Por mês</span>
              </div>
 
              <ul className="space-y-3.5 text-xs text-zinc-300 font-medium">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Taxa operacional de garantia reduzida de <strong className="text-white font-black">10% por campanha</strong>.</span>
                </li>
                <li className="flex items-center gap-3 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Acesso ilimitado ao mentor Vektor para <strong className="text-white font-black">definir seu posicionamento e medir o ROI</strong>.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Mecanismo inteligente para <strong className="text-white font-black">encontrar influenciadores locais</strong> da mesma cidade.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Criação de e-mails de abordagem e <strong className="text-white font-black">relatórios de presença de marca</strong> automatizados.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Campanhas e contratos ativos <strong className="text-white font-black">sem limite</strong> com auditoria automática de posts.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span>Painel colaborativo completo para <strong className="text-white font-black">múltiplos administradores</strong> da sua empresa.</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link href="/auth/signup?type=company" className="block w-full text-center bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-505 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-pink-600/20 active:scale-95">
                Escolher Plano Brand Agency
              </Link>
            </div>
          </div>

        </div>

        {/* Bilateral Free Tiers info note */}
        <div className="mt-16 max-w-3xl mx-auto bg-zinc-950/60 border border-white/5 rounded-3xl p-8 text-center text-xs relative z-10">
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-4">Planos de Entrada (Free Tiers)</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left text-zinc-400 font-medium">
            <div className="p-5 bg-white/[0.01] rounded-2xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Criadores Free (R$ 0)</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                Taxa de comissão de 15% por campanha, 1 rede social conectada (Instagram), 1 contrato ativo em andamento e acesso básico à IA Vincenzo para roteiros.
              </p>
            </div>
            <div className="p-5 bg-white/[0.01] rounded-2xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Marcas Free (R$ 0)</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">
                Taxa de Escrow de 15% sobre o orçamento depositado, briefings padronizados e limite de até 3 campanhas ativas simultaneamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full max-w-4xl mx-auto px-6 lg:px-16 py-20">
        <div className="text-center mb-16">
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Dúvidas</p>
          <h2 className="text-4xl font-black tracking-tight">Perguntas frequentes.</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                <span className="font-bold text-sm text-white">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-300 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-zinc-200 text-sm leading-relaxed border-t border-white/5 pt-4">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-12 pb-28">
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-purple-950/80 via-[#0a0a0e] to-pink-950/40 border border-purple-500/20 p-12 md:p-24 text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-600/5 to-transparent" />
          <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Pronto para profissionalizar sua carreira?</p>
            <h2 className="text-xl sm:text-4xl md:text-7xl font-black tracking-tighter leading-[1.0] md:leading-[0.95]">
              Profissionalize suas parcerias e feche acordos reais<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Mais previsibilidade, zero calotes e recebimento garantido</span>
            </h2>
            <p className="text-zinc-200 text-base md:text-lg max-w-3xl mx-auto">
               Crie sua conta em segundos e junte-se ao ecossistema que está transformando a influência local. Profissionalize sua rotina com inteligência artificial, garanta recebimentos sem atritos e entregue resultados reais de vendas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/signup?type=influencer" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-2xl shadow-purple-600/30 hover:scale-[1.03] active:scale-95">
                Criar conta grátis <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/login" className="inline-flex items-center justify-center border border-white/10 hover:bg-white/5 text-white px-12 py-5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all">
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 py-14 px-6 lg:px-16 bg-[#050508]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo size="sm" href="/" variant="light" />
            <p className="text-zinc-400 text-[11px]">© 2026 InfluNext. Todos os direitos reservados.</p>
          </div>
          <div className="flex gap-8 text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
            <Link href="/auth/login" className="hover:text-purple-400 transition-colors">Entrar</Link>
            <Link href="/auth/signup" className="hover:text-purple-400 transition-colors">Cadastrar</Link>
            <Link href="/dashboard/marketplace" className="hover:text-purple-400 transition-colors">Marketplace</Link>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/5 bg-white/[0.02] text-[9px] font-black text-zinc-500 tracking-wider">
            🛡️ ESCROW SEGURO · IA BRASILEIRA · FEITO NO BRASIL
          </div>
        </div>
      </footer>
    </div>
  );
}

const CONVERSATION_STEPS = [
  {
    sender: 'ai' as const,
    text: 'Olá, Lucas! Analisei seus contratos ativos no painel. Temos **R$ 3.500,00** garantidos em Escrow aguardando a entrega do seu Reels para a Loreal Brasil.',
    delayBeforeTyping: 1000,
    typingDuration: 2000,
  },
  {
    sender: 'user' as const,
    text: 'Sensacional! Qual é a sugestão de gancho viral para esse vídeo?',
    delayBeforeTyping: 1500,
    typingDuration: 1000,
  },
  {
    sender: 'ai' as const,
    text: 'Como sua conta é focada em conteúdo autêntico de moda, recomendo usar este gancho nos primeiros 3 segundos: \n\n"3 erros fatais que te fazem gastar o dobro com maquiagem..." \n\nIsso gera quebra de padrão imediata e retém o público local.',
    delayBeforeTyping: 1500,
    typingDuration: 3000,
  },
  {
    sender: 'user' as const,
    text: 'Perfeito, vou gravar agora mesmo!',
    delayBeforeTyping: 1500,
    typingDuration: 1000,
  }
];

function InteractiveChatPreview() {
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingSender, setTypingSender] = useState<'ai' | 'user'>('ai');

  useEffect(() => {
    let currentStep = 0;
    let timeoutId: NodeJS.Timeout;

    const runConversation = () => {
      if (currentStep >= CONVERSATION_STEPS.length) {
        // Reset after a pause
        timeoutId = setTimeout(() => {
          setMessages([]);
          currentStep = 0;
          runConversation();
        }, 5000);
        return;
      }

      const step = CONVERSATION_STEPS[currentStep];

      // Delay before typing starts
      timeoutId = setTimeout(() => {
        setIsTyping(true);
        setTypingSender(step.sender);

        // Typing duration
        timeoutId = setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            sender: step.sender,
            text: step.text,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }]);
          currentStep++;
          runConversation();
        }, step.typingDuration);

      }, step.delayBeforeTyping);
    };

    runConversation();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="border border-white/10 rounded-[2rem] bg-black/40 overflow-hidden shadow-2xl relative shadow-pink-900/5 max-w-2xl mx-auto backdrop-blur-xl">
      {/* Top Bar / Header */}
      <div className="h-14 border-b border-white/5 px-6 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Vincenzo // Mentor Virtual</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-purple-500/10 text-purple-400 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Modo Estratégico</span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="p-6 min-h-[350px] max-h-[450px] overflow-y-auto space-y-4 flex flex-col justify-end">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.sender === 'ai' ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Brain className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-wider">Vincenzo</span>
                </>
              ) : (
                <>
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Lucas</span>
                  <div className="w-4 h-4 rounded-full bg-zinc-850 flex items-center justify-center border border-zinc-700">
                    <User className="w-2.5 h-2.5 text-zinc-400" />
                  </div>
                </>
              )}
            </div>
            <div
              className={`p-4 rounded-[1.5rem] text-xs font-bold leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none'
                  : 'bg-white/5 border border-white/10 text-zinc-100 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[8px] text-zinc-500 font-bold mt-1 uppercase tracking-wider">{msg.time}</span>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className={`flex flex-col max-w-[80%] ${typingSender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'} animate-in fade-in duration-300`}>
            <div className="flex items-center gap-2 mb-1">
              {typingSender === 'ai' ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                    <Brain className="w-2.5 h-2.5 text-purple-400" />
                  </div>
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-wider">Vincenzo digitando...</span>
                </>
              ) : (
                <>
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">Lucas digitando...</span>
                  <div className="w-4 h-4 rounded-full bg-zinc-850 flex items-center justify-center border border-zinc-700">
                    <User className="w-2.5 h-2.5 text-zinc-400" />
                  </div>
                </>
              )}
            </div>
            <div className="p-3 px-5 rounded-[1.2rem] bg-white/5 border border-white/10 flex items-center gap-1.5 h-10">
              <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar mockup */}
      <div className="p-4 bg-zinc-950/40 border-t border-white/5 flex gap-3">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl h-12 px-4 flex items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          {isTyping && typingSender === 'user' ? 'Digitando resposta...' : 'Mensagem protegida criptografada...'}
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
          <MessageSquare className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
