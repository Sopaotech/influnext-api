'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { Home, FileText, Settings, LogOut, Menu, X, Sparkles, ShieldCheck, Store, LifeBuoy, Crown, Calendar, Search } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Logo } from '@/components/Logo';
import { BottomNav } from '@/components/BottomNav';

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
    { name: 'Área de Trabalho', href: '/dashboard/workspace', icon: Sparkles, special: true },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: Store },
    { name: 'Media Kit', href: '/dashboard/settings', icon: ShieldCheck }, 
    { name: 'Contratos', href: '/dashboard/contracts', icon: FileText },
    { name: 'Plano Pro', href: '/dashboard/subscription', icon: Crown, highlight: true },
    { name: 'Seu Assistente', href: '/dashboard/support', icon: MessageSquare },
    ...(isAdmin ? [{ name: 'Admin', href: '/dashboard/admin', icon: ShieldCheck }] : []),
    { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
  ];
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans selection:bg-purple-100 overflow-hidden selection:text-purple-900">
      
      {/* Mobile Header - Ultra Premium Light */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 flex items-center justify-between">
        <Logo size="sm" href="/dashboard/influencer" />
        <div className="flex items-center gap-3">
           <button className="p-2 rounded-xl bg-slate-50 text-slate-400">
             <Search className="w-4 h-4" />
           </button>
           <div className="w-8 h-8 rounded-full border border-purple-200 p-0.5 bg-gradient-to-tr from-purple-500 to-indigo-500">
             <div className="w-full h-full rounded-full bg-white overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
             </div>
           </div>
        </div>
      </header>

      {/* Sidebar - Desktop Only - Sharp White */}
      <aside className={`
        hidden md:flex static h-screen w-[200px]
        bg-white border-r border-slate-100 flex flex-col justify-between shadow-sm
      `}>
        <div className="p-8">
          <div className="hidden md:flex items-center mb-12 px-2">
            <Logo size="sm" href="/dashboard/influencer" />
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
                      ? (isWorkspace ? 'bg-purple-50 text-purple-600 border border-purple-100 shadow-sm' : 'bg-slate-50 text-slate-900 border border-slate-100') 
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent'}
                    ${isHighlight ? 'bg-purple-50/50 border-purple-100 text-purple-600' : ''}
                  `}
                >
                  <item.icon className={`w-4 h-4 transition-colors duration-500 ${isActive || isHighlight ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-900'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive || isHighlight ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`}>
                    {item.name}
                  </span>
                  {isHighlight && (
                    <div className="absolute top-0 right-0 p-1">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-8 border-t border-slate-50 space-y-8">
          <div className="relative group cursor-pointer px-2" onClick={() => {
            setIsMobileMenuOpen(false);
            router.push('/dashboard/subscription');
          }}>
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative bg-white border border-slate-100 p-5 rounded-2xl space-y-4 shadow-sm">
               <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">Plano Free</p>
                    <Crown className="w-3 h-3 text-purple-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 font-bold">Uso de IA: 33%</p>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full w-1/3 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" />
               </div>
               <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">Evoluir para Pro →</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleLogout();
            }} 
            className="w-full flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-600 transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Desconectar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-screen pt-16 md:pt-0 overflow-y-auto bg-slate-50">
        <div className="min-h-full">
          {isAdmin && (
            <Link href="/dashboard/admin" className="block bg-purple-600 text-white hover:bg-purple-700 transition-all border-b border-purple-700 px-6 py-2 flex items-center justify-center gap-2">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.25em]">
                 ⚡ Painel de Controle Administrativo
               </span>
            </Link>
          )}
          <div className="p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <BottomNav />

      <Toaster theme="light" position="bottom-right" />
    </div>
  );
}
