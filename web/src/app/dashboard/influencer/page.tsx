"use client";
import React, { useEffect, useState } from 'react';
import { api, DashboardData } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { MetricCard } from '@/components/MetricCard';
import { Users, Activity, Target, Eye, AlertCircle, ExternalLink, CheckSquare, Sparkles } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfluScoreCard } from '@/components/influ-score-card';
import Link from 'next/link';

export default function InfluencerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mission, setMission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingMission, setCompletingMission] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, missionRes] = await Promise.all([
          api.get<DashboardData>('/dashboard/influencer'),
          api.get('/influencers/mission')
        ]);
        setData(dashRes.data);
        setMission(missionRes.data);
      } catch (err: any) {
        setError('Falha ao conectar com o servidor.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();

    // Check for Score Decay notification
    const decayed = Cookies.get('influnext_decayed');
    if (decayed) {
      toast.error(`Sentimos sua falta! Seu InfluScore caiu ${decayed} pontos por inatividade. Complete a missão de hoje para recuperar seu ritmo!`, {
        duration: 8000,
      });
      Cookies.remove('influnext_decayed');
    }
  }, []);

  const handleCompleteMission = async () => {
    setCompletingMission(true);
    try {
      await api.post('/influencers/mission/complete');
      setMission((prev: any) => prev ? { ...prev, missionCompleted: true } : null);
      toast.success('✦ Missão Concluída! +5 pts InfluScore');
    } catch (err) {
      toast.error('Erro ao completar missão');
    } finally {
      setCompletingMission(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">Inicializando Motor de Dados...</p>
      </div>
    );
  }

  const latestMetrics = data?.metricsHistory?.[0] || null;
  const activeContracts = data?.contracts || [];
  const pendingTasks = data?.tasks || [];

  return (
    <div className="flex flex-col min-h-screen relative pb-20 md:pb-24">
      
      {/* Daily Mission Banner */}
      {mission && !mission.missionCompleted && (
        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-b border-purple-500/20 px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-full duration-700">
           <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#e8e0f5]">
                 Missão de Hoje: <span className="text-purple-300">{mission.dailyMission}</span>
                 <span className="ml-3 text-emerald-400 font-bold">+5 PTS INFULSCORE</span>
              </p>
           </div>
           <button 
             onClick={handleCompleteMission}
             disabled={completingMission}
             className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#080810] text-[9px] font-black uppercase rounded-full transition-all active:scale-95 disabled:opacity-50"
           >
             {completingMission ? 'Validando...' : 'Marcar como Feita'}
           </button>
        </div>
      )}

      <div className="p-4 md:p-8 space-y-8 flex-1 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#e8e0f5] tracking-tighter">
              Performance <span className="text-purple-500">Hub</span>
            </h1>
            <p className="text-zinc-500 text-xs font-bold">Resumo da sua audiência em tempo real.</p>
          </div>
          <Link 
            href={`/p/${data?.handle}`} 
            target="_blank"
            className="inline-flex items-center justify-center gap-2 bg-[#100c1e] border border-[#1e1430] hover:border-purple-500/50 text-[#e8e0f5] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Public Media Kit <ExternalLink className="w-3 h-3" />
          </Link>
        </header>

        {/* Metrics Grid: 2x2 Mobile, 4x1 Desktop */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <MetricCard title="Seguidores" value={latestMetrics?.followers} icon={Users} change={12} />
          <MetricCard title="Engajamento" value={latestMetrics ? `${latestMetrics.engagementRate}%` : null} icon={Activity} change={-2} />
          <MetricCard title="Alcance" value={latestMetrics?.reachLast30Days} icon={Target} />
          <MetricCard title="Impressões" value={latestMetrics?.avgViews} icon={Eye} />
        </section>

        {/* Chart Section Placeholder */}
        <section className="bg-[#100c1e] border border-[#1e1430] rounded-2xl p-6 relative overflow-hidden">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">Crescimento Histórico</h3>
          <div className="h-[120px] md:h-[300px] w-full flex flex-col items-center justify-center space-y-3">
             <div className="w-full max-w-md h-24 opacity-10 flex items-center justify-center">
                <svg className="w-full h-full text-purple-500" viewBox="0 0 400 100">
                  <path d="M0,50 Q50,20 100,50 T200,50 T300,50 T400,50" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
             </div>
             <p className="text-[10px] font-bold text-zinc-500 italic">Coletando seus primeiros dados de audiência...</p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contracts Section */}
          <div className="md:col-span-1 bg-[#100c1e] border border-[#1e1430] rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#fbbf24] rounded-full" /> Escrow Ativo
            </h3>
            {activeContracts.length === 0 ? (
              <div className="text-[10px] text-zinc-600 font-bold py-10 text-center">Nenhum contrato ativo.</div>
            ) : (
              <div className="space-y-3">
                {activeContracts.slice(0, 3).map(c => (
                  <div key={c.id} className="p-3 bg-[#080810] rounded-xl border border-[#1e1430] flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-300 truncate pr-2">{c.title}</span>
                    <span className="text-emerald-400 font-black text-xs">${Number(c.budget)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="md:col-span-2 bg-[#100c1e] border border-[#1e1430] rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5" /> Entregáveis Pendentes
            </h3>
            <div className="overflow-x-auto">
              {pendingTasks.length === 0 ? (
                <div className="text-[10px] text-zinc-600 font-bold py-10 text-center uppercase tracking-widest">✦ Seu fluxo está limpo ✦</div>
              ) : (
                <Table>
                  <TableBody>
                    {pendingTasks.map(t => (
                      <TableRow key={t.id} className="border-b-[#1e1430] hover:bg-[#151025]">
                        <TableCell className="text-[11px] font-bold py-4">{t.title}</TableCell>
                        <TableCell className="text-[10px] text-zinc-500 text-right">{new Date(t.dueDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* InfluScore Strip - Bottom Footer */}
      <footer className="fixed bottom-0 left-0 md:left-[158px] right-0 h-16 md:h-20 bg-[#150228] border-t border-purple-500/20 backdrop-blur-xl z-30 px-6 flex items-center justify-between shadow-[0_-10px_40px_rgba(21,2,40,0.8)]">
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-purple-400">
             <Sparkles className="w-4 h-4" /> Evolução de Carreira
           </div>
           <div className="h-6 w-[1px] bg-purple-500/20 hidden md:block" />
           <div className="flex flex-col">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Nível Atual</span>
              <span className="text-xs font-black text-[#e8e0f5] uppercase">{data?.scoreClass || 'Calculando...'}</span>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">InfluScore</span>
             <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{data?.influScore || 0}</span>
          </div>
          <div className="bg-gradient-to-tr from-purple-600 to-pink-500 p-2 rounded-xl shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)]">
             <Trophy className="w-5 h-5 text-white" />
          </div>
        </div>
      </footer>

    </div>
  );
}

// Mock Trophy Icon
import { Trophy } from 'lucide-react';
