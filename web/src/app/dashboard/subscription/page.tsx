'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Target,
  Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { api } = await import('@/lib/api');
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Erro ao buscar usuário:', err);
      }
    };
    fetchUser();
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      setLoadingPlanId(planId);
      const { api } = await import('@/lib/api');

      const res = await api.post('/payments/create-subscription', {
        planId
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Erro ao iniciar checkout:', err);
      alert('Não foi possível iniciar o checkout. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
      setLoadingPlanId(null);
    }
  };

  const isCompany = user?.role === 'COMPANY';
  const currentTier = user?.subscriptionTier || 'FREE';
  const hasActiveSub = user?.subscriptionStatus === 'ACTIVE';

  if (isCompany) {
    // Layout simplificado para Empresas
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-current tracking-tighter uppercase">Planos Corporativos</h1>
          <p className="text-zinc-400 font-bold">Pare de queimar orçamento com influenciadores que não trazem retorno. Contrate com segurança jurídica e auditoria de ROI.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
          {/* Card 1: Pay-as-you-go */}
          <div className="border border-white/5 bg-black/35 rounded-[2.5rem] p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Plano Gratuito</span>
              <h2 className="text-2xl font-black text-white">Starter Corporativo</h2>
              <div className="py-2 space-y-1">
                <span className="text-sm font-bold text-zinc-500">R$</span>
                <span className="text-5xl font-black text-white tracking-tighter">0,00</span>
                <span className="text-zinc-500 text-[10px] font-bold block uppercase tracking-wider">Por mês</span>
              </div>
              <p className="text-zinc-450 text-xs font-bold leading-relaxed">Pague apenas quando usar. Garanta entregas via comissão operacional padrão sobre o orçamento.</p>
              <ul className="space-y-3 pt-4 text-xs text-zinc-350 font-medium">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>**15%** de comissão operacional de Escrow</span>
                </li>
                <li className="flex items-center gap-3 text-rose-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                  <span>Limite de **3 contratos ativos** simultâneos</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Garantia de saldo em Escrow Seguro</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Acesso completo ao Marketplace de Creators</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Geração de briefings básicos por IA</span>
                </li>
              </ul>
            </div>
            {!(currentTier === 'ENTERPRISE' && hasActiveSub) ? (
              <div className="p-4 bg-zinc-900/40 border border-zinc-750/20 text-zinc-400 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest">
                Seu Plano Atual
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Disponível
              </div>
            )}
          </div>

          {/* Card 2: Agency / Co-Working */}
          <div className="border border-amber-500/20 bg-gradient-to-b from-amber-950/10 to-transparent rounded-[2.5rem] p-10 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-500 text-black font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
              Melhor Opção
            </div>

            <div className="space-y-4">
              <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Recomendado</span>
              <h2 className="text-2xl font-black text-white">Agency / Co-Working</h2>
              <div className="py-2 space-y-1">
                <span className="text-sm font-bold text-amber-400">R$</span>
                <span className="text-5xl font-black text-white tracking-tighter">110,00</span>
                <span className="text-zinc-500 text-[10px] font-bold block uppercase tracking-wider">Por mês</span>
              </div>
              <p className="text-zinc-450 text-xs font-bold leading-relaxed">A central de inteligência definitiva para marcas e agências gerenciarem criadores com ROI garantido.</p>
              <ul className="space-y-3 pt-2 text-xs text-zinc-350 font-medium">
                <li className="flex items-center gap-3 text-amber-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>**Taxa de Escrow reduzida para 10%** em todas as transações</span>
                </li>
                <li className="flex items-center gap-3 text-amber-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>**Contratos e campanhas ativos ilimitados**</span>
                </li>
                <li className="flex items-center gap-3 font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>**IA Especialista em Posicionamento de Marca & Pitch comercial**</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Painel Co-working para **múltiplos usuários administradores**</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Relatórios avançados de **ROI e conversão de campanhas**</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Matching inteligente de Creators baseado em dados de público</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Auditoria automática de postagens e prazos por IA</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Faturamento corporativo unificado e exportação de NFs</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Suporte prioritário e assessoria humana de campanhas</span>
                </li>
              </ul>
            </div>
             {currentTier === 'ENTERPRISE' && hasActiveSub ? (
              <div className="p-4 bg-amber-950/30 border border-amber-500/20 rounded-2xl text-center text-[10px] font-black text-amber-400 uppercase tracking-widest">
                Seu Plano Ativo
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe('plan_brand_enterprise_1')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] disabled:opacity-50"
              >
                {isLoading && loadingPlanId === 'plan_brand_enterprise_1' ? 'Processando...' : 'Assinar Plano Agency'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Layout para Criadores (Free, Pro, Master)
  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-current tracking-tighter uppercase">Planos de Assinatura</h1>
          <p className="text-zinc-400 font-bold">Recebidos não pagam boletos. Monetize seu conteúdo e feche contratos garantidos em dinheiro.</p>
        </div>
        {currentTier === 'FREE' && (
          <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Teste Grátis de 7 dias disponível</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        
        {/* PLANO FREE */}
        <div className={`border rounded-[2.5rem] p-10 flex flex-col justify-between space-y-8 transition-all duration-300 ${
          currentTier === 'FREE' 
            ? 'border-zinc-500/30 bg-zinc-950/20 shadow-md' 
            : 'border-white/5 bg-black/35 opacity-70 hover:opacity-100'
        }`}>
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Starter Creator</span>
              <h2 className="text-3xl font-black text-white tracking-tight">InfluNext Free</h2>
              <p className="text-zinc-400 text-xs font-bold leading-relaxed">Garanta seu pagamento em dinheiro real, não em recebidos ou permutas instáveis.</p>
            </div>
            
            <div className="py-4 border-y border-white/5 space-y-1">
              <span className="text-sm font-bold text-zinc-500">R$</span>
              <span className="text-5xl font-black text-white tracking-tighter">0,00</span>
              <span className="text-zinc-500 text-[10px] font-bold block uppercase tracking-wider">Sem mensalidade</span>
            </div>

            <ul className="space-y-4 text-xs text-zinc-350 font-medium">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>**15%** de taxa operacional sobre campanhas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mentor de IA Vincenzo (Orientação e dicas básicas)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Garantia de saldo em **Escrow Seguro** (calote zero)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>1 conta social conectada (Instagram)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>1 contrato ativo simultâneo no painel</span>
              </li>
            </ul>
          </div>

          <div>
            {currentTier === 'FREE' ? (
              <div className="w-full py-4 border border-zinc-500/20 text-zinc-400 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest">
                Seu Plano Atual
              </div>
            ) : (
              <div className="w-full py-4 border border-white/5 text-zinc-650 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest">
                Incluso
              </div>
            )}
          </div>
        </div>

        {/* PLANO PREMIUM */}
        <div className={`border rounded-[2.5rem] p-10 flex flex-col justify-between space-y-8 transition-all duration-300 relative ${
          currentTier === 'MASTER' && hasActiveSub
            ? 'border-orange-500/40 bg-gradient-to-b from-orange-950/10 to-transparent shadow-xl' 
            : 'border-white/5 bg-black/35 hover:border-orange-500/20 shadow-sm'
        }`}>
          {currentTier === 'FREE' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg">
              Recomendado
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Elite Creator</span>
              <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-1.5">InfluNext Premium <Sparkles className="w-5 h-5 text-orange-400" /></h2>
              <p className="text-zinc-400 text-xs font-bold leading-relaxed">O plano definitivo para o Creator profissional gerenciar sua carreira e faturar alto.</p>
            </div>
            
            <div className="py-4 border-y border-white/5 space-y-1">
              <span className="text-sm font-bold text-orange-400">R$</span>
              <span className="text-5xl font-black text-white tracking-tighter">49,90</span>
              <span className="text-zinc-500 text-[10px] font-bold block uppercase tracking-wider">Por mês</span>
            </div>

            <ul className="space-y-4 text-xs text-zinc-350 font-medium">
              <li className="flex items-center gap-3 text-orange-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>**Taxa reduzida de 5%** por campanha (mais lucro líquido)</span>
              </li>
              <li className="flex items-center gap-3 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>Mentor de IA Vincenzo **Ilimitado + Gerador de Roteiros**</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>**Gerenciamento de carreira escalonável** e relatórios de progresso</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>**Painel de agregação de dados de postagem** (métricas centralizadas)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>Contas sociais conectadas **ilimitadas** (Insta, TikTok, YouTube)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>Contratos e Escrows ativos **ilimitados** em andamento</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>Selo **"Verificado PRO"** e destaque máximo no topo das buscas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-400" />
                <span>Suporte prioritário e consultoria jurídica de contratos</span>
              </li>
            </ul>
          </div>

          <div>
            {currentTier === 'MASTER' && hasActiveSub ? (
              <div className="w-full py-4 bg-orange-950/40 border border-orange-500/20 text-orange-400 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest">
                Seu Plano Ativo
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe('plan_pro_influencer_1')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(217,107,39,0.4)] disabled:opacity-50"
              >
                {isLoading && loadingPlanId === 'plan_pro_influencer_1' ? 'Processando...' : 'Assinar Plano Premium'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
