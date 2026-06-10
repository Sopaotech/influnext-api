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
  TrendingUp, 
  Target, 
  Rocket, 
  Star, 
  ChevronDown, 
  Search, 
  User,
  Lock,
  Eye,
  DollarSign,
  Layout,
  MessageSquare,
  Calendar
} from 'lucide-react';

const STATS = [
  { value: '+3.200', label: 'Criadores no Interior & Capitais' },
  { value: '100% Protegido', label: 'Pagamentos Garantidos via Escrow' },
  { value: 'Métricas Reais', label: 'Validadas via APIs das Redes' },
];

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
        </div>
        
        {/* Right controls */}
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-zinc-200 hover:text-white transition-colors px-2.5 py-1.5">
            Entrar
          </Link>
          
          <Link href="/auth/signup?type=influencer" className="text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-violet-600/20">
            Cadastrar
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative w-full min-h-[95vh] flex flex-col items-center justify-center text-center px-6 pt-12 pb-24 overflow-hidden">
        {/* bg glows */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-[20%] w-[500px] h-[400px] rounded-full bg-pink-600/8 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-5xl">
          <Logo size="xxl" href={null} variant="light" />
          <h1 className="text-xl sm:text-4xl md:text-7xl font-black tracking-tighter leading-[1.0] md:leading-[0.95] mt-8 mb-6 max-w-4xl">
            Para influenciadores que geram vendas<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-pink-400">Para marcas que buscam retorno</span>
          </h1>
          
          <p className="text-zinc-200 text-base md:text-lg max-w-3xl leading-relaxed mb-10">
            O fim das permutas sem valor e dos contratos baseados em promessas. A InfluNext é o primeiro ecossistema completo que profissionaliza e gerencia a rotina de criadores de conteúdo para atrair e fechar publicidades reais, enquanto fornece às marcas a segurança de contratar com pagamento via Escrow protegido e retorno real garantido por nossa Inteligência Artificial.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-16 mt-20 pt-10 border-t border-white/5 w-full max-w-4xl">
            {STATS.map((s, i) => (
              <div key={i} className="flex flex-col items-center md:items-start gap-1">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">{s.value}</span>
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOCKUP PREVIEW - Finance */}
      <section id="preview" className="relative w-full max-w-6xl mx-auto px-6 py-20">
         <div className="text-center mb-12">
            <p className="text-violet-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">✦ Controle Total</p>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95]">Campanhas, contratos e pagamentos<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Tudo em uma única tela</span></h2>
            <p className="text-zinc-300 text-xs mt-4 max-w-xl mx-auto leading-relaxed">
               Acompanhe suas parcerias do início ao fim, controle prazos de entrega e garanta o recebimento seguro via Escrow sem burocracia.
            </p>
         </div>

         {/* Dashboard Window Chrome Mockup - Finance */}
         <div className="border border-white/10 rounded-[2rem] bg-black/40 overflow-hidden shadow-2xl relative shadow-violet-900/10">
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
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95]">O seu Mentor de IA e Rotina diária<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Para você postar e faturar sem parar</span></h2>
            <p className="text-zinc-300 text-xs mt-4 max-w-xl mx-auto leading-relaxed">
               Receba orientações estratégicas de engajamento do seu Mentor de IA e mantenha a consistência de publicações com um calendário de hábitos integrado.
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
                           <span className="font-bold text-white">"3 Looks que parecem caros..."</span>
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
                           <span className="text-[8px] bg-yellow-500/10 text-yellow-500 font-bold px-2 py-0.5 rounded">Agendado</span>
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

      {/* DIFERENCIAIS / INOVAÇÃO (Para Criadores e Marcas) */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-10">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-violet-500/20 transition-all duration-300 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <ShieldCheck className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-black text-white">Garantia Escrow (PIX)</h3>
               <p className="text-zinc-300 text-xs leading-relaxed">
                  O dinheiro da campanha é depositado pela marca antes de você começar a gravar. Quando o post for publicado e aprovado pelo app, seu cachê cai no PIX. Sem calote, sem permuta barata.
               </p>
            </div>

            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-violet-500/20 transition-all duration-300 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Brain className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-black text-white">Mentor de IA Local</h3>
               <p className="text-zinc-300 text-xs leading-relaxed">
                  Chega de posts aleatórios. A nossa inteligência artificial mapeia as tendências, os melhores horários e ganchos virais específicos para a sua geolocalização e nicho.
               </p>
            </div>

            <div className="p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-violet-500/20 transition-all duration-300 space-y-4">
               <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <Calendar className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-black text-white">Radar de Eventos Físicos</h3>
               <p className="text-zinc-300 text-xs leading-relaxed">
                  Convidado para um evento presencial? Registre o convite e nossa IA cria um roteiro completo de cobertura em 3 fases (Pré, Durante e Pós) para maximizar o engajamento e provar seu ROI.
               </p>
            </div>
          </div>
      </section>

      {/* MODELO DE MONETIZAÇÃO */}
      <section id="monetizacao" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-20 relative">
         {/* Background subtle glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

         <div className="text-center mb-16 relative z-10">
            <p className="text-violet-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">✦ Modelo de Negócios</p>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-[1.05] md:leading-[0.95]">
               Sustentabilidade & Escala<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Como nosso ecossistema gera valor</span>
            </h2>
            <p className="text-zinc-300 text-xs mt-4 max-w-xl mx-auto leading-relaxed">
               Estrutura diversificada de receita projetada para acelerar a monetização e viabilizar a estabilidade financeira de criadores e marcas.
            </p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {/* Card 1: Taxa de Sucesso */}
            <div className="relative bg-[#0b0b12] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all duration-500 overflow-hidden group">
               {/* Inner glow on hover */}
               <div className="absolute -inset-px bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2.5rem]" />
               
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                     <DollarSign className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                     Alto Potencial
                  </span>
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors duration-300">Taxa de Sucesso</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-bold">
                     % sobre o valor do deal fechado e processado com segurança pela plataforma.
                  </p>
               </div>
            </div>

            {/* Card 2: Destaque Pago */}
            <div className="relative bg-[#0b0b12] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:bg-white/[0.03] hover:border-amber-500/30 transition-all duration-500 overflow-hidden group">
               {/* Inner glow on hover */}
               <div className="absolute -inset-px bg-gradient-to-b from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2.5rem]" />
               
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-500">
                     <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                     Rápido de Implementar
                  </span>
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors duration-300">Destaque Pago</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-bold">
                     Marcas e criadores pagam taxas avulsas para aparecer no topo dos matches e buscas.
                  </p>
               </div>
            </div>

            {/* Card 3: Relatório Avulso */}
            <div className="relative bg-[#0b0b12] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:bg-white/[0.03] hover:border-cyan-500/30 transition-all duration-500 overflow-hidden group">
               {/* Inner glow on hover */}
               <div className="absolute -inset-px bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2.5rem]" />
               
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform duration-500">
                     <BarChart3 className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                     Complementar
                  </span>
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors duration-300">Relatório Avulso</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-bold">
                     Venda unitária e sob demanda de análises profundas de perfil ou relatórios de campanhas.
                  </p>
               </div>
            </div>

            {/* Card 4: B2B Enterprise */}
            <div className="relative bg-[#0b0b12] border border-white/5 rounded-[2.5rem] p-8 space-y-6 hover:bg-white/[0.03] hover:border-violet-500/30 transition-all duration-500 overflow-hidden group">
               {/* Inner glow on hover */}
               <div className="absolute -inset-px bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2.5rem]" />
               
               <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform duration-500">
                     <Target className="w-6 h-6" />
                  </div>
                  <span className="text-[8px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                     Longo Prazo
                  </span>
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-lg font-black text-white group-hover:text-violet-400 transition-colors duration-300">B2B Enterprise</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-bold">
                     Contrato anual recorrente para grandes marcas corporativas com elevado volume de campanhas.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* O PROBLEMA (Foco na dor do influenciador local e desintermediação) */}
      <section id="problema" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-20">
        <div className="border border-red-500/10 bg-red-500/5 rounded-[3rem] p-8 md:p-14">
          <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">⚠ A dura realidade que ninguém te conta</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-10 leading-tight">
            Se você está no interior ou é micro-influenciador,<br />
            <span className="text-red-400">você é explorado.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Micro-influenciadores locais com 5.000 seguidores hiper-engajados trabalhando por "permuta de lanche" enquanto marcas faturam em cima do seu alcance.',
              'Contratos fechados via WhatsApp que viram calote. Sem garantia jurídica, você Houston, produz, posta e torce para a marca pagar.',
              'Marcas locais que têm medo de contratar publicidade porque não confiam se o influenciador realmente vai postar nas datas corretas.',
              'Ausência completa de relatórios profissionais: sem saber ROI ou retenção, você não consegue cobrar o valor justo pelo seu trabalho.',
            ].map((pain, i) => (
              <div key={i} className="flex items-start gap-4 p-6 bg-white/[0.01] border border-red-500/10 rounded-2xl">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-100 font-medium leading-relaxed">{pain}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-red-500/10 text-center">
             <p className="text-zinc-200 text-sm">
                A InfluNext profissionaliza essa relação. Conectamos criadores locais a marcas locais sob um ecossistema de **segurança contratual mútua**.
             </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full max-w-4xl mx-auto px-6 lg:px-16 py-20">
        <div className="text-center mb-16">
          <p className="text-violet-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Dúvidas</p>
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
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-violet-900/80 via-[#0a0a1a] to-pink-900/40 border border-violet-500/20 p-12 md:p-24 text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-violet-600/5 to-transparent" />
          <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
            <p className="text-violet-400 text-[10px] font-black uppercase tracking-[0.3em]">Pronto para profissionalizar sua carreira?</p>
            <h2 className="text-xl sm:text-4xl md:text-7xl font-black tracking-tighter leading-[1.0] md:leading-[0.95]">
              Transforme sua influência em um negócio<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Mais contratos, zero estresse e cachê garantido</span>
            </h2>
            <p className="text-zinc-200 text-base md:text-lg max-w-3xl mx-auto">
              Crie sua conta em segundos e junte-se ao ecossistema que está transformando a influência local. Profissionalize sua rotina com inteligência artificial, garanta recebimentos sem atritos e entregue resultados reais de vendas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/signup?type=influencer" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-2xl shadow-violet-600/30 hover:scale-[1.03] active:scale-95">
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
            <Link href="/auth/login" className="hover:text-violet-400 transition-colors">Entrar</Link>
            <Link href="/auth/signup" className="hover:text-violet-400 transition-colors">Cadastrar</Link>
            <Link href="/dashboard/marketplace" className="hover:text-violet-400 transition-colors">Marketplace</Link>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/5 bg-white/[0.02] text-[9px] font-black text-zinc-500 tracking-wider">
            🛡️ ESCROW SEGURO · IA BRASILEIRA · FEITO NO BRASIL
          </div>
        </div>
      </footer>
    </div>
  );
}
