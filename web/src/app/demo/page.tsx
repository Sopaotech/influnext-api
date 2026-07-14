"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  ShieldCheck, 
  User, 
  Building, 
  Coins, 
  ArrowRight, 
  Send,
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  MessageSquare,
  Lock,
  Wallet,
  FileCheck,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function DemoPage() {
  const { theme, setTheme } = useTheme();

  // Estados de Simulação
  const [currentStep, setCurrentStep] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [username, setUsername] = useState('demo.influencer');
  const [token, setToken] = useState<string | null>(null);

  // Dados Sincronizados do Banco de Dados
  const [dbData, setDbData] = useState<any>({
    username: 'demo.influencer',
    followers: 0,
    engagementRate: 0,
    influScore: 0,
    scoreClass: 'BRONZE',
    walletBalance: 0.00,
    activeContract: null,
    latestDeliverable: null,
    aiAnalysis: null,
    connected: false
  });

  // Chat do Mentor IA
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Olá, sócio! Sou seu Mentor de Crescimento IA. Após concluir o Passo 1 (Conexão do Instagram) e o Passo 2 (Geração de Análise), posso responder a qualquer dúvida sobre sua estratégia de conteúdo!' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Inicializar forçando tema escuro para estética Premium e realizar login automático do demo
  useEffect(() => {
    setTheme('dark');
    autoLoginDemo();
  }, []);

  const autoLoginDemo = async () => {
    try {
      // Login automático do influenciador demo para obter token para chamadas autenticadas
      const res = await api.post('/auth/login', {
        email: 'influencer@demo.influnext.com.br',
        password: 'Demo@2026!'
      });
      if (res.data.token) {
        setToken(res.data.token);
        // Configurar token no cabeçalho das próximas requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        fetchDatabaseState();
      }
    } catch (err) {
      console.error('Falha no login automático do demo:', err);
      toast.error('Erro ao conectar ao simulador. Rode o script de seed.');
    }
  };

  const fetchDatabaseState = async () => {
    try {
      const [profileRes, contractsRes] = await Promise.all([
        api.get('/dashboard/influencer'),
        api.get('/contracts')
      ]);

      const profile = profileRes.data.profile;
      const contracts = contractsRes.data;

      // Calcular saldo líquido acumulado de contratos completados
      const completedContracts = contracts.filter((c: any) => c.escrowStatus === 'COMPLETED');
      const totalEarned = completedContracts.reduce((sum: number, c: any) => sum + (c.netAmount || 0), 0);

      // Achar último contrato ativo ou em progresso
      const active = contracts.find((c: any) => c.escrowStatus !== 'CANCELED');
      const latestDeliv = active?.deliverables?.[0] || null;

      // Buscar última análise de IA
      let latestAI = null;
      try {
        const aiRes = await api.get('/ai/latest');
        latestAI = aiRes.data;
      } catch (_) {}

      setDbData({
        username: profile?.handle || 'demo.influencer',
        followers: profile?.verifiedMetrics ? JSON.parse(profile.insights || '{}').followers || 0 : 0,
        engagementRate: profile?.verifiedMetrics ? JSON.parse(profile.insights || '{}').engagementRate || 0 : 0,
        influScore: profile?.influScore || 0,
        scoreClass: profile?.scoreClass || 'BRONZE',
        walletBalance: totalEarned,
        activeContract: active || null,
        latestDeliverable: latestDeliv,
        aiAnalysis: latestAI?.analysisText ? latestAI : null,
        connected: !!profile?.verifiedMetrics
      });
    } catch (err) {
      console.error('Erro ao buscar estado do banco:', err);
    }
  };

  // Reiniciar simulação limpando dados de teste do influenciador demo
  const handleResetSimulation = async () => {
    try {
      setIsExecuting(true);
      // Rodamos o seed novamente para limpar contratos e redefinir baseline
      await api.post('/integrations/refresh-tokens-debug'); // Chamamos rota de debug para re-sync (ou reset no controller)
      toast.info('Simulação reiniciada. Limpando dados...');
      await autoLoginDemo();
      setCurrentStep(1);
      setChatHistory([
        { sender: 'ai', text: 'Olá, sócio! Sou seu Mentor de Crescimento IA. Após concluir o Passo 1 (Conexão do Instagram) e o Passo 2 (Geração de Análise), posso responder a qualquer dúvida sobre sua estratégia de conteúdo!' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Executar passo individual da simulação
  const runStep = async (stepNumber: number) => {
    setIsExecuting(true);
    try {
      const res = await api.post('/integrations/simulate/flow-step', {
        step: stepNumber,
        username: stepNumber === 1 ? username : undefined
      });

      if (res.data.success) {
        toast.success(res.data.message);
        await fetchDatabaseState();
        setCurrentStep(stepNumber + 1);

        // Se gerou análise IA, alimenta o chat
        if (stepNumber === 2 && res.data.data.analysisText) {
          setChatHistory(prev => [
            ...prev,
            { sender: 'ai', text: `Aqui está minha estratégia recomendada para você:\n\n${res.data.data.analysisText.substring(0, 300)}...\n\nPergunte-me qualquer detalhe sobre o nicho de Fashion & Lifestyle!` }
          ]);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Erro ao executar etapa da simulação.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err: any) {
      toast.error('Erro ao conversar com a IA.');
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07040d] text-white flex flex-col font-sans selection:bg-orange-600/30">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] bg-purple-900/20 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[55%] bg-blue-900/10 blur-[130px] rounded-full animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#2e2452]/50 bg-[#0d091a]/40 backdrop-blur-md px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-10 bg-orange-600 rounded-full" />
          <span className="text-xs font-black uppercase tracking-[0.4em] text-orange-400">InfluNext Neural Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleResetSimulation}
            disabled={isExecuting}
            className="px-4 py-2 border border-[#2e2452] hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reiniciar Simulador
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 relative z-10">
        
        {/* Left Column: Interactive Simulation Steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight leading-none uppercase">Simulador de Fluxo de Escrow</h1>
            <p className="text-zinc-400 text-sm font-semibold uppercase tracking-wider">Execute as etapas para demonstrar a jornada integrada da plataforma</p>
          </div>

          <div className="space-y-4">
            
            {/* STEP 1: Connect Instagram */}
            <div className={`p-6 rounded-2xl border transition-all ${
              currentStep === 1 
                ? 'bg-[#181136]/50 border-orange-500 shadow-xl shadow-orange-500/5' 
                : 'bg-[#100b24]/30 border-[#2e2452]/40 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 1 ? 'bg-orange-600' : 'bg-zinc-800'}`}>1</span>
                    <h3 className="font-black text-sm uppercase tracking-wider">Conexão Simplificada do Instagram</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    O influenciador se cadastra e conecta sua conta do Instagram apenas digitando o seu nome de usuário. O sistema extrai métricas, engajamento e publicações na hora.
                  </p>
                  
                  {currentStep === 1 && (
                    <div className="flex items-center gap-3 pt-3">
                      <div className="relative w-48">
                        <span className="absolute left-3 top-2.5 text-zinc-500 text-xs font-bold">@</span>
                        <input 
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full h-9 bg-[#110c26] border border-[#2e2452] rounded-xl pl-6 pr-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <button 
                        onClick={() => runStep(1)}
                        disabled={isExecuting}
                        className="h-9 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                      >
                        {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Conectar Perfil
                      </button>
                    </div>
                  )}
                </div>
                {dbData.connected && <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>

            {/* STEP 2: AI Strategy Guidance */}
            <div className={`p-6 rounded-2xl border transition-all ${
              currentStep === 2 
                ? 'bg-[#181136]/50 border-orange-500 shadow-xl shadow-orange-500/5' 
                : 'bg-[#100b24]/30 border-[#2e2452]/40 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 2 ? 'bg-orange-600' : 'bg-zinc-800'}`}>2</span>
                    <h3 className="font-black text-sm uppercase tracking-wider">Geração de Mentor Estratégico IA</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    A IA (Gemini 1.5 Flash) lê os dados consolidados do perfil e gera uma análise de crescimento proativa e ideias de conteúdos voltados para o nicho de mercado do criador.
                  </p>
                  
                  {currentStep === 2 && (
                    <button 
                      onClick={() => runStep(2)}
                      disabled={isExecuting}
                      className="h-9 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 pt-2"
                    >
                      {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Gerar Estratégia de IA
                    </button>
                  )}
                </div>
                {dbData.aiAnalysis && <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>

            {/* STEP 3: Brand Contract Proposal */}
            <div className={`p-6 rounded-2xl border transition-all ${
              currentStep === 3 
                ? 'bg-[#181136]/50 border-orange-500 shadow-xl shadow-orange-500/5' 
                : 'bg-[#100b24]/30 border-[#2e2452]/40 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 3 ? 'bg-orange-600' : 'bg-zinc-800'}`}>3</span>
                    <h3 className="font-black text-sm uppercase tracking-wider">Proposta de Campanha (Marca)</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    A marca vinculada `empresa@demo` cria uma proposta comercial de contrato na plataforma, enviando o briefing detalhado do casaco corta-vento Outono/Inverno.
                  </p>
                  
                  {currentStep === 3 && (
                    <button 
                      onClick={() => runStep(3)}
                      disabled={isExecuting}
                      className="h-9 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 pt-2"
                    >
                      {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Propor Contrato
                    </button>
                  )}
                </div>
                {dbData.activeContract && <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>

            {/* STEP 4: Escrow Deposit */}
            <div className={`p-6 rounded-2xl border transition-all ${
              currentStep === 4 
                ? 'bg-[#181136]/50 border-orange-500 shadow-xl shadow-orange-500/5' 
                : 'bg-[#100b24]/30 border-[#2e2452]/40 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 4 ? 'bg-orange-600' : 'bg-zinc-800'}`}>4</span>
                    <h3 className="font-black text-sm uppercase tracking-wider">Depósito e Bloqueio em Escrow</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    A marca realiza o pagamento. A plataforma retém o orçamento total de forma segura, garantindo que o criador receba e que a marca tenha a entrega auditada antes da liberação.
                  </p>
                  
                  {currentStep === 4 && (
                    <button 
                      onClick={() => runStep(4)}
                      disabled={isExecuting}
                      className="h-9 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 pt-2"
                    >
                      {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />} Confirmar Pagamento Escrow
                    </button>
                  )}
                </div>
                {dbData.activeContract?.escrowStatus === 'IN_PROGRESS' && <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>

            {/* STEP 5: Work Submission & AI Audit */}
            <div className={`p-6 rounded-2xl border transition-all ${
              currentStep === 5 
                ? 'bg-[#181136]/50 border-orange-500 shadow-xl shadow-orange-500/5' 
                : 'bg-[#100b24]/30 border-[#2e2452]/40 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 5 ? 'bg-orange-600' : 'bg-zinc-800'}`}>5</span>
                    <h3 className="font-black text-sm uppercase tracking-wider">Entrega de Link & Auditoria em Tempo Real</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    O influenciador insere o link da peça pronta. A IA auditória analisa o post de forma instantânea (checando ganchos, cópias e relevância) e o deixa sob revisão para aprovação final.
                  </p>
                  
                  {currentStep === 5 && (
                    <button 
                      onClick={() => runStep(5)}
                      disabled={isExecuting}
                      className="h-9 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 pt-2"
                    >
                      {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />} Enviar e Auditar com IA
                    </button>
                  )}
                </div>
                {dbData.activeContract?.escrowStatus === 'UNDER_REVIEW' && <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>

            {/* STEP 6: Release & Payout */}
            <div className={`p-6 rounded-2xl border transition-all ${
              currentStep === 6 
                ? 'bg-[#181136]/50 border-orange-500 shadow-xl shadow-orange-500/5' 
                : 'bg-[#100b24]/30 border-[#2e2452]/40 opacity-60'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentStep === 6 ? 'bg-orange-600' : 'bg-zinc-800'}`}>6</span>
                    <h3 className="font-black text-sm uppercase tracking-wider">Aprovação da Marca & Payout na Carteira</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                    Após validar a peça aprovada pela IA, a marca dá o aval. O saldo líquido de 85% é transferido para a Wallet do criador e a plataforma desconta a comissão de intermediação de 15%.
                  </p>
                  
                  {currentStep === 6 && (
                    <button 
                      onClick={() => runStep(6)}
                      disabled={isExecuting}
                      className="h-9 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 pt-2"
                    >
                      {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />} Liberar Pagamento Final
                    </button>
                  )}
                </div>
                {dbData.activeContract?.escrowStatus === 'COMPLETED' && <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />}
              </div>
            </div>

            {/* Simulated Workspace & IA Recommendations Preview */}
            {dbData.aiAnalysis && (
              <div className="bg-[#100b24]/60 border border-orange-500/20 rounded-[32px] p-6 space-y-6 mt-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 border-b border-[#2e2452]/40 pb-4">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">Workspace do Influenciador (Simulado por IA)</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Cronograma de Ações e Auxílios para Crescimento & Parcerias</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Column 1: Weekly Calendar Grid */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-orange-300 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Cronograma Semanal Recomendado
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { day: 'Segunda', task: '🎥 Reels: Jaqueta Corta-vento Zara', desc: 'Roteiro com gancho de 3 segundos focado no clima frio.', type: 'Reels' },
                        { day: 'Terça', task: '📸 Stories: Bastidores da Criação', desc: 'Mostrar rotina e provador sem intenção comercial de forma espontânea.', type: 'Stories' },
                        { day: 'Quarta', task: '💡 Post: Dicas de Estilo Outono', desc: 'Carrossel de fotos com dicas de looks e combinações.', type: 'Feed' },
                        { day: 'Quinta', task: '🎯 Prospecção comercial: 3 marcas locais', desc: 'Enviar pitch com dados de engajamento locais e InfluScore.', type: 'Comercial' },
                        { day: 'Sexta', task: '🎥 Reels: Review Impermeabilidade Zara', desc: 'Demonstrar na prática a qualidade do corta-vento.', type: 'Reels' },
                        { day: 'Sábado', task: '📸 Stories: Rotina Espontânea de Sábado', desc: 'Conexão e engajamento genuíno com o público local.', type: 'Stories' }
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-[#181236]/30 border border-[#2e2452]/20 rounded-xl flex items-start gap-3">
                          <div className="text-[9px] font-black text-orange-400 uppercase w-14 pt-0.5">{item.day}</div>
                          <div className="flex-1 space-y-0.5">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{item.task}</p>
                            <p className="text-[9px] text-zinc-400 leading-snug font-medium">{item.desc}</p>
                          </div>
                          <span className="text-[8px] font-black text-zinc-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded uppercase">{item.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Recommended IA Guidelines */}
                  <div className="space-y-6">
                    {/* brand support */}
                    <div className="p-5 bg-[#181236]/30 border border-[#2e2452]/20 rounded-2xl space-y-3 border-l-4 border-l-amber-500">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-400" />
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Auxílio à Empresa (Vektor AI)</h4>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-relaxed font-bold">
                        &quot;Para esta campanha com @{dbData.username}, recomendamos separar R$ 3.500 no Escrow seguro para 1 Reels. Focar a verba em influenciadores com InfluScore maior que 70 garante consistência e elimina o desperdício de caixa.&quot;
                      </p>
                    </div>

                    {/* influencer support */}
                    <div className="p-5 bg-[#181236]/30 border border-[#2e2452]/20 rounded-2xl space-y-3 border-l-4 border-l-orange-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-400" />
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Auxílio ao Criador (Vincenzo AI)</h4>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-relaxed font-bold">
                        &quot;Utilizar gancho de 3 segundos com quebra de padrão de retenção. Cobre a liberação do seu saldo lembrando que o valor de R$ {dbData.activeContract ? dbData.activeContract.netAmount : '2.975'} está totalmente protegido no Escrow da InfluNext.&quot;
                      </p>
                    </div>

                    {/* escrow explanation */}
                    <div className="p-5 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <h4 className="text-[9px] font-black uppercase tracking-widest">Garantia Ativa (Status)</h4>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed font-bold">
                        A conta de garantia (Escrow) protege ambas as partes. Se o criador não entregar a peça contratada dentro do briefing estipulado, os recursos retornam para o caixa da marca de forma segura.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Database Monitor & AI Chat */}
        <div className="space-y-6">
          
          {/* Database Monitor Stats Panel */}
          <div className="bg-[#100b24]/60 border border-[#2e2452]/50 rounded-[32px] p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 mb-1">Database Monitor</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase">Estado Real das Variáveis no Banco de Dados</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#181236]/40 border border-[#2e2452]/30 rounded-2xl text-center space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">InfluScore</span>
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-400">
                  {dbData.influScore || '---'}
                </p>
              </div>
              <div className="p-4 bg-[#181236]/40 border border-[#2e2452]/30 rounded-2xl text-center space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Score Class</span>
                <p className="text-xs font-black uppercase text-orange-300">
                  {dbData.scoreClass || '---'}
                </p>
              </div>
              <div className="p-4 bg-[#181236]/40 border border-[#2e2452]/30 rounded-2xl text-center space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Seguidores</span>
                <p className="text-xl font-black text-zinc-200">
                  {dbData.followers ? dbData.followers.toLocaleString() : '---'}
                </p>
              </div>
              <div className="p-4 bg-[#181236]/40 border border-[#2e2452]/30 rounded-2xl text-center space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Engajamento</span>
                <p className="text-xl font-black text-zinc-200">
                  {dbData.engagementRate ? `${dbData.engagementRate}%` : '---'}
                </p>
              </div>
              <div className="col-span-2 p-4 bg-[#181236]/40 border border-[#2e2452]/30 rounded-2xl text-center space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Saldo Carteira (Influencer Wallet)</span>
                <p className="text-2xl font-black text-emerald-400">
                  R$ {dbData.walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="border-t border-[#2e2452]/30 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-bold uppercase">Status Escrow:</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  dbData.activeContract?.escrowStatus === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                  dbData.activeContract?.escrowStatus === 'IN_PROGRESS' ? 'bg-orange-500/10 text-orange-400' :
                  dbData.activeContract?.escrowStatus === 'UNDER_REVIEW' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {dbData.activeContract?.escrowStatus || 'Nenhum'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-bold uppercase">Código Prova Deliverable:</span>
                <span className="text-zinc-300 font-mono text-[10px] max-w-[150px] truncate">
                  {dbData.latestDeliverable?.proofUrl || 'Aguardando envio'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Mentoring Live Chat */}
          <div className="bg-[#100b24]/60 border border-[#2e2452]/50 rounded-[32px] p-6 flex flex-col h-[380px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">AI Mentor Chat</h3>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase leading-none">Interaja com a IA de Mentoria em Tempo Real</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-black/20 rounded-2xl border border-[#2e2452]/20 text-[11px] mb-3">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    chat.sender === 'user' 
                      ? 'bg-orange-600 text-white rounded-tr-none' 
                      : 'bg-[#181236]/60 border border-[#2e2452]/30 text-zinc-200 rounded-tl-none'
                  }`}>
                    {chat.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Valentina está digitando...</span>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input 
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Pergunte ao mentor de IA..."
                disabled={!dbData.aiAnalysis || isChatLoading}
                className="flex-1 h-10 px-4 bg-[#110c26] border border-[#2e2452] rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 disabled:opacity-40"
              />
              <button 
                type="submit"
                disabled={!dbData.aiAnalysis || isChatLoading}
                className="w-10 h-10 bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </main>

      {/* Safety Notice Footer */}
      <footer className="border-t border-[#2e2452]/30 py-4 text-center text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] relative z-10 flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5" /> InfluNext // Sandbox Demo Simulation System // 2026
      </footer>

    </div>
  );
}
