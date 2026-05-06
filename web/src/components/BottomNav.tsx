'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Sparkles, User, Search } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard/influencer', icon: Home },
    { name: 'Missões', href: '/dashboard/workspace', icon: Sparkles },
    { name: 'Contratos', href: '/dashboard/contracts', icon: FileText },
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
              <div className={`relative ${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-pulse" />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
