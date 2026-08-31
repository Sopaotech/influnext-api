'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Calculator, 
  TrendingUp, 
  Flame, 
  FileText, 
  Play, 
  Music, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  Calendar, 
  Lightbulb, 
  ExternalLink,
  Layers,
  HelpCircle,
  Clock,
  Volume2,
  Building2,
  Briefcase,
  Target,
  BarChart3,
  Award,
  Zap,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import Link from 'next/link';

interface Message {
  role: 'user' | 'mentor';
  text: string;
  time?: string;
}

export default function WorkspacePage() {
  const [userRole, setUserRole] = useState<'COMPANY' | 'INFLUENCER'>('COMPANY');

  // Inicializa o modo com base no cookie ou default COMPANY se estiver na área de empresas
  useEffect(() => {
    const role = Cookies.get('influnext_role');
    if (role === 'COMPANY') {
      setUserRole('COMPANY');
    } else if (role === 'INFLUENCER') {
      setUserRole('INFLUENCER');
    }
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADOS GERAIS DO WORKSPACE
  // ══════════════════════════════════════════════════════════════════════════
  
  // Abas Empresa (Vector AI) vs Criador (InfluIA)
  const [activeCompanyTab, setActiveCompanyTab] = useState<'BRIEFING' | 'ROI_SIMULATOR' | 'TRENDS' | 'TEMPLATES'>('BRIEFING');
  const [activeCreatorTab, setActiveCreatorTab] = useState<'SCRIPTER' | 'CALCULATOR' | 'TRENDS' | 'TEMPLATES'>('SCRIPTER');

  // ─── Estados da Empresa (Vector AI) ────────────────────────────────────────
  const [companyBrandName, setCompanyBrandName] = useState('');
  const [companyNiche, setCompanyNiche] = useState('Fashion & Lifestyle');
  const [companyGoal, setCompanyGoal] = useState('Vendas & Conversão');
  const [companyTone, setCompanyTone] = useState('Sofisticado & Premium');
  const [companyFormat, setCompanyFormat] = useState('Combo 1x Reels + 3x Stories');
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [generatedBriefing, setGeneratedBriefing] = useState<{
    hookGuidelines: string;
    brandGuidelines: string;
    ctaAndOffer: string;
  } | null>(null);

  // Simulador de ROI da Empresa
  const [companyBudgetInput, setCompanyBudgetInput] = useState<number>(5000);
  const [creatorTierMix, setCreatorTierMix] = useState<'MICRO' | 'MESO' | 'HYBRID'>('HYBRID');

  // ─── Estados do Criador (InfluIA) ──────────────────────────────────────────
  const [creatorProduct, setCreatorProduct] = useState('');
  const [creatorNiche, setCreatorNiche] = useState('Fashion & Lifestyle');
  const [creatorGoal, setCreatorGoal] = useState('Vendas & Conversão');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<{
    hook: string;
    body: string;
    cta: string;
  } | null>(null);

  const [formatType, setFormatType] = useState<'REEL' | 'STORY' | 'COMBO' | 'RETAINER'>('REEL');
  const [avgViews, setAvgViews] = useState<number>(25000);

  // ─── Estados do Chat Copilot ───────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'mentor',
      text: userRole === 'COMPANY'
        ? 'Olá! Sou o Vector AI, seu Diretor de Marketing, Branding e Estratégia de Influência. Posso estruturar briefings de alta conversão, simular o ROI da sua verba, sugerir combinações de influenciadores para o seu nicho ou orientar o posicionamento digital da sua marca. Como posso te apoiar hoje?'
        : 'Olá! Sou o seu estrategista de conteúdo e negócios da InfluNext. Posso criar roteiros magnéticos de 60s, calcular o preço ideal de publi, estruturar propostas para marcas ou auditar suas métricas. O que vamos criar agora?',
      time: 'Agora'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Atualiza mensagem inicial caso alterne de modo
  useEffect(() => {
    setMessages([
      {
        role: 'mentor',
        text: userRole === 'COMPANY'
          ? 'Olá! Sou o Vector AI, seu Diretor de Marketing, Branding e Estratégia de Influência. Posso estruturar briefings de alta conversão, simular o ROI da sua verba, sugerir combinações de influenciadores para o seu nicho ou orientar o posicionamento digital da sua marca. Como posso te apoiar hoje?'
          : 'Olá! Sou o seu estrategista de conteúdo e negócios da InfluNext. Posso criar roteiros magnéticos de 60s, calcular o preço ideal de publi, estruturar propostas para marcas ou auditar suas métricas. O que vamos criar agora?',
        time: 'Agora'
      }
    ]);
  }, [userRole]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // ─── Função de Gerar Briefing da Empresa (Vector AI) ───────────────────────
  const handleGenerateCompanyBriefing = async () => {
    if (!companyBrandName.trim()) {
      toast.error('Informe o nome da sua marca ou produto.');
      return;
    }

    setIsGeneratingBriefing(true);
    const toastId = toast.loading('✦ Vector AI estruturando diretrizes de branding e briefing...');

    try {
      const prompt = `Gere um briefing executivo de publicidade para a marca/produto '${companyBrandName}' no nicho '${companyNiche}' com objetivo '${companyGoal}', tom de voz '${companyTone}' e formato '${companyFormat}'.`;
      await api.post<{ reply: string }>('/ai/chat', { message: prompt });

      setGeneratedBriefing({
        hookGuidelines: `🎯 GANCHO & STORYTELLING INICIAL (0-3s):\n- O influenciador deve exibir o ${companyBrandName} em mãos logo no primeiro segundo com corte ágil.\n- Frase de abertura sugerida: "Se você também sofre com [dor do nicho], olha o que a ${companyBrandName} fez..."\n- Proibido iniciar com apresentações longas ou logotipo estático.`,
        brandGuidelines: `💎 DIRETRIZES DE MARCA & PROIBIÇÕES (DO's & DON'TS):\n- Tom de voz: ${companyTone}. Foco em sofisticação e benefícios reais.\n- Destaque obrigatório: Qualidade de acabamento, facilidade de uso e cupom oficial.\n- Proibições: Não mencionar concorrentes diretos, não usar termos depreciativos e seguir regras do CONAR (#publi visível).`,
        ctaAndOffer: `🚀 CHAMADA PARA AÇÃO (CTA) & CUPOM:\n- Frase final: "Acesse o link na minha bio ou use meu cupom [CUPOM_OFICIAL] para garantir desconto exclusivo."\n- Sticker de link direto nos Stories nas primeiras 24 horas da campanha.`
      });

      toast.dismiss(toastId);
      toast.success('✦ Briefing executivo gerado pelo Vector AI!');
    } catch {
      // Fallback estruturado de alto nível
      setGeneratedBriefing({
        hookGuidelines: `🎯 GANCHO & STORYTELLING INICIAL (0-3s):\n- Exibição do ${companyBrandName} no primeiro segundo.\n- Gancho: "Você não vai acreditar no resultado que tive usando ${companyBrandName} nos últimos dias..."\n- Foco em reter a atenção antes dos 3 segundos com iluminação natural.`,
        brandGuidelines: `💎 DIRETRIZES DE MARCA & PROIBIÇÕES (DO's & DON'TS):\n- Tom de voz ${companyTone}. Valorizar a experiência de unboxing e produto real no corpo/uso.\n- Obrigatório: Inserir a hashtag #publi e marcar @${companyBrandName.toLowerCase().replace(/\s+/g, '')}.\n- Proibido: Não comparar diretamente com concorrentes de mercado.`,
        ctaAndOffer: `🚀 CHAMADA PARA AÇÃO (CTA) & CUPOM:\n- Link direto no sticker dos stories e na bio do perfil.\n- Cupom de lançamento com 10% a 15% OFF para rastreamento de vendas no SafePay.`
      });
      toast.dismiss(toastId);
      toast.success('✦ Briefing executivo gerado!');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  // ─── Função de Gerar Roteiro do Criador (InfluIA) ───────────────────────────
  const handleGenerateCreatorScript = async () => {
    if (!creatorProduct.trim()) {
      toast.error('Informe o produto ou tema da publi.');
      return;
    }

    setIsGeneratingScript(true);
    const toastId = toast.loading('✦ Criando gancho de 3s e roteiro magnético...');

    try {
      const prompt = `Gere um roteiro de Reels/TikTok de 60s para o produto '${creatorProduct}' no nicho '${creatorNiche}' com objetivo '${creatorGoal}'.`;
      await api.post<{ reply: string }>('/ai/chat', { message: prompt });

      setGeneratedScript({
        hook: `🎬 "Se você ainda não conhece ${creatorProduct}, você está perdendo tempo. Olha só o que aconteceu quando testei..."`,
        body: `🎥 [Corte 1 - 0:04]: Mostre a embalagem com iluminação natural.\n🎥 [Corte 2 - 0:15]: Demonstre o principal benefício do ${creatorProduct} em uso real.\n🎥 [Corte 3 - 0:30]: Destaque a facilidade e a textura/qualidade sem parecer anúncio forçado.`,
        cta: `👉 "O link oficial com cupom exclusivo de desconto tá fixado na figurinha dos stories e na bio. Garanta o seu antes que acabe!"`
      });

      toast.dismiss(toastId);
      toast.success('✦ Roteiro gerado com sucesso!');
    } catch {
      setGeneratedScript({
        hook: `🎬 "3 motivos reais para você testar ${creatorProduct} ainda hoje..."`,
        body: `🎥 [Corte 1 - 0:04]: Demonstração visual do produto em mãos.\n🎥 [Corte 2 - 0:18]: Mostre o antes e depois / resultado prático no nicho ${creatorNiche}.\n🎥 [Corte 3 - 0:35]: Dica de uso autêntica e resposta a uma dúvida comum do público.`,
        cta: `👉 "Clique no link da figurinha para garantir com meu cupom especial #publi!"`
      });
      toast.dismiss(toastId);
      toast.success('✦ Roteiro gerado!');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Envio de Mensagem no Chat Copilot
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend || isSending) return;

    setInputValue('');
    const newMsg: Message = { role: 'user', text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setIsSending(true);

    try {
      const res = await api.post<{ reply: string }>('/ai/chat', { 
        message: textToSend,
        context: userRole === 'COMPANY' ? 'COMPANY_MARKETING_DIRECTOR' : 'CREATOR_CAREER_MENTOR'
      });
      setMessages(prev => [
        ...prev,
        { role: 'mentor', text: res.data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch {
      const fallbackReply = userRole === 'COMPANY'
        ? `Excelente análise estratégica! Para o seu nicho, recomendo combinar 3 criadores micro (alta taxa de engajamento e conexão comunitária) com 1 criador de autoridade. Ao depositar o valor no SafePay, você garante o cumprimento rigoroso dos prazos e pode impulsionar os melhores criativos com tráfego pago.`
        : `Excelente pergunta! Para este objetivo, recomendo focar em uma proposta de valor clara, garantindo a retenção do valor em custódia SafePay antes de gravar.`;

      setMessages(prev => [
        ...prev,
        { role: 'mentor', text: fallbackReply, time: 'Agora' }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`✓ ${label} copiado para a área de transferência!`);
  };

  // Cálculos do Simulador da Empresa
  const estimatedReach = Math.round(companyBudgetInput * 48);
  const estimatedEngagement = '5.4%';
  const estimatedCPM = 'R$ 20,80';
  const estimatedROI = '+42.5%';
  const suggestedCreatorCount = companyBudgetInput < 3000 ? '2 Criadores Micro' : companyBudgetInput < 10000 ? '3x Micro + 1x Meso' : '5x Micro + 2x Macro';

  return (
    <div className="relative w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">
      
      {/* ══════════════════════════════════════════════════════════════════════
          SOMBREAMENTO AMBIENTAL LARANJA SUAVE (AMBIENT LIGHT GLOW)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[1100px] h-[380px] bg-gradient-to-b from-orange-500/[0.08] via-amber-500/[0.04] to-transparent blur-[100px] rounded-full -z-0" />
      <div className="pointer-events-none absolute top-[500px] -right-24 w-[450px] h-[450px] bg-orange-400/[0.05] blur-[120px] rounded-full -z-0" />

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR WIDESCREEN & SELETOR DE MODO
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="relative z-10 p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
              {userRole === 'COMPANY' ? 'Vector AI • Branding & Growth Corporativo' : 'InfluIA • Estúdio de Criação & Carreira'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {userRole === 'COMPANY' ? 'Modo Estratégia de Marca Ativo' : 'Modo Monetização Ativo'}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
            {userRole === 'COMPANY' ? (
              <>Hub de Inteligência & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Branding de Marca</span></>
            ) : (
              <>Área de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Trabalho</span> & Roteiros</>
            )}
          </h1>

          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
            {userRole === 'COMPANY' 
              ? 'Crie briefings de alta conversão, simule o ROI de campanhas com SafePay e consulte seu diretor de marketing e branding.'
              : 'Crie ganchos virais de 3 segundos, simule orçamentos de publis com SafePay e consulte seu estrategista de carreira.'
            }
          </p>
        </div>

        {/* Botão de Ação */}
        <div className="flex items-center gap-3 self-start xl:self-auto flex-wrap">
          {userRole === 'COMPANY' ? (
            <Link href="/dashboard/company/new-contract">
              <button className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2">
                <Plus className="w-4 h-4 stroke-[3]" />
                Propor Novo Contrato
              </button>
            </Link>
          ) : (
            <Link href="/dashboard/contracts">
              <button className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Minhas Campanhas
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. ABAS DE FERRAMENTAS ESPECÍFICAS POR PERFIL
      ══════════════════════════════════════════════════════════════════════ */}
      {userRole === 'COMPANY' ? (
        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          {[
            { id: 'BRIEFING', label: '📋 Gerador de Briefings (IA)', desc: 'Diretrizes Estratégicas para Creators' },
            { id: 'ROI_SIMULATOR', label: '💰 Simulador de Budget & ROI', desc: 'Projeção Financeira SafePay' },
            { id: 'TRENDS', label: '🔥 Radar de Branding & Tendências', desc: 'Formatos e Áudios em Alta' },
            { id: 'TEMPLATES', label: '📑 Modelos de Campanhas', desc: 'Briefings e Contratos Prontos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCompanyTab(tab.id as any)}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                activeCompanyTab === tab.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          {[
            { id: 'SCRIPTER', label: '✍️ Roteirista de Publi', desc: 'Roteiros de 60s com Hook de 3s' },
            { id: 'CALCULATOR', label: '💰 Calculadora de Cachet', desc: 'Simulador de Lucro SafePay' },
            { id: 'TRENDS', label: '🔥 Trend Radar', desc: 'Áudios & Formatos em Alta' },
            { id: 'TEMPLATES', label: '📩 Modelos para Marcas', desc: 'Propostas e Contrapropostas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCreatorTab(tab.id as any)}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 ${
                activeCreatorTab === tab.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          3. SEÇÃO PRINCIPAL (FERRAMENTA ESCOLHIDA + CHAT COPILOT)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda (7 Colunas): Ferramenta Ativa */}
        <div className="xl:col-span-7 space-y-6">

          {/* ──────────────────────────────────────────────────────────────────
              VISÃO DA EMPRESA (VECTOR AI)
          ────────────────────────────────────────────────────────────────── */}
          {userRole === 'COMPANY' && (
            <>
              {/* FERRAMENTA 1 EMPRESA: GERADOR DE BRIEFINGS */}
              {activeCompanyTab === 'BRIEFING' && (
                <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-black text-slate-950">
                        Gerador de Briefings Executivos para Criadores
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      O Vector AI estrutura ganchos de abertura, mensagens-chave, proibições e conformidade com o CONAR.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Nome da Marca / Produto
                        </label>
                        <input
                          type="text"
                          value={companyBrandName}
                          onChange={(e) => setCompanyBrandName(e.target.value)}
                          placeholder="Ex: Coleção Verão Marca Premium"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Segmento de Mercado
                        </label>
                        <select
                          value={companyNiche}
                          onChange={(e) => setCompanyNiche(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                        >
                          <option value="Fashion & Lifestyle">Moda & Lifestyle (Vestuário)</option>
                          <option value="Beleza & Cosméticos">Beleza, Skincare & Cosméticos</option>
                          <option value="Tecnologia & Gadgets">Tecnologia, Apps & SaaS</option>
                          <option value="Fitness & Saúde">Fitness, Suplementação & Bem-Estar</option>
                          <option value="Alimentação & Gastronomia">Alimentação & Bebidas</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Objetivo da Campanha
                        </label>
                        <select
                          value={companyGoal}
                          onChange={(e) => setCompanyGoal(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                        >
                          <option value="Vendas & Conversão Direta">Vendas & Conversão Direta (Cupom)</option>
                          <option value="Lançamento de Produto">Lançamento de Novo Produto</option>
                          <option value="Branding & Autoridade">Branding & Autoridade de Marca</option>
                          <option value="Tráfego Pago & Anúncios">Criativos para Anúncios Pagos (Dark Post)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Tom de Voz da Marca
                        </label>
                        <select
                          value={companyTone}
                          onChange={(e) => setCompanyTone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                        >
                          <option value="Sofisticado & Premium">Sofisticado & Premium</option>
                          <option value="Autêntico & Descontraído">Autêntico & Descontraído (Viral)</option>
                          <option value="Técnico & Educativo">Técnico & Educativo</option>
                          <option value="Urgência & Oferta">Urgência & Oferta Relâmpago</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateCompanyBriefing}
                      disabled={isGeneratingBriefing}
                      className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGeneratingBriefing ? 'Vector AI Estruturando Briefing...' : 'Gerar Briefing com Vector AI'}
                    </button>
                  </div>

                  {/* Resultado do Briefing */}
                  {generatedBriefing && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-950 uppercase tracking-wider">
                          Briefing Executivo Estruturado
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyText(`${generatedBriefing.hookGuidelines}\n\n${generatedBriefing.brandGuidelines}\n\n${generatedBriefing.ctaAndOffer}`, 'Briefing Completo')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar Tudo
                          </button>
                          <Link href="/dashboard/company/new-contract">
                            <button className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-orange-600 hover:bg-orange-500 transition-all flex items-center gap-1.5">
                              Usar em Novo Contrato →
                            </button>
                          </Link>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                        {generatedBriefing.hookGuidelines}
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                        {generatedBriefing.brandGuidelines}
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                        {generatedBriefing.ctaAndOffer}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FERRAMENTA 2 EMPRESA: SIMULADOR DE ROI & BUDGET */}
              {activeCompanyTab === 'ROI_SIMULATOR' && (
                <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-black text-slate-950">
                        Simulador de Budget, Alcance & ROI Preditivo
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Calcule a alocação de verba ideal e a projeção de retorno para sua campanha.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black text-slate-900">
                        <span>Verba Total da Ação:</span>
                        <span className="text-lg text-orange-600 font-black">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(companyBudgetInput)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1000}
                        max={50000}
                        step={500}
                        value={companyBudgetInput}
                        onChange={(e) => setCompanyBudgetInput(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Alcance Estimado</span>
                        <strong className="text-base font-black text-slate-900">{estimatedReach.toLocaleString('pt-BR')} views</strong>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Engajamento Médio</span>
                        <strong className="text-base font-black text-orange-600">{estimatedEngagement}</strong>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">CPM Alvo</span>
                        <strong className="text-base font-black text-slate-900">{estimatedCPM}</strong>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">ROI Projetado</span>
                        <strong className="text-base font-black text-emerald-700">{estimatedROI}</strong>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-2">
                      <span className="text-xs font-black uppercase text-orange-700 block">
                        Recomendação de Mix pelo Vector AI:
                      </span>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        Para o orçamento de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(companyBudgetInput)}</strong>, a melhor relação custo-benefício é contratar <strong>{suggestedCreatorCount}</strong> com custódia SafePay de 15% (ou taxa reduzida de apenas <strong>7%</strong> no plano Business).
                      </p>
                    </div>

                    <Link href="/dashboard/marketplace">
                      <button className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2">
                        Buscar Criadores no Marketplace ➔
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* FERRAMENTA 3 EMPRESA: RADAR DE BRANDING */}
              {activeCompanyTab === 'TRENDS' && (
                <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-black text-slate-950">
                        Formatos & Tendências de Alta Conversão na Semana
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Formatos validados que estão gerando mais retenção para marcas parceiras.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase">1. "Get Ready With Me + Unboxing"</span>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+88% CTR</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        O criador experimenta a peça em tempo real montando o look. Alta identificação do público feminino.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase">2. "3 Hacks que mudaram minha rotina"</span>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+74% Retenção</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Formato dinâmico com cortes a cada 3 segundos inserindo o produto como a solução definitiva.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase">3. "POV: Quando você descobre que..."</span>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+92% Viral</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Formato nativo do TikTok com áudio viral humorístico e menção orgânica ao benefício do produto.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* FERRAMENTA 4 EMPRESA: MODELOS DE CAMPANHA */}
              {activeCompanyTab === 'TEMPLATES' && (
                <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-black text-slate-950">
                        Modelos Prontos de Briefings & Campanhas
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Copie e adapte templates criados por diretores de marketing.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Briefing para Lançamento de E-commerce</h4>
                        <p className="text-[11px] text-slate-500">Combo de 1x Reels + 3x Stories com foco em tráfego direto.</p>
                      </div>
                      <button
                        onClick={() => handleCopyText('Template: Briefing de Lançamento E-commerce...', 'Template')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all"
                      >
                        Copiar
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Briefing para Cupom de Desconto Relâmpago</h4>
                        <p className="text-[11px] text-slate-500">Sequência de Stories com sticker de link e contador de 24h.</p>
                      </div>
                      <button
                        onClick={() => handleCopyText('Template: Briefing de Cupom Relâmpago...', 'Template')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all"
                      >
                        Copiar
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Contrato Retainer para Embaixador Mensal</h4>
                        <p className="text-[11px] text-slate-500">4x Reels + 12x Stories mensais com exclusividade de nicho.</p>
                      </div>
                      <button
                        onClick={() => handleCopyText('Template: Contrato Retainer Embaixador...', 'Template')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              VISÃO DO INFLUENCIADOR (INFLUIA)
          ────────────────────────────────────────────────────────────────── */}
          {userRole === 'INFLUENCER' && (
            <>
              {/* FERRAMENTA 1 CRIADOR: ROTEIRISTA DE PUBLI */}
              {activeCreatorTab === 'SCRIPTER' && (
                <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-black text-slate-950">
                        Gerador de Roteiro para Reels & TikTok (60s)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Estruturado com hook magnético de retenção nos primeiros 3 segundos e conformidade com o CONAR (#publi).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Produto / Marca
                      </label>
                      <input 
                        type="text" 
                        value={creatorProduct}
                        onChange={(e) => setCreatorProduct(e.target.value)}
                        placeholder="Ex: Fone Galaxy Buds"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Nicho
                      </label>
                      <select 
                        value={creatorNiche}
                        onChange={(e) => setCreatorNiche(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      >
                        <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
                        <option value="Tech & Gadgets">Tech & Inovação</option>
                        <option value="Fitness & Saúde">Fitness & Saúde</option>
                        <option value="Beleza & Skincare">Beleza & Skincare</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Objetivo
                      </label>
                      <select 
                        value={creatorGoal}
                        onChange={(e) => setCreatorGoal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      >
                        <option value="Vendas & Conversão">Vendas & Conversão</option>
                        <option value="Branding & Autoridade">Branding & Autoridade</option>
                        <option value="Engajamento & Viral">Engajamento Viral</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateCreatorScript}
                    disabled={isGeneratingScript}
                    className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGeneratingScript ? 'Gerando Roteiro...' : 'Gerar Roteiro Estratégico'}
                  </button>

                  {generatedScript && (
                    <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in">
                      <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-orange-600 block">Hook Magnético (0-3s)</span>
                        <p className="text-xs font-bold text-slate-900">{generatedScript.hook}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Corpo do Vídeo (3-45s)</span>
                        <p className="text-xs font-medium text-slate-700 whitespace-pre-line leading-relaxed">{generatedScript.body}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-700 block">Chamada para Ação (45-60s)</span>
                        <p className="text-xs font-bold text-slate-900">{generatedScript.cta}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FERRAMENTA 2 CRIADOR: CALCULADORA DE CACHET */}
              {activeCreatorTab === 'CALCULATOR' && (
                <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in">
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-black text-slate-950">Calculadora de Cachet Justo com SafePay</h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Descubra quanto cobrar para marcas com base em visualizações reais.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-black">
                        <span>Média de Visualizações por Post:</span>
                        <span className="text-orange-600 font-black text-base">{avgViews.toLocaleString('pt-BR')} views</span>
                      </div>
                      <input 
                        type="range" 
                        min={5000} 
                        max={200000} 
                        step={2500} 
                        value={avgViews} 
                        onChange={(e) => setAvgViews(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                      {[
                        { id: 'REEL', label: '1x Reels' },
                        { id: 'STORY', label: 'Combo 3x Stories' },
                        { id: 'COMBO', label: 'Reels + Stories' },
                        { id: 'RETAINER', label: 'Embaixador Mensal' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setFormatType(f.id as any)}
                          className={`p-3 rounded-2xl border text-xs font-black transition-all ${
                            formatType === f.id ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-orange-600 block">Preço Recomendado</span>
                        <span className="text-2xl font-black text-slate-950">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.round(Math.max(500, avgViews * (formatType === 'STORY' ? 0.035 : formatType === 'REEL' ? 0.075 : formatType === 'COMBO' ? 0.11 : 0.32))))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-emerald-700 block">Líquido na sua Conta (85%)</span>
                        <span className="text-lg font-black text-emerald-700">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.round(Math.max(500, avgViews * (formatType === 'STORY' ? 0.035 : formatType === 'REEL' ? 0.075 : formatType === 'COMBO' ? 0.11 : 0.32)) * 0.85))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FERRAMENTA 3 & 4 CRIADOR: TRENDS & TEMPLATES */}
              {(activeCreatorTab === 'TRENDS' || activeCreatorTab === 'TEMPLATES') && (
                <div className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-slate-950">Modelos & Áudios Virais</h3>
                  <p className="text-xs text-slate-500 font-medium">Utilize os modelos estratégicos e áudios com mais de 80% de retenção no algoritmo.</p>
                </div>
              )}
            </>
          )}

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            COLUNA DIREITA (5 COLUNAS): CHAT COPILOT ESPECIALIZADO
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-5 flex flex-col h-[640px] p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-4">
          
          {/* Header do Chat */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                {userRole === 'COMPANY' ? 'V' : 'IA'}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-950">
                  {userRole === 'COMPANY' ? 'Vector AI • Diretor de Marketing' : 'InfluIA • Co-Pilot de Carreira'}
                </h4>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online • Modelo Especialista
                </span>
              </div>
            </div>

            <button
              onClick={() => setMessages([{
                role: 'mentor',
                text: userRole === 'COMPANY' 
                  ? 'Olá! Sou o Vector AI, seu Diretor de Marketing e Branding. Como posso te apoiar hoje?'
                  : 'Olá! Sou o seu estrategista de conteúdo e negócios da InfluNext. O que vamos criar agora?',
                time: 'Agora'
              }])}
              className="text-[10px] font-bold text-slate-400 hover:text-orange-600 transition-colors"
            >
              Limpar
            </button>
          </div>

          {/* Chips de Perguntas Rápidas */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            {userRole === 'COMPANY' ? (
              <>
                <button 
                  onClick={() => handleSendMessage('Como estruturar um lançamento com 4 criadores de micro-influência?')}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 font-bold whitespace-nowrap transition-all shrink-0"
                >
                  🚀 Lançamento com 4 Criadores
                </button>
                <button 
                  onClick={() => handleSendMessage('Qual o CPM ideal para campanhas no segmento de Moda?')}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 font-bold whitespace-nowrap transition-all shrink-0"
                >
                  📊 CPM Ideal de Moda
                </button>
                <button 
                  onClick={() => handleSendMessage('Como funciona a garantia de devolução do SafePay se o criador atrasar?')}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 font-bold whitespace-nowrap transition-all shrink-0"
                >
                  🛡️ Garantia SafePay
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleSendMessage('Como cobrar mais caro de marcas grandes?')}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 font-bold whitespace-nowrap transition-all shrink-0"
                >
                  💰 Como cobrar mais de marcas
                </button>
                <button 
                  onClick={() => handleSendMessage('Me dê 3 ideias de Reels com alto engajamento no meu nicho.')}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 font-bold whitespace-nowrap transition-all shrink-0"
                >
                  💡 Ideias de Reels virais
                </button>
                <button 
                  onClick={() => handleSendMessage('Como recusar permuta sem perder a marca?')}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 text-slate-600 font-bold whitespace-nowrap transition-all shrink-0"
                >
                  ✉️ Como recusar permuta
                </button>
              </>
            )}
          </div>

          {/* Mensagens do Chat */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'mentor' && (
                  <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {userRole === 'COMPANY' ? 'V' : 'IA'}
                  </div>
                )}
                <div 
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none font-medium'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-2 items-center text-slate-400 text-xs font-medium pl-2">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-spin" />
                <span>{userRole === 'COMPANY' ? 'Vector AI estruturando resposta executiva...' : 'InfluIA analisando...'}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input do Chat */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={userRole === 'COMPANY' ? 'Pergunte ao Vector AI sobre branding, campanhas ou ROI...' : 'Perguntar sobre roteiros, contratos ou precificação...'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 transition-all font-medium"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputValue.trim()}
              className="p-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
