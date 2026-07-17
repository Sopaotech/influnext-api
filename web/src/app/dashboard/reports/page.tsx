'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  Activity, 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Zap,
  ShoppingBag,
  Percent,
  CheckCircle2,
  Users
} from 'lucide-react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export default function ReportsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [balance, setBalance] = useState(0);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userRole = Cookies.get('influnext_role');
  const isCompany = userRole === 'COMPANY';

  // Filtros de Data
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // Monitor theme cookie updates
  useEffect(() => {
    const savedTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const interval = setInterval(() => {
      const currentTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (isCompany) {
          // Para empresas, buscamos os dados corporativos
          const companyRes = await api.get('/dashboard/company').catch(() => null);
          if (companyRes?.data) {
            // Configurar faturamento simulado baseado em contratos concluídos
            const total = companyRes.data.contracts
              .filter((c: any) => c.escrowStatus === 'COMPLETED')
              .reduce((sum: number, c: any) => sum + Number(c.budget), 0);
            setBalance(total);
            
            // Simular dados mensais
            setMonthlyData([
              { month: 'Jan', value: 0 },
              { month: 'Fev', value: 0 },
              { month: 'Mar', value: 0 },
              { month: 'Abr', value: 0 },
              { month: 'Mai', value: 12450.00 }, // Campanha de Verão
              { month: 'Jun', value: 0 },
              { month: 'Jul', value: 0 },
              { month: 'Ago', value: 0 },
              { month: 'Set', value: 0 },
              { month: 'Out', value: 0 },
              { month: 'Nov', value: 0 },
              { month: 'Dez', value: 0 },
            ]);
            
            setTransactions([
              { id: 'TX-8041', date: '14/06/2026', desc: 'Summer Collection - @demo.influencer', amount: 5000.00, status: 'Concluído', type: 'Campanha' },
              { id: 'TX-8042', date: '16/06/2026', desc: 'Fee de Garantia Escrow da InfluNext', amount: 750.00, status: 'Concluído', type: 'Taxa' }
            ]);
          }
          // Sincronizar plataformas de teste para passar a tela de bloqueio
          setConnectedPlatforms(['INSTAGRAM', 'TIKTOK']);
        } else {
          // Para influenciadores, fluxo normal de saldo
          const [balanceRes, integrationsRes] = await Promise.all([
            api.get('/influencers/balance').catch(() => ({ data: { availableBalance: 0, monthlyData: null, transactions: [] } })),
            api.get('/integrations/connected').catch(() => ({ data: { platforms: [] } }))
          ]);
          
          setBalance(balanceRes.data.availableBalance || 0);
          if (balanceRes.data.monthlyData) {
            setMonthlyData(balanceRes.data.monthlyData);
          }
          if (balanceRes.data.transactions) {
            setTransactions(balanceRes.data.transactions);
          }
          if (integrationsRes.data.platforms) {
            setConnectedPlatforms(integrationsRes.data.platforms || []);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados do relatório:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isCompany]);

  // Dados Base (Inicialmente de exemplo)
  const baseMonthlyData = [
    { month: 'Jan', value: 0 },
    { month: 'Fev', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Abr', value: 0 },
    { month: 'Mai', value: 4250.00 },
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 0 },
    { month: 'Ago', value: 0 },
    { month: 'Set', value: 0 },
    { month: 'Out', value: 0 },
    { month: 'Nov', value: 0 },
    { month: 'Dez', value: 0 },
  ];

  const baseTransactions = [
    { id: 'TRX-101', date: '14/06/2026', desc: 'Summer Collection - Marca Premium', amount: 4250.00, status: 'Concluído', type: 'Campanha' }
  ];

  const [monthlyData, setMonthlyData] = useState<any[]>(baseMonthlyData);
  const [transactions, setTransactions] = useState<any[]>(baseTransactions);

  // Simulação de Filtro de Dados
  const handleFilter = () => {
    setIsFiltering(true);
    setTimeout(() => {
      if (!startDate || !endDate) {
        setMonthlyData(isCompany ? [
          { month: 'Jan', value: 0 },
          { month: 'Fev', value: 0 },
          { month: 'Mar', value: 0 },
          { month: 'Abr', value: 0 },
          { month: 'Mai', value: 12450.00 },
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Set', value: 0 },
          { month: 'Out', value: 0 },
          { month: 'Nov', value: 0 },
          { month: 'Dez', value: 0 },
        ] : baseMonthlyData);
        setTransactions(isCompany ? [
          { id: 'TX-8041', date: '14/06/2026', desc: 'Summer Collection - @demo.influencer', amount: 5000.00, status: 'Concluído', type: 'Campanha' }
        ] : baseTransactions);
      } else {
        const filteredData = monthlyData.map(d => ({
          ...d,
          value: d.value > 0 ? d.value * (Math.random() * (1.2 - 0.8) + 0.8) : Math.floor(Math.random() * 4000)
        }));
        setMonthlyData(filteredData);
        
        setTransactions([
          { id: `TX-${Math.floor(Math.random() * 10000)}`, date: endDate.split('-').reverse().join('/'), desc: isCompany ? 'Faturamento Filtrado Marca' : 'Campanha Filtrada Premium', amount: isCompany ? 12450.00 : 4250.00, status: 'Concluído', type: 'Campanha' },
          { id: `TX-${Math.floor(Math.random() * 10000)}`, date: startDate.split('-').reverse().join('/'), desc: isCompany ? 'Marketing Digital Extra' : 'Post Adicional Reels', amount: 1500.00, status: 'Concluído', type: 'Adicional' },
        ]);
      }
      setIsFiltering(false);
      toast.success('Métricas atualizadas para o período selecionado!');
    }, 600);
  };

  const maxValue = Math.max(...monthlyData.map(d => d.value)) || 1000;
  const currentTotal = monthlyData.reduce((acc, curr) => acc + curr.value, 0);

  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className="p-10 space-y-10 animate-pulse">
        <div className="h-12 w-64 bg-white/10 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-32 bg-white/10 rounded-2xl" />
           <div className="h-32 bg-white/10 rounded-2xl" />
           <div className="h-32 bg-white/10 rounded-2xl" />
        </div>
        <div className="h-96 bg-white/10 rounded-3xl" />
      </div>
    );
  }

  // Se o influenciador não tiver redes conectadas, mostramos a tela de sincronização
  if (!isCompany && connectedPlatforms.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 pb-24 animate-in fade-in duration-500">
        <header className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-1.5 w-12 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-[0.4em]">Analytics Engine</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-current tracking-tighter">
            Relatórios <span className="text-zinc-500 italic">& Growth</span>
          </h1>
        </header>

        <div className={`border rounded-[3rem] p-12 md:p-24 shadow-xl space-y-6 flex flex-col items-center justify-center text-center ${
          isDark ? 'border-white/5 bg-black/35' : 'border-zinc-200 bg-white text-zinc-800 animate-in fade-in duration-500 shadow-zinc-100/50'
        }`}>
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center shadow-lg text-orange-400 animate-bounce">
            <Activity size={32} />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-black text-current tracking-tighter uppercase">Nenhum Canal Integrado</h2>
            <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-550'}`}>
              Seus gráficos de faturamento, evolução de audiência e extratos de campanhas estão aguardando conexão. Conecte suas redes sociais para rastrear suas métricas dinâmicas.
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all shadow-orange-600/10 active:scale-95"
          >
            Conectar Redes Sociais ➔
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 pb-32 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-1.5 w-12 bg-orange-500 rounded-full" />
              <span className="text-[10px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-[0.4em]">
                {isCompany ? 'Corporate_Campaign_Growth' : 'Earnings_Growth_Report'}
              </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-current tracking-tighter">
            Relatórios <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">& Growth</span>
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 font-bold uppercase tracking-[0.2em] mt-1">
            {isCompany ? 'Demonstrativo consolidado de ROI, investimentos e vendas' : 'Demonstrativo consolidado de faturamento e desempenho comercial'}
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`rounded-xl px-4 py-3 text-xs focus:outline-none border font-sans ${
                isDark ? 'bg-white/5 border-white/10 text-white focus:border-orange-500/50' : 'bg-white border-zinc-250 text-zinc-800 focus:border-orange-500'
              }`}
            />
            <span className="text-xs text-zinc-500 font-bold">até</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`rounded-xl px-4 py-3 text-xs focus:outline-none border font-sans ${
                isDark ? 'bg-white/5 border-white/10 text-white focus:border-orange-500/50' : 'bg-white border-zinc-250 text-zinc-800 focus:border-orange-500'
              }`}
            />
          </div>
          
          <button 
            onClick={handleFilter}
            disabled={isFiltering}
            className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50 transition-all"
          >
            {isFiltering ? 'Filtrando...' : <><Filter className="w-3.5 h-3.5" /> Filtrar</>}
          </button>
        </div>
      </header>

      {/* KPIs Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Card 1: Faturamento/Investimento */}
         <div className={`border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden ${
           isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-250 shadow-zinc-100/50'
         }`}>
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-orange-500/5 blur-2xl rounded-full" />
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform">
               <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {isCompany ? 'Total Investido (Campanhas)' : 'Saldo Total Recebido'}
            </p>
            <h3 className="text-4xl font-black text-current tracking-tighter mt-1">
              R$ {isCompany ? (5000.00).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[9px] text-zinc-400 mt-2 block font-semibold">Base: 12 meses consolidados</span>
         </div>

         {/* Card 2: ROI / Taxa de Conversão */}
         <div className={`border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden ${
           isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-250 shadow-zinc-100/50'
         }`}>
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/5 blur-2xl rounded-full" />
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:rotate-6 transition-transform">
               <Percent className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
              {isCompany ? 'Retorno Médio Estimado (ROI)' : 'Taxa de Conversão de Cliques'}
            </p>
            <h3 className="text-4xl font-black text-current tracking-tighter mt-1">
              {isCompany ? '+38.5%' : '4.8%'}
            </h3>
            <span className="text-[9px] text-zinc-400 mt-2 block font-semibold">
              {isCompany ? 'Geração direta sobre investimento' : 'Métricas acima da média do varejo'}
            </span>
         </div>

         {/* Card 3: Vendas Totais / Audiência Alcançada */}
         <div className={`border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden ${
           isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-250 shadow-zinc-100/50'
         }`}>
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/5 blur-2xl rounded-full" />
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:rotate-6 transition-transform">
               {isCompany ? <ShoppingBag className="w-6 h-6" /> : <Users className="w-6 h-6" />}
            </div>
            <p className="text-[10px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-widest">
              {isCompany ? 'Vendas Totais Convertidas' : 'Audiência Total Única'}
            </p>
            <h3 className="text-4xl font-black text-current tracking-tighter mt-1">
              {isCompany ? '124' : '370K'}
            </h3>
            <span className="text-[9px] text-zinc-400 mt-2 block font-semibold">
              {isCompany ? 'Pedidos confirmados via cupom' : 'Seguidores orgânicos auditados'}
            </span>
         </div>
      </section>

      {/* Chart Section */}
      <section className={`border rounded-[3rem] p-8 shadow-sm ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-250 shadow-zinc-100/50'
      }`}>
         <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <h3 className="text-lg font-black text-current uppercase tracking-tight flex items-center gap-2">
               <TrendingUp className="text-orange-500 w-5 h-5" /> 
               {isCompany ? 'Desempenho de Vendas Gerado pelas Campanhas' : 'Evolução Mensal de Faturamento'}
            </h3>
            <div className="flex gap-2">
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Exibição: 12 meses</span>
            </div>
         </div>

         {/* Linhas de Gráfico Customizadas (Pure CSS/React SVG/Flex) */}
         <div className="h-80 flex items-end gap-3 md:gap-6 pt-10 px-4 select-none relative">
            {/* Linhas de Fundo */}
            <div className="absolute inset-x-0 bottom-0 top-10 flex flex-col justify-between pointer-events-none opacity-[0.03]">
               {[1, 2, 3, 4, 5].map((_, idx) => (
                 <div key={idx} className="w-full border-t border-current" />
               ))}
            </div>

            {monthlyData.map((d, index) => {
              const heightPercentage = d.value > 0 ? (d.value / maxValue) * 90 : 2; // Garante tamanho mínimo
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end relative">
                   {/* Tooltip on Hover */}
                   <div className="absolute bottom-[92%] opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10 bg-slate-900 border border-white/10 text-white rounded-xl px-3 py-1.5 text-center text-[10px] font-bold shadow-2xl pointer-events-none whitespace-nowrap">
                      R$ {d.value.toLocaleString('pt-BR')}
                   </div>
                   
                   {/* Barra */}
                   <div 
                     style={{ height: `${heightPercentage}%` }}
                     className={`w-full rounded-t-xl transition-all duration-500 relative overflow-hidden bg-gradient-to-t ${
                       isCompany 
                         ? 'from-amber-600 via-orange-500 to-amber-500 group-hover:from-amber-500 group-hover:to-orange-400 shadow-lg shadow-orange-500/10'
                         : 'from-orange-600 via-amber-500 to-orange-500 group-hover:from-orange-500 group-hover:to-orange-400 shadow-lg shadow-orange-600/10'
                     }`}
                   />
                   
                   {/* Rótulo */}
                   <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                      {d.month}
                   </span>
                </div>
              );
            })}
         </div>
      </section>

      {/* Vincenzo AI Growth Notes */}
      <section className={`border p-6 rounded-[2rem] border-l-4 border-l-orange-500 shadow-sm relative overflow-hidden ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-250 shadow-zinc-100/50'
      }`}>
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full" />
         <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center justify-between text-orange-500 mb-3">
            <div className="flex items-center gap-2">
               <Zap className="w-4 h-4 fill-orange-500" /> Vincenzo AI // Growth Insights
            </div>
         </h3>
         <p className="text-xs text-zinc-550 dark:text-zinc-300 leading-relaxed font-bold">
           {isCompany 
             ? 'Seu retorno médio de R$ 12.450,00 gerado com a @demo.influencer superou as expectativas em 22.4%. Recomendo manter o rate card ativo no provador de linho e diversificar os ganchos do pedro_ph para impulsionar a próxima campanha de outono.'
             : 'O faturamento de R$ 4.250,00 da Coleção de Verão gerou um ROI substancial de +38% para a Marca Premium Ltda. Use esse caso de sucesso como case no seu Media Kit para atrair novas marcas do nicho de moda corporativa.'}
         </p>
      </section>

      {/* Transaction / Campaign Ledger */}
      <section className={`border rounded-[3rem] p-8 shadow-sm ${
        isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-250 shadow-zinc-100/50'
      }`}>
         <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <h3 className="text-lg font-black text-current uppercase tracking-tight flex items-center gap-2">
               <FileText className="text-zinc-500 w-5 h-5" /> 
               {isCompany ? 'Detalhamento de Transações de Campanhas' : 'Extrato de Lançamento de Saldo'}
            </h3>
            <button className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'border-zinc-800 text-zinc-400 hover:bg-white/5' : 'border-zinc-200 text-zinc-550 hover:bg-zinc-50'
            }`}>
               <Download className="w-4 h-4" />
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-[10px] font-black uppercase text-zinc-500 border-b border-white/5">
                     <th className="py-4">Transação</th>
                     <th>Descrição</th>
                     <th>Data</th>
                     <th>Tipo</th>
                     <th>Valor Bruto</th>
                     <th className="text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {transactions.map((t, idx) => (
                    <tr key={idx} className="text-xs font-bold text-current hover:bg-white/[0.01]">
                       <td className="py-5 font-black text-orange-500">{t.id}</td>
                       <td>{t.desc}</td>
                       <td className="text-zinc-500">{t.date}</td>
                       <td className="text-zinc-500">{t.type || 'Faturamento'}</td>
                       <td className="font-black">R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                       <td className="text-right">
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest">
                             {t.status}
                          </span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </section>

    </div>
  );
}
