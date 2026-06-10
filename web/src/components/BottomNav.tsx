'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Sparkles, User, Search } from 'lucide-react';

export function BottomNav({ taskCount = 0 }: { taskCount?: number }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard/influencer', icon: Home },
    { name: 'Missões', href: '/dashboard/workspace', icon: Sparkles, badgeCount: taskCount },
    { name: 'Mídia Kit', href: '/dashboard/mediakit', icon: FileText },
    { name: 'Mercado', href: '/dashboard/marketplace', icon: Search },
    { name: 'Perfil', href: '/dashboard/settings', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d0b1a]/80 backdrop-blur-xl border-t border-white/[0.05] pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
                isActive ? 'text-purple-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-all duration-500`}>
                {isActive && (
                  <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-purple-400' : ''}`} />
                
                {/* Instagram Style Badge */}
                {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                  <div className="absolute -top-1 -right-1.5 w-2 h-2 bg-rose-600 rounded-full border border-[#0d0b1a] shadow-lg z-20 animate-pulse" />
                ) : null}

                {isActive && (item.badgeCount === undefined || item.badgeCount <= 0) ? (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse z-20" />
                ) : null}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
