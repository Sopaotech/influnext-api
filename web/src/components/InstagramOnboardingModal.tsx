'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Smartphone,
  UserCircle,
  Zap,
  AlertTriangle,
  ExternalLink,
  Code,
} from 'lucide-react';
import { api } from '@/lib/api';

interface InstagramOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado após a conexão bem-sucedida ou início de fluxo. */
  onConfirm: (mode: 'oauth' | 'simulate', username?: string, followersRange?: string) => void;
}

// ── Tutorial: 3 passos para converter conta pessoal em Creator ────────────────

const TUTORIAL_STEPS = [
  {
    icon: Smartphone,
    title: 'Abra o app do Instagram',
    description:
      'No seu celular, abra o aplicativo do Instagram e vá até o seu perfil tocando no ícone de foto no canto inferior direito.',
    tip: 'Certifique-se de estar logado na conta que deseja conectar à InfluNext.',
  },
  {
    icon: UserCircle,
    title: 'Acesse Configurações da Conta',
    description:
      'Toque no menu (☰) no canto superior direito → "Configurações e Privacidade" → "Tipo de Conta e Ferramentas" → "Mudar para conta profissional".',
    tip: 'Escolha "Criador de Conteúdo" — é gratuito e leva menos de 1 minuto.',
  },
  {
    icon: Zap,
    title: 'Conecte aqui na InfluNext',
    description:
      'Com a conta convertida para Criador de Conteúdo (ou Comercial), clique em "Conectar com Instagram" abaixo e faça login diretamente com suas credenciais do Instagram.',
    tip: 'Não pediremos sua senha. O acesso é somente leitura de métricas públicas.',
  },
];

// ── Passos de loading durante a sincronização ─────────────────────────────────

const SYNC_STEPS = [
  'Autenticando com Meta API...',
  'Buscando dados do perfil Creator...',
  'Avaliando taxa de engajamento médio...',
  'Consolidando InfluScore e histórico...',
  'Perfil verificado com sucesso!',
];

// ─────────────────────────────────────────────────────────────────────────────

export function InstagramOnboardingModal({ isOpen, onClose, onConfirm }: InstagramOnboardingModalProps) {
  const [activeTab, setActiveTab] = useState<'api' | 'sandbox'>('api');
  const [screen, setScreen] = useState<'tutorial' | 'connecting' | 'success'>('tutorial');
  const [tutorialStep, setTutorialStep] = useState(0);
  const [syncStep, setSyncStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form states do Sandbox/Simulador
  const [sandboxUsername, setSandboxUsername] = useState('');
  const [sandboxRange, setSandboxRange] = useState('10k-50k');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  // ── Inicia o fluxo OAuth real do Instagram ────────────────────────────────

  const handleConnectWithInstagram = async () => {
    setError(null);
    setScreen('connecting');
    setSyncStep(0);

    try {
      // Busca a URL de autorização no backend
      const { data } = await api.get('/integrations/instagram/auth-url');
      const authUrl: string = data.authUrl;

      if (!authUrl) {
        throw new Error('URL de autenticação não retornada pelo servidor.');
      }

      // Notifica o componente pai que o fluxo OAuth foi iniciado
      onConfirm('oauth');

      // Redireciona imediatamente para o Instagram OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Erro ao iniciar autenticação. Tente novamente.';
      setError(message);
      setScreen('tutorial');
    }
  };

  // ── Executa a simulação para fins de teste/sandbox ─────────────────────────

  const handleConnectSimulated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxUsername) return;
    
    setIsSimulating(true);
    setError(null);

    try {
      // Pequeno delay para gerar sensação premium de processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onConfirm('simulate', sandboxUsername, sandboxRange);
      onClose();
    } catch (err: any) {
      setError('Erro ao iniciar simulação.');
    } finally {
      setIsSimulating(false);
    }
  };

  // ── Renders ───────────────────────────────────────────────────────────────

  const currentTutorialStep = TUTORIAL_STEPS[tutorialStep];
  const StepIcon = currentTutorialStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#0c0a09]/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={screen === 'tutorial' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1716] border border-[#2e2724] w-full max-w-md rounded-[2px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#131110] to-[#241f1c] p-8 text-[#f5ebe0] relative border-b border-[#2e2724]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-24 h-24 text-amber-500" />
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                Instagram API — Creator Login
              </span>
            </div>
          </div>
          <h2 className="text-2xl font-serif text-[#f5ebe0] tracking-tight leading-tight">
            Vincular <span className="text-[#d96b27]">Instagram</span>
          </h2>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">
            Sem senha — apenas leitura de métricas. Conta Creator ou Comercial necessária.
          </p>
        </div>

        {/* Tabs de Seleção (Apenas se não estiver no processo de conexão ativo) */}
        {screen === 'tutorial' && (
          <div className="flex border-b border-[#2e2724] bg-[#131110]">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === 'api'
                  ? 'border-[#d96b27] text-[#f5ebe0] bg-white/[0.02]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Conexão Real (API)
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'border-[#d96b27] text-[#f5ebe0] bg-white/[0.02]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Code className="w-3 h-3" /> Modo Sandbox
            </button>
          </div>
        )}

        <div className="p-8">

          {/* ── Screen: Tutorial (API REAL) ── */}
          {screen === 'tutorial' && activeTab === 'api' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Alerta: por que precisa de conta Creator */}
              {tutorialStep === 0 && (
                <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-[2px] p-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200 font-medium leading-relaxed">
                    A Meta exige que sua conta seja do tipo{' '}
                    <strong className="text-amber-400">Criador de Conteúdo</strong> ou{' '}
                    <strong className="text-amber-400">Comercial</strong> para conectar à API.
                    Contas pessoais não são suportadas. Siga os 3 passos abaixo:
                  </p>
                </div>
              )}

              {/* Indicador de etapas */}
              <div className="flex gap-2 items-center">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all duration-300 ${
                        idx < tutorialStep
                          ? 'bg-[#d96b27] text-[#131110]'
                          : idx === tutorialStep
                          ? 'bg-[#d96b27]/20 border border-[#d96b27] text-[#d96b27]'
                          : 'bg-white/5 border border-white/10 text-zinc-500'
                      }`}
                    >
                      {idx < tutorialStep ? '✓' : idx + 1}
                    </div>
                    {idx < TUTORIAL_STEPS.length - 1 && (
                      <div
                        className={`h-px flex-1 w-8 transition-all duration-300 ${
                          idx < tutorialStep ? 'bg-[#d96b27]' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Conteúdo do passo atual */}
              <div className="bg-[#131110] border border-[#2e2724] rounded-[2px] p-5 space-y-3 min-h-[140px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d96b27]/10 border border-[#d96b27]/20 flex items-center justify-center flex-shrink-0">
                    <StepIcon className="w-5 h-5 text-[#d96b27]" />
                  </div>
                  <h3 className="text-[#f5ebe0] font-black text-sm tracking-tight">
                    {tutorialStep + 1}. {currentTutorialStep.title}
                  </h3>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  {currentTutorialStep.description}
                </p>
                <div className="flex items-start gap-2 pt-1">
                  <Lock className="w-3 h-3 text-[#d96b27] flex-shrink-0 mt-0.5" />
                  <p className="text-zinc-500 text-[9px] italic">{currentTutorialStep.tip}</p>
                </div>
              </div>

              {/* Erro (se houver) */}
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-[2px] p-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-300">{error}</p>
                </div>
              )}

              {/* Botões de navegação */}
              <div className="flex gap-3">
                {tutorialStep === 0 ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 h-11 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded-[2px] transition-all border border-white/5"
                  >
                    Voltar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTutorialStep((s) => s - 1)}
                    className="w-1/3 h-11 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded-[2px] transition-all border border-white/5 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3 h-3" /> Anterior
                  </button>
                )}

                {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setTutorialStep((s) => s + 1)}
                    className="flex-1 h-11 bg-[#2e2724] hover:bg-[#3a302c] text-[#f5ebe0] font-black text-[10px] uppercase tracking-widest rounded-[2px] transition-all flex items-center justify-center gap-2 group"
                  >
                    Próximo passo <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectWithInstagram}
                    className="flex-1 h-11 bg-[#d96b27] hover:bg-[#c25a1e] text-[#131110] font-black text-[10px] uppercase tracking-widest rounded-[2px] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-amber-950/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Conectar com Instagram
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Screen: Sandbox/Simulador (MOCK CONEXÃO) ── */}
          {screen === 'tutorial' && activeTab === 'sandbox' && (
            <form onSubmit={handleConnectSimulated} className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-start gap-3 bg-zinc-800/20 border border-zinc-800 rounded-[2px] p-4">
                <Code className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                  Ambiente de testes (Sandbox). Insira um nome de usuário fictício e selecione a faixa de seguidores para simular a sincronização de métricas de IA.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-black text-[9px] uppercase tracking-wider block">
                  @ Nome de Usuário do Instagram
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: seu_username"
                  value={sandboxUsername}
                  onChange={(e) => setSandboxUsername(e.target.value)}
                  className="w-full h-11 bg-[#131110] border border-[#2e2724] px-4 text-[#f5ebe0] text-xs font-semibold focus:outline-none focus:border-[#d96b27] transition-colors rounded-[2px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-black text-[9px] uppercase tracking-wider block">
                  Faixa de Seguidores (Tamanho do Perfil)
                </label>
                <select
                  value={sandboxRange}
                  onChange={(e) => setSandboxRange(e.target.value)}
                  className="w-full h-11 bg-[#131110] border border-[#2e2724] px-4 text-[#f5ebe0] text-xs font-semibold focus:outline-none focus:border-[#d96b27] transition-colors rounded-[2px]"
                >
                  <option value="10k-50k">Micro: 10k a 50k seguidores</option>
                  <option value="50k-100k">Médio: 50k a 100k seguidores</option>
                  <option value="100k-500k">Grande: 100k a 500k seguidores</option>
                  <option value="500k+">Mega: +500k seguidores</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 h-11 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded-[2px] transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSimulating || !sandboxUsername}
                  className="flex-1 h-11 bg-[#d96b27] hover:bg-[#c25a1e] text-[#131110] font-black text-[10px] uppercase tracking-widest rounded-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSimulating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'Conectar (Simulado)'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Screen: Connecting / Syncing ── */}
          {screen === 'connecting' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
              <div className="relative">
                {syncStep < SYNC_STEPS.length - 1 ? (
                  <Loader2 className="w-12 h-12 text-[#d96b27] animate-spin" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-amber-500 animate-bounce" />
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-[#f5ebe0] font-black text-sm uppercase tracking-wider">
                  {syncStep < SYNC_STEPS.length - 1 ? 'Conectando...' : 'Redirecionando!'}
                </h4>
                <p className="text-zinc-400 text-[11px] font-semibold min-h-[16px]">
                  {SYNC_STEPS[Math.min(syncStep, SYNC_STEPS.length - 1)]}
                </p>
              </div>

              {/* Barra de progresso */}
              <div className="flex gap-1.5 w-32">
                {SYNC_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx < syncStep ? 'bg-[#d96b27]' : 'bg-[#131110]'
                    }`}
                  />
                ))}
              </div>

              <p className="text-zinc-600 text-[9px]">
                Você será redirecionado ao Instagram para autorizar o acesso.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
