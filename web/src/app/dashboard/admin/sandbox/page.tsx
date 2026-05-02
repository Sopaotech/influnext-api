'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FlaskConical, Play, CheckCircle, AlertTriangle, RefreshCcw, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function SandboxLabPage() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastImpact, setLastImpact] = useState<any>(null);

  const handleSimulate = async () => {
    try {
      setIsSimulating(true);
      const res = await api.post('/admin/sandbox/simulate');
      setLastImpact(res.data.impact);
      toast.success('✦ Ciclo de Simulação Concluído!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao executar simulação.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] tracking-[0.2em] uppercase">
          <FlaskConical className="w-4 h-4" />
          The Sandbox Lab
        </div>
        <h1 className="text-3xl font-black text-[#e8e0f5] tracking-tighter">
          Laboratório de <span className="text-amber-500">Simulação</span>
        </h1>
        <p className="text-zinc-500 text-xs font-medium">
          Gere massa de dados instantânea para validar o dashboard de faturamento e os fluxos de contrato.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Controle de Simulação */}
        <section className="bg-[#100c1e] border border-[#1e1430] p-8 rounded-3xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-[#e8e0f5] uppercase tracking-tight">Simular Ciclo Completo</h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Cria um contrato, simula o pagamento, aprova entregas e libera o escrow automaticamente. 
              Ideal para testar o cálculo de <b>platformFee</b> e <b>netAmount</b>.
            </p>
          </div>

          <Button 
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full h-14 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
          >
            {isSimulating ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {isSimulating ? 'EXECUTANDO...' : 'INICIAR SIMULAÇÃO'}
          </Button>

          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-600 uppercase tracking-widest justify-center">
            <Database className="w-3 h-3" /> Injeta dados diretamente no Prisma
          </div>
        </section>

        {/* Painel de Resultados Local */}
        <section className="bg-[#080810] border border-[#1e1430] p-8 rounded-3xl border-dashed flex flex-col justify-center">
          {!lastImpact ? (
            <div className="text-center space-y-3 opacity-30">
               <div className="flex justify-center"><CheckCircle className="w-12 h-12 text-zinc-700" /></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Aguardando Execução</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Sucesso</span>
                 <h4 className="text-lg font-black text-[#e8e0f5]">Impacto no Faturamento</h4>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#100c1e] rounded-2xl border border-amber-500/20">
                     <span className="text-[9px] font-bold text-zinc-500 uppercase block">GMV Gerado</span>
                     <span className="text-xl font-black text-[#e8e0f5]">${lastImpact.gmvAdded.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-[#100c1e] rounded-2xl border border-emerald-500/20">
                     <span className="text-[9px] font-bold text-zinc-500 uppercase block">Revenue Platform</span>
                     <span className="text-xl font-black text-emerald-400">${lastImpact.revenueAdded.toFixed(2)}</span>
                  </div>
               </div>
               
               <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
                  Contrato ID: <span className="text-zinc-400">{lastImpact.contractId}</span>
               </p>
            </div>
          )}
        </section>

      </div>

      {/* Alerta de Segurança */}
      <footer className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-[11px] font-black text-amber-500 uppercase tracking-tight">Ambiente de Teste</p>
          <p className="text-[10px] text-amber-500/70 leading-relaxed font-medium">
            Esta ferramenta gera dados reais no banco de dados. Utilize apenas em ambientes de homologação ou para demonstrações rápidas para o Fundador.
          </p>
        </div>
      </footer>

    </div>
  );
}
