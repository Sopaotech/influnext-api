"use client";
import React from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, CheckCircle2 } from 'lucide-react';

interface SocialAccount {
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
  connected: boolean;
  username?: string;
}

interface SocialConnectProps {
  isHorizontal?: boolean;
  connectedPlatforms?: any[];
}

export function SocialConnect({ isHorizontal = false, connectedPlatforms = [] }: SocialConnectProps) {
  const handleConnect = async (platform: string) => {
    try {
      const { data } = await api.get('/auth/social/urls');
      const url = data[platform.toLowerCase()];
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      toast.error('Erro ao iniciar conexão social.');
    }
  };

  const platforms: ('INSTAGRAM' | 'TIKTOK' | 'YOUTUBE')[] = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE'];
  
  const accounts: SocialAccount[] = platforms.map(p => {
    const connected = connectedPlatforms.find(cp => cp.platformName === p);
    return {
      platform: p,
      connected: !!connected,
      username: connected?.username
    };
  });

  const getPlatformDetails = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return { 
          name: 'Instagram', 
          icon: () => (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="url(#ig-grad)" />
              <path fillRule="evenodd" clipRule="evenodd" d="M2 6.701C2 3.994 3.994 2 6.701 2H17.299C20.006 2 22 3.994 22 6.701V17.299C22 20.006 20.006 22 17.299 22H6.701C3.994 22 2 20.006 2 17.299V6.701ZM12 7C9.239 7 7 9.239 7 12C7 14.761 9.239 17 12 17C14.761 17 17 14.761 17 12C17 9.239 14.761 7 12 7ZM17.25 5.5C17.25 6.19 17.81 6.75 18.5 6.75C19.19 6.75 19.75 6.19 19.75 5.5C19.75 4.81 19.19 4.25 18.5 4.25C17.81 4.25 17.25 4.81 17.25 5.5Z" fill="url(#ig-grad)" />
              <defs>
                <linearGradient id="ig-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#405DE6" />
                  <stop offset="0.25" stopColor="#5851DB" />
                  <stop offset="0.5" stopColor="#833AB4" />
                  <stop offset="0.75" stopColor="#C13584" />
                  <stop offset="1" stopColor="#F56040" />
                </linearGradient>
              </defs>
            </svg>
          ),
          color: 'text-pink-500', 
          bg: 'bg-pink-500/10',
          border: 'hover:border-pink-500/30'
        };
      case 'TIKTOK':
        return { 
          name: 'TikTok', 
          icon: () => (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.153 0 .3.013.443.037v-3.468a6.34 6.34 0 0 0-.443-.016 6.341 6.341 0 1 0 6.341 6.341V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686z" fill="#FE2C55" />
              <path d="M12.374 15.672V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.153 0 .3.013.443.037v-3.468a6.34 6.34 0 0 0-.443-.016 6.341 6.341 0 1 0 6.341 6.341V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686a4.793 4.793 0 0 1-3.77-4.245h-.1z" fill="white" />
              <path d="M12.374 15.672a2.891 2.891 0 0 1-2.891 2.891v3.445a6.336 6.336 0 0 0 6.341-6.336V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686a4.793 4.793 0 0 1-3.77-4.245h-3.945v13.231z" fill="#25F4EE" />
            </svg>
          ),
          color: 'text-white', 
          bg: 'bg-black/40',
          border: 'hover:border-cyan-500/30'
        };
      case 'YOUTUBE':
        return { 
          name: 'YouTube', 
          icon: () => (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#FF0000" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          ),
          color: 'text-white', 
          bg: 'bg-red-500/10',
          border: 'hover:border-red-500/30'
        };
      default:
        return { name: platform, icon: () => null, color: 'text-white', bg: 'bg-white/10', border: '' };
    }
  };

  const Card = ({ acc }: { acc: SocialAccount }) => {
    const details = getPlatformDetails(acc.platform);
    return (
      <div 
        key={acc.platform}
        className={`min-w-[200px] snap-center p-5 rounded-2xl bg-white/[0.02] border transition-all group relative overflow-hidden flex flex-col items-center gap-4 text-center ${
          acc.connected ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.05] ' + details.border
        }`}
      >
        <div className={`p-4 ${details.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
          <details.icon />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white uppercase tracking-widest">{details.name}</h4>
          <p className={`text-[9px] font-black uppercase tracking-widest ${acc.connected ? 'text-emerald-400' : 'text-zinc-600'}`}>
            {acc.connected ? `@${acc.username}` : 'DESCONECTADO'}
          </p>
        </div>
        <button 
          onClick={() => !acc.connected && handleConnect(acc.platform)}
          className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          acc.connected 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default' 
          : 'bg-white text-black hover:bg-zinc-200'
        }`}>
          {acc.connected ? (
            <span className="flex items-center justify-center gap-2 italic">ATIVO <CheckCircle2 className="w-3 h-3" /></span>
          ) : (
            <span className="flex items-center justify-center gap-2">CONECTAR <Plus className="w-3 h-3" /></span>
          )}
        </button>
      </div>
    );
  }

  if (isHorizontal) {
    return (
      <>
        {accounts.map((acc) => <Card key={acc.platform} acc={acc} />)}
      </>
    );
  }

  return (
    <section className="bg-[#0d0b1a] border border-white/[0.05] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Radar_Social</h3>
           <p className="text-xs font-bold text-zinc-400">Contas vinculadas para análise em tempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {accounts.map((acc) => <Card key={acc.platform} acc={acc} />)}
      </div>
    </section>
  );
}
