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
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
  BarChart3,
  Eye,
  Layers,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

interface MonthlyReportItem {
  month: string;
  shortMonth: string;
  revenue: number;
  clicks: number;
  roi: number;
}

interface TransactionReportItem {
  id: string;
  date: string;
  desc: string;
  amount: number;
  netAmount?: number;
  status: string;
  type?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(5180.00);
  const [isLoading, setIsLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'REVENUE' | 'CLICKS' | 'ROI'>('REVENUE');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const userRole = Cookies.get('influnext_role');
  const isCompany = userRole === 'COMPANY';

  // Filtros de Data
  const [selectedPeriod, setSelectedPeriod] = useState<'30D' | '90D' | '12M' | 'ALL'>('12M');

  // Dados mensais refinados
  const monthlyData: MonthlyReportItem[] = [
    { month: 'Janeiro', shortMonth: 'Jan', revenue: 950.00, clicks: 1400, roi: 2.1 },
    { month: 'Fevereiro', shortMonth: 'Fev', revenue: 1400.00, clicks: 2300, roi: 2.6 },
    { month: 'Março', shortMonth: 'Mar', revenue: 1850.00, clicks: 3100, roi: 2.9 },
    { month: 'Abril', shortMonth: 'Abr', revenue: 1200.00, clicks: 1950, roi: 2.3 },
    { month: 'Maio', shortMonth: 'Mai', revenue: 2650.00, clicks: 4600, roi: 3.4 },
    { month: 'Junho', shortMonth: 'Jun', revenue: 3400.00, clicks: 5900, roi: 3.8 },
    { month: 'Julho', shortMonth: 'Jul', revenue: 5180.00, clicks: 8540, roi: 4.8 },
    { month: 'Agosto', shortMonth: 'Ago', revenue: 3100.00, clicks: 5200, roi: 3.5 },
    { month: 'Setembro', shortMonth: 'Set', revenue: 2150.00, clicks: 3600, roi: 3.0 },
    { month: 'Outubro', shortMonth: 'Out', revenue: 2800.00, clicks: 4800, roi: 3.3 },
    { month: 'Novembro', shortMonth: 'Nov', revenue: 3900.00, clicks: 6800, roi: 4.1 },
    { month: 'Dezembro', shortMonth: 'Dez', revenue: 4750.00, clicks: 8100, roi: 4.5 },
  ];

  const transactions: TransactionReportItem[] = [
    { id: 'TX-8041', date: '24/08/2026', desc: 'Campanha Summer Collection - Marca Premium', amount: 5000.00, netAmount: 4250.00, status: 'Pago via SafePay', type: 'Reels + Stories' },
    { id: 'TX-8040', date: '12/08/2026', desc: 'Lançamento Fone Galaxy Buds - Samsung Brasil', amount: 3500.00, netAmount: 2975.00, status: 'Pago via SafePay', type: 'Reels 60s' },
    { id: 'TX-8039', date: '28/07/2026', desc: 'Provador Fashion de Inverno - Zara Brasil', amount: 1500.00, netAmount: 1275.00, status: 'Pago via SafePay', type: 'Sequência Stories' },
    { id: 'TX-8038', date: '15/07/2026', desc: 'Campanha Linho Conceitual - Osklen', amount: 2000.00, netAmount: 1700.00, status: 'Pago via SafePay', type: 'Reels Conceitual' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleExportDRE = () => {
    window.print();
  };

  // Cálculos do Gráfico SVG de Alta Precisão
  const getValues = () => {
    if (chartMode === 'REVENUE') return monthlyData.map(d => d.revenue);
    if (chartMode === 'CLICKS') return monthlyData.map(d => d.clicks);
    return monthlyData.map(d => d.roi);
  };

  const values = getValues();
  const maxVal = Math.max(...values) * 1.15; // 15% de folga no topo
  const minVal = 0;

  // Dimensões do SVG
  const svgWidth = 1000;
  const svgHeight = 320;
  const paddingX = 40;
  const paddingY = 30;

  const getCoordinates = () => {
    const usableWidth = svgWidth - (paddingX * 2);
    const usableHeight = svgHeight - (paddingY * 2);

    return values.map((val, idx) => {
      const x = paddingX + (idx / (values.length - 1)) * usableWidth;
      const y = svgHeight - paddingY - ((val - minVal) / (maxVal - minVal)) * usableHeight;
      return { x, y, val, item: monthlyData[idx] };
    });
  };

  const points = getCoordinates();

  // Gerador de curva Bezier suave
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  const totalYearRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const avgMonthlyRevenue = totalYearRevenue / monthlyData.length;
  const peakItem = monthlyData.reduce((max, d) => d.revenue > max.revenue ? d : max, monthlyData[0]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-[#FAFAFA] min-h-screen animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="h-40 bg-white rounded-3xl border border-slate-200" />
          <div className="h-40 bg-white rounded-3xl border border-slate-200" />
          <div className="h-40 bg-white rounded-3xl border border-slate-200" />
          <div className="h-40 bg-white rounded-3xl border border-slate-200" />
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR - RELATÓRIOS & GROWTH COM FILTROS
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-orange-500" /> Financial & Growth Auditor
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Métricas Auditadas SHA-256
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
            Relatórios <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">& Growth</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
            {isCompany 
              ? 'Demonstrativo consolidado de retorno sobre investimento (ROI), vendas de cupons e taxa de conversão.'
              : 'Demonstrativo consolidado de faturamento, comissões recebidas, engajamento e extrato contábil.'}
          </p>
        </div>

        {/* Filtros de Período e Botão de Exportação */}
        <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-2xl">
            {(['30D', '90D', '12M', 'ALL'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  selectedPeriod === period 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {period === '30D' ? '30 Dias' : period === '90D' ? '90 Dias' : period === '12M' ? '12 Meses' : 'Tudo'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportDRE}
            className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar PDF / DRE
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. GRADE DE 4 CARDS DE KPIS DE GROWTH
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card 1: Faturamento Total */}
        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> +24.5% YoY
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {isCompany ? 'Total Investido em Publis' : 'Faturamento Total Recebido'}
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              R$ {totalYearRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">Base: 12 meses consolidados</span>
          </div>
        </div>

        {/* Card 2: Taxa de Conversão */}
        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <Percent className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Média Varejo: 1.8%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Taxa de Conversão de Cliques
            </span>
            <div className="text-3xl font-black text-emerald-600 tracking-tight flex items-baseline gap-1">
              4.8%
              <span className="text-xs font-bold text-slate-400">(Alta eficiência)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">Rastreamento de Bio e Stories</span>
          </div>
        </div>

        {/* Card 3: Audiência Única */}
        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Auditado
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Audiência Total Única
            </span>
            <div className="text-3xl font-black text-slate-950 tracking-tight">
              370.000
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">100% seguidores reais auditados</span>
          </div>
        </div>

        {/* Card 4: ROI Comprovado */}
        <div className="p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Top 5%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              ROI Médio Comprovado
            </span>
            <div className="text-3xl font-black text-orange-600 tracking-tight">
              +38.5%
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-1 block">Retorno acima do mercado</span>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. NOVO GRÁFICO PRO ANALYTICS (SVG SUAVE COM GRADIENTE + BARRAS FINAS)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
        
        {/* Topo do Gráfico com Seletor e Métricas Resumidas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-950">
                Curva de Desempenho & Evolução Financeira
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Curva fluida de conversão e faturamento com marcadores interativos mês a mês.
            </p>
          </div>

          {/* Métricas Rápidas */}
          <div className="flex items-center gap-6 text-xs flex-wrap">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Média Mensal</span>
              <span className="text-sm font-black text-slate-900">
                R$ {avgMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pico de Faturamento</span>
              <span className="text-sm font-black text-orange-600">
                R$ {peakItem.revenue.toLocaleString('pt-BR')} ({peakItem.shortMonth})
              </span>
            </div>

            {/* Abas do Modo do Gráfico */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <button
                onClick={() => setChartMode('REVENUE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  chartMode === 'REVENUE' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                💰 Faturamento (R$)
              </button>
              <button
                onClick={() => setChartMode('CLICKS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  chartMode === 'CLICKS' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🔗 Cliques
              </button>
              <button
                onClick={() => setChartMode('ROI')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  chartMode === 'ROI' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🎯 ROI
              </button>
            </div>
          </div>
        </div>

        {/* Área do Gráfico SVG de Alta Precisão */}
        <div className="relative w-full overflow-hidden select-none pt-4">
          
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-72 md:h-80 overflow-visible"
          >
            <defs>
              {/* Gradiente de Preenchimento da Área */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>

              {/* Gradiente da Linha Suave */}
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="50%" stopColor="#FF6A00" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>

              {/* Filtro de Sombra para o traçado */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#FF6A00" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Linhas de Grade Horizontais */}
            {[0.2, 0.4, 0.6, 0.8].map((pct, idx) => {
              const y = paddingY + (svgHeight - paddingY * 2) * pct;
              return (
                <line 
                  key={idx}
                  x1={paddingX} 
                  y1={y} 
                  x2={svgWidth - paddingX} 
                  y2={y} 
                  stroke="#E2E8F0" 
                  strokeDasharray="4 4" 
                  strokeWidth="1"
                />
              );
            })}

            {/* Barras Finas e Elegantes de Fundo (Visual Híbrido) */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              const barHeight = (svgHeight - paddingY) - pt.y;
              return (
                <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
                  {/* Barra Vertical Fina */}
                  <rect
                    x={pt.x - 7}
                    y={pt.y}
                    width={14}
                    height={barHeight}
                    rx={7}
                    fill={isHovered ? "#FF6A00" : "#F1F5F9"}
                    className="transition-colors duration-200"
                  />
                  {/* Linha Guia no Hover */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingY}
                      x2={pt.x}
                      y2={svgHeight - paddingY}
                      stroke="#FF6A00"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.6"
                    />
                  )}
                </g>
              );
            })}

            {/* Área Preenchida com Gradiente Suave */}
            <path d={areaPath} fill="url(#areaGradient)" />

            {/* Traçado da Curva Spline */}
            <path 
              d={linePath} 
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* Pontos de Interação */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              const isPeak = pt.item.shortMonth === peakItem.shortMonth;

              return (
                <g 
                  key={idx} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Círculo Externo no Hover */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 10 : isPeak ? 6 : 4.5}
                    fill={isHovered ? "#FF6A00" : isPeak ? "#EA580C" : "#FFFFFF"}
                    stroke={isHovered ? "#FFFFFF" : "#FF6A00"}
                    strokeWidth={isHovered ? 3 : 2.5}
                    className="transition-all duration-200 shadow-lg"
                  />
                </g>
              );
            })}

          </svg>

          {/* Rótulos dos Meses no Eixo X */}
          <div className="flex justify-between px-6 pt-2 text-[11px] font-black uppercase text-slate-400 tracking-wider">
            {monthlyData.map((d, idx) => (
              <span 
                key={idx} 
                className={`transition-colors cursor-pointer ${
                  hoveredIndex === idx ? 'text-orange-600 scale-110 font-bold' : 'hover:text-slate-700'
                }`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {d.shortMonth}
              </span>
            ))}
          </div>

          {/* Card Flutuante de Detalhes no Hover */}
          {hoveredIndex !== null && (
            <div 
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 pointer-events-none animate-in fade-in zoom-in-95 duration-150 z-30 flex items-center gap-6"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] text-orange-400 font-black uppercase tracking-wider block">
                  {monthlyData[hoveredIndex].month} 2026
                </span>
                <p className="text-base font-black text-white">
                  R$ {monthlyData[hoveredIndex].revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cliques em Links</span>
                <p className="text-sm font-black text-emerald-400">
                  {monthlyData[hoveredIndex].clicks.toLocaleString('pt-BR')} acessos
                </p>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Eficiência ROI</span>
                <p className="text-sm font-black text-amber-400">
                  {monthlyData[hoveredIndex].roi}x Retorno
                </p>
              </div>
            </div>
          )}

        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. CARD VINCENZO AI // INSIGHTS DE CRESCIMENTO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white border border-orange-200/90 shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600">
            <Sparkles className="w-4 h-4 text-orange-600" /> Vincenzo AI // Estratégia de Monetização
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Recomendação Ativa
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {isCompany 
            ? 'O retorno médio gerado com os criadores contratados superou as metas em 22.4%. Recomendamos renovar a campanha de Provador de Linho para a coleção de Outono com pacotes combinados de Reels + Stories.'
            : 'Seu faturamento atingiu o pico de R$ 5.180,00 com um ROI de +38.5% para as marcas parceiras. Seu engajamento de 4.8% permite um reajuste de 15% no valor base dos seus pacotes de Reels sem perder conversão.'}
        </p>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. EXTRATO CONTÁBIL & LEDGER DE CAMPANHAS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-950">
                {isCompany ? 'Detalhamento Contábil de Contratos' : 'Extrato de Lançamento de Saldo'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Histórico de créditos liberados via SafePay Escrow com conciliação bancária.
            </p>
          </div>

          <button 
            onClick={handleExportDRE}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" /> Baixar Extrato CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-black uppercase text-slate-400 border-b border-slate-100">
                <th className="py-3.5">ID Transação</th>
                <th>Campanha / Descrição</th>
                <th>Data</th>
                <th>Formato</th>
                <th>Valor Bruto</th>
                <th>Líquido Recebido</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <tr key={t.id} className="text-xs font-bold text-slate-800 hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 font-mono font-black text-orange-600">{t.id}</td>
                  <td>{t.desc}</td>
                  <td className="text-slate-500">{t.date}</td>
                  <td className="text-slate-500">{t.type}</td>
                  <td className="font-black text-slate-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </td>
                  <td className="font-black text-emerald-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.netAmount || (t.amount * 0.85))}
                  </td>
                  <td className="text-right">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full uppercase font-black">
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
