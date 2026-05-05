'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { Home, FileText, Settings, LogOut, Menu, X, Sparkles, ShieldCheck, Store, LifeBuoy, Crown, Calendar } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Logo } from '@/components/Logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove('influnext_token', { path: '/' });
    Cookies.remove('influnext_role', { path: '/' });
    router.push('/auth/login');
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const userRole = Cookies.get('influnext_role');

  React.useEffect(() => {
    setIsAdmin(userRole === 'ADMIN');
  }, [userRole]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/influencer', icon: Home },
    { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Workspace', href: '/dashboard/workspace', icon: Sparkles, special: true },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: Store },
    { name: 'Media Kit', href: '/dashboard/settings', icon: ShieldCheck }, 
    { name: 'Contratos', href: '/dashboard/contracts', icon: FileText },
    { name: 'Plano Pro', href: '/dashboard/subscription', icon: Crown, highlight: true },
    { name: 'Suporte', href: '/dashboard/support', icon: LifeBuoy },
    ...(isAdmin ? [{ name: 'Admin', href: '/dashboard/admin', icon: ShieldCheck }] : []),
    { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080810] flex text-[#e8e0f5] font-sans selection:bg-purple-500/30 overflow-hidden">
      
      {/* Mobile Header (Hamburger) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#06040f] border-b border-[#1e1430] z-50 flex items-center justify-between px-4">
        <Logo size="sm" href="/" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar - Desktop (158px) & Mobile Overlay */}
      <aside className={`
        fixed md:static top-14 md:top-0 left-0 z-40 h-[calc(100vh-3.5rem)] md:h-screen w-[158px]
        bg-[#06040f] border-r border-[#1e1430] flex flex-col justify-between transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4">
          <div className="hidden md:flex items-center mb-8 px-2">
            <Logo size="sm" href="/" />
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isWorkspace = item.special;
              const isHighlight = (item as any).highlight;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? (isWorkspace ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-pink-400 border border-pink-500/30 shadow-[0_0_15px_-5px_rgba(219,39,119,0.3)]' : 'bg-[#1e1430] text-purple-400 border border-purple-500/20') 
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#100c1e] border border-transparent'}
                    ${isHighlight ? 'border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent' : ''}
                  `}
                >
                  {isWorkspace ? (
                    <Sparkles className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-zinc-600'}`} />
                  ) : (
                    <item.icon className={`w-4 h-4 ${isActive || isHighlight ? 'text-purple-400' : 'text-zinc-600'}`} />
                  )}
                  <span className={`text-[11px] font-bold tracking-tight ${isActive || isHighlight ? 'opacity-100' : 'opacity-80'}`}>
                    {item.name}
                    {isWorkspace && isActive && <span className="ml-1 text-[10px]">✦</span>}
                    {isHighlight && <span className="ml-2 text-[8px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">Pro</span>}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-[#1e1430] space-y-4">
          <div className="bg-[#1e1430] border border-purple-500/30 p-4 rounded-2xl space-y-3">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Plano Free</p>
                <p className="text-xs text-zinc-400 font-medium">0/3 Trends gerados</p>
             </div>
             <button 
               onClick={() => router.push('/dashboard/subscription')}
               className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black rounded-lg transition-colors"
             >
                EVOLUIR PARA PRO
             </button>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-screen pt-14 md:pt-0 overflow-y-auto bg-[#080810]">
        <div className="min-h-full">
          {isAdmin && (
            <Link href="/dashboard/admin" className="block bg-purple-600/10 hover:bg-purple-600/20 transition-colors border-b border-purple-500/20 px-6 py-2 flex items-center justify-center gap-2">
               <ShieldCheck className="w-4 h-4 text-purple-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                 ⚡ CONSOLE DO FUNDADOR: MONITORAMENTO DE MERCADO ATIVO
               </span>
            </Link>
          )}
          {children}
        </div>
      </main>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
