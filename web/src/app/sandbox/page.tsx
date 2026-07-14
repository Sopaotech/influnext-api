'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  TrendingUp, 
  Settings, 
  Layout, 
  CheckCircle2,
  BrainCircuit,
  DollarSign,
  ChevronRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';

const BACKGROUNDS = [
  { id: 'clean-silk', name: 'Bege Silk', url: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=2670&auto=format&fit=crop' },
  { id: 'soft-floral', name: 'Soft Floral', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2670&auto=format&fit=crop' },
  { id: 'luxury-minimal', name: 'Luxury White', url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2674&auto=format&fit=crop' },
  { id: 'pastel-zen', name: 'Pastel Zen', url: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?q=80&w=2529&auto=format&fit=crop' },
  { id: 'glass-dark', name: 'Midnight', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' },
];

export default function SandboxPage() {
  const [activeBg, setActiveBg] = useState(BACKGROUNDS[0]);
  const [blurAmount, setBlurAmount] = useState(30);

  return (
    <div className="fixed inset-0 overflow-hidden font-sans selection:bg-slate-900/10">
      {/* Dynamic Background Layer */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${activeBg.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: 'scale(1.05)',
        }}
      />
      
      {/* Subtle Light Overlay */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Main Glass Layout */}
      <div className="relative h-full flex p-4 md:p-10 gap-10">
        
        {/* Floating Sidebar - Ultra Minimal */}
        <aside 
          className="hidden md:flex flex-col w-20 bg-white/5 rounded-[2.5rem] border border-white/10 items-center py-12 gap-10 shadow-sm"
          style={{ backdropFilter: `blur(${blurAmount}px)` }}
        >
          <div className="w-10 h-10 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <nav className="flex flex-col gap-8">
            <SidebarIcon icon={Layout} active />
            <SidebarIcon icon={Calendar} />
            <SidebarIcon icon={Users} />
            <SidebarIcon icon={TrendingUp} />
            <SidebarIcon icon={BrainCircuit} />
            <SidebarIcon icon={Settings} />
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-10 overflow-hidden">
          
          {/* Header - Glass Bar Minimal */}
          <header 
            className="h-20 bg-white/5 rounded-[2.5rem] border border-white/10 px-12 flex items-center justify-between"
            style={{ backdropFilter: `blur(${blurAmount}px)` }}
          >
            <div>
              <h1 className="text-slate-900 font-medium text-xl tracking-tight leading-none mb-1">InfluNext</h1>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.4em]">Dashboard Aesthetic</p>
            </div>
            
            <div className="flex items-center gap-10">
              {/* Background Picker Minimal */}
              <div className="flex gap-3">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setActiveBg(bg)}
                    className={`w-6 h-6 rounded-full transition-all duration-500 border-2 ${activeBg.id === bg.id ? 'border-slate-900 scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                  >
                    <div 
                      className="w-full h-full rounded-full" 
                      style={{ backgroundImage: `url(${bg.url})`, backgroundSize: 'cover' }}
                    />
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4 border-l border-slate-200 pl-10">
                <Link href="/dashboard/influencer" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                  Sair do Teste
                </Link>
                <div className="w-10 h-10 rounded-full border border-slate-100 p-0.5">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" className="rounded-full bg-slate-50" />
                </div>
              </div>
            </div>
          </header>

          {/* Grid de Widgets Minimal */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-10 overflow-y-auto pr-2 custom-scrollbar pb-10">
            
            {/* Widget de Performance - Super Clean */}
            <section 
              className="md:col-span-8 bg-white/20 rounded-[3rem] border border-white/20 p-12 flex flex-col justify-between shadow-sm relative overflow-hidden"
              style={{ backdropFilter: `blur(${blurAmount}px)` }}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                   <div>
                      <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">Total Reach</h2>
                      <div className="flex items-baseline gap-4">
                        <span className="text-slate-900 text-6xl font-black tracking-tighter">1.2M</span>
                        <span className="text-slate-400 text-xs font-bold">+5.2k this week</span>
                      </div>
                   </div>
                </div>
                
                {/* Visual Data Representation - Minimal Bars */}
                <div className="h-40 flex items-end gap-6 px-2">
                  {[30, 45, 35, 60, 85, 40, 95, 70, 80, 50, 90, 100].map((h, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-slate-900/5 rounded-full transition-all duration-1000 hover:bg-slate-900/20 cursor-pointer relative"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Widget de IA - Clean Sidebar */}
            <section 
              className="md:col-span-4 bg-white/20 rounded-[3rem] border border-white/20 p-10 flex flex-col gap-10 shadow-sm"
              style={{ backdropFilter: `blur(${blurAmount}px)` }}
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                   <BrainCircuit className="w-5 h-5" />
                 </div>
                 <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-[0.3em]">AI Advice</h3>
              </div>
              
              <div className="space-y-8">
                <p className="text-slate-600 text-sm leading-relaxed font-light">
                   "Your <span className="text-slate-900 font-bold">Aesthetic Minimal</span> content is performing 3x better than usual. Keep the soft lighting."
                </p>
                <div className="space-y-4">
                  <TaskItem label="Update Media Kit" />
                  <TaskItem label="Finalize Vogue Proposal" />
                  <TaskItem label="Upload Story (09:00)" completed />
                </div>
              </div>
            </section>

            {/* Wallet Widget Minimal */}
            <section 
              className="md:col-span-4 bg-white/20 rounded-[3rem] border border-white/20 p-10 flex items-center justify-between"
              style={{ backdropFilter: `blur(${blurAmount}px)` }}
            >
              <div>
                 <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Available</p>
                 <p className="text-slate-900 text-3xl font-black tracking-tight">R$ 14.200</p>
              </div>
              <div className="w-12 h-12 bg-slate-900/5 rounded-2xl flex items-center justify-center border border-slate-900/5">
                <DollarSign className="text-slate-900 w-5 h-5" />
              </div>
            </section>

            {/* Ranking Widget Minimal */}
            <section 
              className="md:col-span-8 bg-white/20 rounded-[3rem] border border-white/20 p-10"
              style={{ backdropFilter: `blur(${blurAmount}px)` }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.4em]">Creators Network</h3>
              </div>
              
              <div className="flex gap-10 overflow-x-auto pb-4 custom-scrollbar">
                <RankItem seed="Felix" name="Felix" rank={1} />
                <RankItem seed="Alex" name="You" rank={2} active />
                <RankItem seed="Luna" name="Luna" rank={3} />
                <RankItem seed="Leo" name="Leo" rank={4} />
                <RankItem seed="Mya" name="Mya" rank={5} />
              </div>
            </section>

          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>
    </div>
  );
}

function SidebarIcon({ icon: Icon, active = false }: { icon: any, active?: boolean }) {
  return (
    <button className={`w-12 h-12 rounded-2xl transition-all duration-500 flex items-center justify-center ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-300 hover:text-slate-900'}`}>
      <Icon className="w-5 h-5" />
    </button>
  );
}

function TaskItem({ label, completed = false }: { label: string, completed?: boolean }) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      <div className={`w-5 h-5 rounded-lg border transition-all ${completed ? 'bg-slate-900 border-slate-900' : 'border-slate-200 group-hover:border-slate-900'}`}>
        {completed && <CheckCircle2 className="text-white w-3 h-3 m-auto mt-0.5" />}
      </div>
      <span className={`text-[11px] font-medium transition-all ${completed ? 'text-slate-300 line-through' : 'text-slate-600 group-hover:text-slate-900'}`}>
        {label}
      </span>
    </div>
  );
}

function RankItem({ seed, name, rank, active = false }: { seed: string, name: string, rank: number, active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 min-w-[60px]">
      <div className="relative">
        <div className={`w-14 h-14 rounded-full p-0.5 transition-all duration-500 ${active ? 'ring-2 ring-slate-900' : 'opacity-40 hover:opacity-100'}`}>
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} className="rounded-full bg-slate-100 w-full h-full" />
        </div>
      </div>
      <p className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-400'}`}>{name}</p>
    </div>
  );
}
