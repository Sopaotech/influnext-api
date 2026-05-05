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
    const cookieOptions: Cookies.CookieAttributes = {
      path: '/',
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    Cookies.remove('influnext_token', cookieOptions);
    Cookies.remove('influnext_role', cookieOptions);
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

  return (    <div className="min-h-screen bg-[#050508] flex text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      
      {/* Mobile Header (Hamburger) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050508]/80 backdrop-blur-xl border-b border-white/[0.04] z-50 flex items-center justify-between px-6">
        <Logo size="sm" href="/" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400 p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar - Desktop (180px) & Mobile Overlay */}
      <aside className={`
        fixed md:static top-16 md:top-0 left-0 z-40 h-[calc(100vh-4rem)] md:h-screen w-[180px]
        bg-[#050508] border-r border-white/[0.04] flex flex-col justify-between transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="hidden md:flex items-center mb-10 px-2">
            <Logo size="sm" href="/" />
          </div>
          
          <nav className="space-y-1.5">
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
                    flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-500 group relative overflow-hidden
                    ${isActive 
                      ? (isWorkspace ? 'bg-white/[0.05] text-purple-400 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'bg-white/[0.05] text-white border border-white/[0.08]') 
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'}
                    ${isHighlight ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20' : ''}
                  `}
                >
                  <item.icon className={`w-4 h-4 transition-colors duration-500 ${isActive || isHighlight ? 'text-purple-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                  <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${isActive || isHighlight ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`}>
                    {item.name}
                  </span>
                  {isHighlight && (
                    <div className="absolute top-0 right-0 p-1">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6 border-t border-white/[0.04] space-y-6">
          <div className="relative group cursor-pointer" onClick={() => router.push('/dashboard/subscription')}>
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative bg-[#0d0b18] border border-white/[0.08] p-4 rounded-2xl space-y-3">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Plano Free</p>
                  <p className="text-[11px] text-zinc-500 font-bold">0/3 Insights Ativos</p>
               </div>
               <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                 <div className="h-full w-1/3 bg-purple-500 rounded-full" />
               </div>
               <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">Evoluir para Pro →</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-rose-500 transition-all group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-screen pt-14 md:pt-0 overflow-y-auto bg-[#050508]">
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
