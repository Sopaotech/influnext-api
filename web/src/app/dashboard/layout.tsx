'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { Home, FileText, Settings, LogOut, Menu, X, Sparkles, ShieldCheck, Store, LifeBuoy, Crown, Calendar, Search, MessageSquare, LayoutDashboard, TrendingUp, Package, Radio } from 'lucide-react';
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
  
  // Fundo dinâmico baseado no perfil - Forçado para Dark Theme Premium
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [taskCount, setTaskCount] = useState(0);
  const [isDark, setIsDark] = useState(true);

  React.useEffect(() => {
    const fetchTheme = async () => {
      try {
        const userRole = Cookies.get('influnext_role');
        const endpoint = userRole === 'COMPANY' ? '/dashboard/company' : '/dashboard/influencer';
        const res = await api.get(endpoint);
        
        if (res.data.profile?.profileImageUrl) {
          setProfileImg(res.data.profile.profileImageUrl);
        } else if (res.data.profile?.logoUrl) {
          setProfileImg(res.data.profile.logoUrl);
        }
        
        const pendingCount = res.data.tasks?.filter((t: any) => !t.isDone).length || 0;
        setTaskCount(pendingCount);

        const userState = res.data.profile?.user || res.data.userState;
        if (userState?.theme) {
          setIsDark(userState.theme === 'dark');
          Cookies.set('influnext_theme', userState.theme, { expires: 7, path: '/' });
        }

        // Verificação de Paywall para planos expirados/inativos
        if (userState && userState.role !== 'ADMIN') {
          const isExpired = userState.subscriptionStatus === 'INACTIVE' || 
            (userState.subscriptionStatus === 'TRIAL' && userState.trialEndsAt && new Date() > new Date(userState.trialEndsAt));
          
          if (isExpired && pathname !== '/dashboard/subscription' && pathname !== '/dashboard/settings') {
            router.push('/dashboard/subscription');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    };
    fetchTheme();
  }, [pathname, router]);

  const handleLogout = () => {
    Cookies.remove('influnext_token', { path: '/' });
    Cookies.remove('influnext_role', { path: '/' });
    Cookies.remove('influnext_onboarding', { path: '/' });
    window.location.href = '/auth/login';
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const userRole = Cookies.get('influnext_role');

  React.useEffect(() => {
    setIsAdmin(userRole === 'ADMIN');
  }, [userRole]);

  const homeHref = userRole === 'COMPANY' ? '/dashboard/company' : '/dashboard/influencer';

  const navItems = [
    { name: 'Home', href: homeHref, icon: Home },
    { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Área de Trabalho', href: '/dashboard/workspace', icon: LayoutDashboard, special: true, badgeCount: taskCount },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: Store },
    { name: 'Media Kit', href: '/dashboard/mediakit', icon: Sparkles }, 
    { name: 'Campanhas', href: '/dashboard/campaigns', icon: Radio },
    { name: 'Contratos', href: '/dashboard/contracts', icon: FileText },
    { name: 'Recebidos', href: '/dashboard/recebidos', icon: Package },
    { name: 'Relatórios', href: '/dashboard/reports', icon: TrendingUp },
    { name: 'Assistente', href: '/dashboard/support', icon: MessageSquare },
    ...(isAdmin ? [{ name: 'Admin Control', href: '/dashboard/admin', icon: ShieldCheck }] : []),
    { name: 'Ajustes', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen relative flex font-sans selection:bg-slate-900/10 overflow-hidden transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Background Layer - Solid Slate base */}
      <div className={`fixed inset-0 z-0 transition-colors duration-500 ${isDark ? 'bg-[#050508]' : 'bg-[#f8fafc]'}`} />
      
      {/* Premium Atmospheric Background Glows & Subtle Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Main orange/orange glow — top center */}
        <div className={`absolute top-[-15%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[130px] transition-all duration-500 ${isDark ? 'bg-orange-600/10' : 'bg-orange-500/5'}`} />
        {/* Pink/orange accent — bottom right */}
        <div className={`absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[110px] transition-all duration-500 ${isDark ? 'bg-pink-600/6' : 'bg-orange-500/3'}`} />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Mobile Header - Glass */}
      <header className={`md:hidden fixed top-0 left-0 right-0 z-[100] border-b p-4 flex items-center justify-between transition-all duration-500 ${isDark ? 'bg-black/45 backdrop-blur-xl border-white/5' : 'bg-white/70 backdrop-blur-xl border-slate-200'}`}>
        <Logo size="sm" href={homeHref} variant={isDark ? "light" : "dark"} />
        <div className="flex items-center gap-3">
           <Link href="/dashboard/settings" className="w-8 h-8 rounded-full border border-white/20 p-0.5 block hover:scale-110 transition-transform">
             <div className={`w-full h-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-white/20'}`}>
               <img src={profileImg || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User Profile" className="w-full h-full object-cover" />
             </div>
           </Link>
        </div>
      </header>

      {/* Sidebar - Glassmorphism */}
      <aside 
        className={`hidden md:flex relative z-10 h-screen w-[220px] border-r flex flex-col justify-between shadow-sm transition-all duration-500 ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-slate-200 text-slate-800'}`}
        style={{ backdropFilter: 'blur(30px)' }}
      >
        <div className="p-8">
          <div className="hidden md:flex items-center mb-12 px-2">
            <Logo size="sm" href={homeHref} variant={isDark ? "light" : "dark"} />
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
                      ? (isDark ? 'bg-white text-slate-950 shadow-lg' : 'bg-orange-600 text-white shadow-lg shadow-orange-500/10') 
                      : (isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:bg-orange-500/5 hover:text-orange-600')}
                  `}
                >
                  {isActive ? (
                    <item.icon className={`w-4 h-4 ${isDark ? 'text-slate-950' : 'text-white'}`} />
                  ) : (
                    <div className="relative">
                      <item.icon className={`w-4 h-4 ${isDark ? 'text-zinc-400 group-hover:text-white' : 'text-slate-400 group-hover:text-orange-600'}`} />
                      {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-600 rounded-full border border-slate-950 shadow-sm animate-pulse" />
                      ) : null}
                    </div>
                  )}
                  
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-sm ${isActive ? 'opacity-100' : `opacity-80 group-hover:opacity-100 ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}`}>
                    {item.name}
                  </span>

                  {/* Badge redundante para destaque visual no modo Ativo, se necessário */}
                  {isActive && item.badgeCount !== undefined && item.badgeCount > 0 ? (
                    <span className="absolute top-2 right-4 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className={`p-8 border-t space-y-8 transition-colors duration-500 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all group ${isDark ? 'text-zinc-400 hover:text-rose-500' : 'text-slate-400 hover:text-rose-600'}`}
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
            <Link href="/dashboard/admin" className="block w-full py-2.5 bg-gradient-to-r from-orange-900/30 via-pink-950/10 to-orange-900/30 border-b border-orange-500/10 hover:from-orange-900/50 hover:to-orange-900/50 transition-all text-center">
               <span className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-orange-300 uppercase tracking-[0.3em]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Painel de Controle Admin
               </span>
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

      <Toaster theme={isDark ? 'dark' : 'light'} position="bottom-right" />
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>
    </div>
  );
}

