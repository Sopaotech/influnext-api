'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { Home, FileText, Settings, LogOut, Menu, X, Sparkles, ShieldCheck, Store, LifeBuoy, Crown, Calendar, Search, MessageSquare, LayoutDashboard, TrendingUp } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Logo } from '@/components/Logo';
import dynamic from 'next/dynamic';

const BottomNav = dynamic(
  () => import('@/components/BottomNav').then(mod => mod.BottomNav),
  { ssr: false }
);

import { api } from '@/lib/api';
import { BACKGROUNDS } from '@/lib/constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Fundo dinâmico baseado no perfil
  const [bgUrl, setBgUrl] = useState(BACKGROUNDS[0].url);
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [taskCount, setTaskCount] = useState(0);

  React.useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await api.get('/dashboard/influencer');
        // Usar userState.theme que agora retornamos na API
        const userTheme = res.data.userState?.theme;
        if (userTheme && userTheme.startsWith('http')) {
          setBgUrl(userTheme);
        }
        if (res.data.profile?.profileImageUrl) {
          setProfileImg(res.data.profile.profileImageUrl);
        }
        // Buscar count de tasks pendentes
        const pendingCount = res.data.tasks?.filter((t: any) => !t.isDone).length || 0;
        setTaskCount(pendingCount);
      } catch (err) {
        console.error('Erro ao carregar tema:', err);
      }
    };
    fetchTheme();
    
    // Escutar por mudanças de tema via evento customizado (para SettingsPage)
    const handleThemeUpdate = (e: any) => {
      if (e.detail?.theme) setBgUrl(e.detail.theme);
    };
    window.addEventListener('theme-updated', handleThemeUpdate);
    return () => window.removeEventListener('theme-updated', handleThemeUpdate);
  }, []);

  const handleLogout = () => {
    // Força a remoção de cookies sem depender de domínio exato que pode falhar em dev vs prod
    Cookies.remove('influnext_token', { path: '/' });
    Cookies.remove('influnext_role', { path: '/' });
    Cookies.remove('influnext_onboarding', { path: '/' });
    
    // Hard redirect para limpar estado do React
    window.location.href = '/auth/login';
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const userRole = Cookies.get('influnext_role');

  React.useEffect(() => {
    setIsAdmin(userRole === 'ADMIN');
  }, [userRole]);

  const navItems = [
    { name: 'Home', href: '/dashboard/influencer', icon: Home },
    { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Workspace', href: '/dashboard/workspace', icon: LayoutDashboard, special: true, badgeCount: taskCount },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: Store },
    { name: 'Media Kit', href: '/dashboard/mediakit', icon: Sparkles }, 
    { name: 'Contratos', href: '/dashboard/contracts', icon: FileText },
    { name: 'Relatórios', href: '/dashboard/reports', icon: TrendingUp },
    { name: 'Assistente', href: '/dashboard/support', icon: MessageSquare },
    ...(isAdmin ? [{ name: 'Admin Control', href: '/dashboard/admin', icon: ShieldCheck }] : []),
    { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen relative flex text-slate-900 font-sans selection:bg-slate-900/10 overflow-hidden">
      
      {/* Background Layer - Dinâmico */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-1000 ease-in-out scale-105"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Overlay para suavizar o fundo e garantir contraste - Glassmorphism Adaptativo */}
      <div className="fixed inset-0 z-0 bg-white/10 backdrop-blur-[2px]" />
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-white/20 via-transparent to-white/20" />
      <div className="fixed inset-0 z-0 shadow-[inset_0_0_200px_rgba(255,255,255,0.2)] pointer-events-none" />

      {/* Mobile Header - Glass */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-white/5 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <Logo size="sm" href="/dashboard/influencer" textColor="text-white" />
        <div className="flex items-center gap-3">
           <Link href="/dashboard/settings" className="w-8 h-8 rounded-full border border-white/20 p-0.5 block hover:scale-110 transition-transform">
             <div className="w-full h-full rounded-full bg-white/20 overflow-hidden">
               <img src={profileImg || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User Profile" className="w-full h-full object-cover" />
             </div>
           </Link>
        </div>
      </header>

      {/* Sidebar - Glassmorphism */}
      <aside 
        className="hidden md:flex relative z-10 h-screen w-[220px] bg-white/5 border-r border-white/10 flex flex-col justify-between shadow-sm"
        style={{ backdropFilter: 'blur(30px)' }}
      >
        <div className="p-8">
          <div className="hidden md:flex items-center mb-12 px-2">
            <Logo size="sm" href="/dashboard/influencer" textColor="text-white" />
          </div>
          
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500 group relative
                    ${isActive 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/10'}
                  `}
                >
                  {isActive ? (
                    <item.icon className="w-4 h-4 text-white" />
                  ) : (
                    <div className="relative">
                      <item.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                      {item.badgeCount && item.badgeCount > 0 && (
                        <div className="absolute -top-2 -right-2 min-w-[14px] h-[14px] px-1 bg-rose-600 rounded-full flex items-center justify-center border-2 border-white/50 shadow-sm">
                          <span className="text-[7px] text-white font-black leading-none">{item.badgeCount}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-sm ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100 text-slate-600'}`}>
                    {item.name}
                  </span>

                  {/* Badge redundante para destaque visual no modo Ativo, se necessário */}
                  {isActive && item.badgeCount && item.badgeCount > 0 && (
                    <span className="absolute top-2 right-4 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-8 border-t border-white/5 space-y-8">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-rose-600 transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area - Glass/Transparent */}
      <main className="flex-1 relative z-10 w-full h-screen pt-16 md:pt-0 overflow-y-auto custom-scrollbar">
        <div className="min-h-full">
          {isAdmin && (
            <Link href="/dashboard/admin" className="block bg-slate-900 text-white px-6 py-2 flex items-center justify-center gap-2">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.25em]">Painel Admin</span>
            </Link>
          )}
          <div className="p-4 md:p-10">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <BottomNav taskCount={taskCount} />
      </div>

      <Toaster theme="light" position="bottom-right" />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>
    </div>
  );
}

