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

interface TikTokOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado após a conexão bem-sucedida ou início de fluxo. */
  onConfirm: (mode: 'oauth' | 'simulate', username?: string, followersRange?: string) => void;
}

// ── Tutorial: 3 passos para conectar conta TikTok Creator ────────────────────

const TUTORIAL_STEPS = [
  {
    icon: Smartphone,
    title: 'Abra o aplicativo TikTok',
    description:
      'No seu celular, abra o aplicativo do TikTok e verifique se você está conectado na conta que deseja vincular.',
    tip: 'Certifique-se de que a conta é pública para leitura de visualizações e engajamento.',
  },
  {
    icon: UserCircle,
    title: 'Ferramentas do Criador',
    description:
      'Acesse seu Perfil → Menu (☰) → "Ferramentas do Criador" ou "Configurações de Conta" para garantir que a conta possui acesso às métricas analíticas.',
    tip: 'Contas Criador ou Corporativas possuem métricas de visualização auditáveis em tempo real.',
  },
  {
    icon: Zap,
    title: 'Autorize a InfluNext',
    description:
      'Clique em "Conectar com TikTok" para conceder permissão de leitura de métricas públicas e visualizações recentes.',
    tip: 'Nunca solicitamos sua senha. A autorização é intermediada pela API oficial do TikTok.',
  },
];

const SYNC_STEPS = [
  'Autenticando com TikTok API...',
  'Buscando métricas de vídeos e visualizações...',
  'Calculando taxa de retenção média...',
  'Consolidando InfluScore e histórico...',
  'Conta TikTok vinculada com sucesso!',
];

export function TikTokOnboardingModal({ isOpen, onClose, onConfirm }: TikTokOnboardingModalProps) {
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

  // ── Inicia o fluxo OAuth real do TikTok ───────────────────────────────────

  const handleConnectWithTikTok = async () => {
    setError(null);
    setScreen('connecting');
    setSyncStep(0);

    try {
      const { data } = await api.get<{ tiktok?: string; configured?: { tiktok?: boolean } }>('/integrations/urls');
      const authUrl: string = data.tiktok || '';

      if (!authUrl || authUrl === '#' || authUrl.includes('mock_tt_client_key') || (data.configured && data.configured.tiktok === false)) {
        setError('As credenciais da API do TikTok ainda não estão configuradas em produção. Você pode usar a aba "Modo Sandbox" para vincular sua conta e testar todas as funcionalidades imediatamente!');
        setActiveTab('sandbox');
        setScreen('tutorial');
        return;
      }

      onConfirm('oauth');
      window.location.href = authUrl;
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      const message =
        errorObj?.response?.data?.error ||
        errorObj?.message ||
        'Erro ao iniciar autenticação com o TikTok. Tente pelo Modo Sandbox.';
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      onConfirm('simulate', sandboxUsername, sandboxRange);
      onClose();
    } catch (err: unknown) {
      setError('Erro ao iniciar simulação do TikTok.');
    } finally {
      setIsSimulating(false);
    }
  };

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
            <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">
                TikTok Open API — Creator Engine
              </span>
            </div>
          </div>
          <h2 className="text-2xl font-serif text-[#f5ebe0] tracking-tight leading-tight">
            Vincular <span className="text-cyan-400">TikTok</span>
          </h2>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">
            Conexão segura para auditoria de visualizações, engajamento e métricas de Reels/Vídeos.
          </p>
        </div>

        {/* Tabs de Seleção */}
        {screen === 'tutorial' && (
          <div className="flex border-b border-[#2e2724] bg-[#131110]">
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all ${
                activeTab === 'api'
                  ? 'border-cyan-500 text-[#f5ebe0] bg-white/[0.02]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Conexão Real (API)
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'border-cyan-500 text-[#f5ebe0] bg-white/[0.02]'
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

              {tutorialStep === 0 && (
                <div className="flex items-start gap-3 bg-cyan-500/5 border border-cyan-500/20 rounded-[2px] p-4">
                  <AlertTriangle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-cyan-200 font-medium leading-relaxed">
                    A sincronização do TikTok audita dados de reprodução e seguidores em tempo real através da API oficial. Siga os 3 passos:
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
                          ? 'bg-cyan-500 text-[#131110]'
                          : idx === tutorialStep
                          ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                          : 'bg-white/5 border border-white/10 text-zinc-500'
                      }`}
                    >
                      {idx < tutorialStep ? '✓' : idx + 1}
                    </div>
                    {idx < TUTORIAL_STEPS.length - 1 && (
                      <div
                        className={`h-px flex-1 w-8 transition-all duration-300 ${
                          idx < tutorialStep ? 'bg-cyan-500' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Conteúdo do passo atual */}
              <div className="bg-[#131110] border border-[#2e2724] rounded-[2px] p-5 space-y-3 min-h-[140px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <StepIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-[#f5ebe0] font-black text-sm tracking-tight">
                    {tutorialStep + 1}. {currentTutorialStep.title}
                  </h3>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  {currentTutorialStep.description}
                </p>
                <div className="flex items-start gap-2 pt-1">
                  <Lock className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-zinc-500 text-[9px] italic">{currentTutorialStep.tip}</p>
                </div>
              </div>

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
                    onClick={handleConnectWithTikTok}
                    className="flex-1 h-11 bg-cyan-500 hover:bg-cyan-400 text-[#131110] font-black text-[10px] uppercase tracking-widest rounded-[2px] transition-all flex items-center justify-center gap-2 group shadow-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Conectar com TikTok
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Screen: Sandbox/Simulador (MOCK CONEXÃO) ── */}
          {screen === 'tutorial' && activeTab === 'sandbox' && (
            <form onSubmit={handleConnectSimulated} className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-start gap-3 bg-zinc-800/20 border border-zinc-800 rounded-[2px] p-4">
                <Code className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                  Ambiente Sandbox. Insira seu @handle do TikTok e a faixa de público para sincronizar dados e recalcular seu InfluScore instantaneamente.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-black text-[9px] uppercase tracking-wider block">
                  @ Nome de Usuário do TikTok
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: seu_tiktok"
                  value={sandboxUsername}
                  onChange={(e) => setSandboxUsername(e.target.value)}
                  className="w-full h-11 bg-[#131110] border border-[#2e2724] px-4 text-[#f5ebe0] text-xs font-semibold focus:outline-none focus:border-cyan-500 transition-colors rounded-[2px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-black text-[9px] uppercase tracking-wider block">
                  Faixa de Seguidores (Tamanho do Perfil)
                </label>
                <select
                  value={sandboxRange}
                  onChange={(e) => setSandboxRange(e.target.value)}
                  className="w-full h-11 bg-[#131110] border border-[#2e2724] px-4 text-[#f5ebe0] text-xs font-semibold focus:outline-none focus:border-cyan-500 transition-colors rounded-[2px]"
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
                  className="flex-1 h-11 bg-cyan-500 hover:bg-cyan-400 text-[#131110] font-black text-[10px] uppercase tracking-widest rounded-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-cyan-400 animate-bounce" />
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-[#f5ebe0] font-black text-sm uppercase tracking-wider">
                  {syncStep < SYNC_STEPS.length - 1 ? 'Conectando ao TikTok...' : 'Redirecionando!'}
                </h4>
                <p className="text-zinc-400 text-[11px] font-semibold min-h-[16px]">
                  {SYNC_STEPS[Math.min(syncStep, SYNC_STEPS.length - 1)]}
                </p>
              </div>

              <div className="flex gap-1.5 w-32">
                {SYNC_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      idx < syncStep ? 'bg-cyan-500' : 'bg-[#131110]'
                    }`}
                  />
                ))}
              </div>

              <p className="text-zinc-600 text-[9px]">
                Você será redirecionado ao TikTok para autorizar o acesso.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
