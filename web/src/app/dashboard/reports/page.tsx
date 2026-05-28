"use client";
import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, DollarSign, Activity, FileText, Download, Calendar, Filter, Zap } from 'lucide-react';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de Data
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await api.get('/influencers/balance');
        setBalance(res.data.availableBalance || 0);
      } catch (err) {
        console.error('Erro ao buscar balanço:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBalance();
  }, []);

  // Dados Base (Mockados)
  const baseMonthlyData = [
    { month: 'Jan', value: 1200 },
    { month: 'Fev', value: 1900 },
    { month: 'Mar', value: 3000 },
    { month: 'Abr', value: 2500 },
    { month: 'Mai', value: 4200 },
    { month: 'Jun', value: 3800 },
    { month: 'Jul', value: 5500 },
    { month: 'Ago', value: 6100 },
    { month: 'Set', value: 4900 },
    { month: 'Out', value: 7200 },
    { month: 'Nov', value: 8500 },
    { month: 'Dez', value: 9200 },
  ];

  const baseTransactions = [
    { id: 'TRX-982', date: '28 Maio 2026', desc: 'Campanha de Verão (Marca X)', amount: 4500.00, status: 'Concluído' },
    { id: 'TRX-981', date: '15 Maio 2026', desc: 'Saque PIX para Conta Pessoal', amount: -2000.00, status: 'Processado' },
    { id: 'TRX-980', date: '02 Maio 2026', desc: 'Post Patrocinado (Tech Corp)', amount: 1500.00, status: 'Concluído' },
    { id: 'TRX-979', date: '25 Abr 2026', desc: 'Campanha Dia das Mães', amount: 8200.00, status: 'Concluído' },
  ];

  const [monthlyData, setMonthlyData] = useState(baseMonthlyData);
  const [transactions, setTransactions] = useState(baseTransactions);

  // Simulação de Filtro de Dados
  const handleFilter = () => {
    setIsFiltering(true);
    setTimeout(() => {
      if (!startDate || !endDate) {
        setMonthlyData(baseMonthlyData);
        setTransactions(baseTransactions);
      } else {
        // Simula uma filtragem aleatória / específica para a data
        // Em produção, isso bateria em /reports/filter?start=...&end=...
        const filteredData = baseMonthlyData.map(d => ({
          ...d,
          value: d.value * (Math.random() * (1.2 - 0.5) + 0.5)
        }));
        setMonthlyData(filteredData);
        
        // Simula transações focadas naquele período
        setTransactions([
          { id: `TRX-${Math.floor(Math.random() * 1000)}`, date: endDate.split('-').reverse().join('/'), desc: 'Campanha Filtrada Premium', amount: 9500.00, status: 'Concluído' },
          { id: `TRX-${Math.floor(Math.random() * 1000)}`, date: startDate.split('-').reverse().join('/'), desc: 'Post Reels Patrocinado', amount: 3200.00, status: 'Concluído' },
        ]);
      }
      setIsFiltering(false);
    }, 600);
  };

  const maxValue = Math.max(...monthlyData.map(d => d.value));
  const currentTotal = monthlyData.reduce((acc, curr) => acc + curr.value, 0);

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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 pb-24 animate-in fade-in duration-1000">
      
      {/* Header com Filtros */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-1.5 w-12 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Analytics Engine</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
            Relatórios <span className="text-slate-400 italic">& Growth</span>
          </h1>
        </div>
        
        {/* Painel de Filtros de Data */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white/60 border border-slate-200 rounded-2xl px-4 py-2 shadow-sm" style={{ backdropFilter: 'blur(20px)' }}>
             <Calendar size={14} className="text-slate-500" />
             <input 
               type="date" 
               className="bg-transparent text-[11px] font-black text-slate-700 focus:outline-none" 
               value={startDate} 
               onChange={e => setStartDate(e.target.value)} 
             />
             <span className="text-slate-400 text-[9px] font-black uppercase">Até</span>
             <input 
               type="date" 
               className="bg-transparent text-[11px] font-black text-slate-700 focus:outline-none" 
               value={endDate} 
               onChange={e => setEndDate(e.target.value)} 
             />
             <button 
               onClick={handleFilter}
               className="ml-2 bg-slate-900 text-white p-1.5 rounded-lg hover:bg-purple-600 transition-colors"
             >
                <Filter size={12} />
             </button>
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
            <Download size={14} /> Exportar
          </button>
        </div>
      </header>

      {/* KPIs */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
         {/* Faturamento Anual / Período */}
         <div className="bg-white/40 border border-white/50 p-6 rounded-[2rem] shadow-xl" style={{ backdropFilter: 'blur(30px)' }}>
            <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg">
                  <DollarSign size={20} />
               </div>
               <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                 <ArrowUpRight size={14} /> +34%
               </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
              {startDate && endDate ? 'Faturamento no Período' : 'Faturamento Total (Est.)'}
            </p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentTotal + balance)}
            </p>
         </div>

         {/* Crescimento de Audiência */}
         <div className="bg-white/40 border border-white/50 p-6 rounded-[2rem] shadow-xl" style={{ backdropFilter: 'blur(30px)' }}>
            <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-purple-600 text-white rounded-xl shadow-lg">
                  <TrendingUp size={20} />
               </div>
               <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                 <ArrowUpRight size={14} /> +12%
               </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Crescimento de Base</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">
              +14.2K
            </p>
         </div>

         {/* Melhor Campanha do Período */}
         <div className="bg-white/40 border border-white/50 p-6 rounded-[2rem] shadow-xl" style={{ backdropFilter: 'blur(30px)' }}>
            <div className="flex items-center justify-between mb-4">
               <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg">
                  <Zap size={20} />
               </div>
               <span className="flex items-center gap-1 text-xs font-black text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                 Destaque
               </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Top Campanha (ROI)</p>
            <p className="text-xl font-black text-slate-900 tracking-tighter truncate">
              {transactions[0]?.desc || 'Nenhuma no período'}
            </p>
         </div>
      </div>

      {/* Gráfico de Faturamento (Custom CSS Chart) */}
      <div className={`bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Desenvolvimento</h3>
          <p className="text-xl md:text-2xl font-black text-white mb-10">Curva de Faturamento</p>
          
          <div className="h-64 flex items-end gap-2 md:gap-4 mt-8">
            {monthlyData.map((data, idx) => {
              const heightPercent = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-3 group/bar">
                  {/* Tooltip escondido */}
                  <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white text-slate-900 text-xs font-black px-3 py-2 rounded-xl mb-2 whitespace-nowrap shadow-xl translate-y-2 group-hover/bar:translate-y-0 duration-300 z-20 relative">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value)}
                  </div>
                  {/* Barra do gráfico */}
                  <div 
                    className="w-full bg-emerald-500/20 group-hover/bar:bg-emerald-500 rounded-t-xl transition-all duration-500 relative overflow-hidden"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-emerald-400/50" />
                  </div>
                  {/* Mês */}
                  <span className="text-[9px] font-black uppercase text-slate-500">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Histórico de Transações */}
      <div className={`bg-white/60 border border-white/50 rounded-[3rem] p-8 md:p-10 shadow-xl transition-opacity duration-300 ${isFiltering ? 'opacity-50' : 'opacity-100'}`} style={{ backdropFilter: 'blur(30px)' }}>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <FileText size={18} />
           </div>
           <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                {startDate && endDate ? `Extrato: ${startDate} até ${endDate}` : 'Extrato Geral'}
              </h3>
              <p className="text-lg font-black text-slate-900">Histórico de Transações</p>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ID</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Descrição</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? transactions.map((trx, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-white/50 transition-colors">
                  <td className="py-5 text-xs font-bold text-slate-500">{trx.id}</td>
                  <td className="py-5 text-xs font-bold text-slate-500">{trx.date}</td>
                  <td className="py-5 text-sm font-black text-slate-800">{trx.desc}</td>
                  <td className="py-5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      trx.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {trx.status}
                    </span>
                  </td>
                  <td className={`py-5 text-right font-black ${trx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {trx.amount > 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trx.amount)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Nenhuma transação encontrada neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {transactions.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 transition-colors">
              Carregar Mais Transações ↓
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
