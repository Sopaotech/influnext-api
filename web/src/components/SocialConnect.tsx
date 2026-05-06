"use client";
import React from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, CheckCircle2, Instagram, Youtube } from 'lucide-react';

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
          icon: Instagram,
          color: 'text-pink-600', 
          bg: 'bg-pink-50',
          border: 'group-hover:border-pink-200'
        };
      case 'TIKTOK':
        return { 
          name: 'TikTok', 
          icon: () => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.153 0 .3.013.443.037v-3.468a6.34 6.34 0 0 0-.443-.016 6.341 6.341 0 1 0 6.341 6.341V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686z" fill="currentColor" />
            </svg>
          ),
          color: 'text-slate-900', 
          bg: 'bg-slate-100',
          border: 'group-hover:border-slate-300'
        };
      case 'YOUTUBE':
        return { 
          name: 'YouTube', 
          icon: Youtube,
          color: 'text-red-600', 
          bg: 'bg-red-50',
          border: 'group-hover:border-red-200'
        };
      default:
        return { name: platform, icon: Plus, color: 'text-slate-600', bg: 'bg-slate-50', border: '' };
    }
  };

  const Card = ({ acc }: { acc: SocialAccount }) => {
    const details = getPlatformDetails(acc.platform);
    const Icon = details.icon;
    
    return (
      <div 
        key={acc.platform}
        className={`min-w-[180px] p-5 rounded-2xl bg-white border transition-all group flex flex-col items-center gap-4 text-center ${
          acc.connected ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100 ' + details.border
        } hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1`}
      >
        <div className={`p-4 ${details.bg} ${details.color} rounded-2xl group-hover:scale-110 transition-transform shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">{details.name}</h4>
          <p className={`text-[10px] font-medium tracking-wide ${acc.connected ? 'text-purple-600' : 'text-slate-400'}`}>
            {acc.connected ? `@${acc.username}` : 'Não vinculado'}
          </p>
        </div>
        <button 
          onClick={() => !acc.connected && handleConnect(acc.platform)}
          className={`w-full py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all ${
          acc.connected 
          ? 'bg-white text-purple-600 border border-purple-100 shadow-sm cursor-default' 
          : 'bg-slate-900 text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-200'
        }`}>
          {acc.connected ? (
            <span className="flex items-center justify-center gap-2">Vinculado <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /></span>
          ) : (
            <span className="flex items-center justify-center gap-2">Conectar <Plus className="w-3.5 h-3.5" /></span>
          )}
        </button>
      </div>
    );
  }

  if (isHorizontal) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar">
        {accounts.map((acc) => <Card key={acc.platform} acc={acc} />)}
      </div>
    );
  }

  return (
    <section className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-600">Redes Sociais</h3>
           <p className="text-sm font-medium text-slate-500">Conecte suas fontes de dados para a IA analisar seu potencial.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {accounts.map((acc) => <Card key={acc.platform} acc={acc} />)}
      </div>
    </section>
  );
}
