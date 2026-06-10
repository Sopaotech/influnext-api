"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  User, 
  Camera, 
  AtSign, 
  Tag, 
  FileText, 
  Shield, 
  Zap, 
  Sparkles,
  Globe, 
  Palette,
  CreditCard,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { BACKGROUNDS } from '@/lib/constants';
import Cookies from 'js-cookie';

// Helper function to compress images before upload
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No context');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject('Image load error');
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject('File read error');
    reader.readAsDataURL(file);
  });
};

export default function SettingsPage() {
  const role = typeof window !== 'undefined' ? Cookies.get('influnext_role') : null;
  const isCompany = role === 'COMPANY';

  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0].url);
  const [accentColor, setAccentColor] = useState('#a855f7');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [authUrls, setAuthUrls] = useState<any>(null);
  const [showAllBgs, setShowAllBgs] = useState(false);
  
  const [igUsername, setIgUsername] = useState('');
  const [ttUsername, setTtUsername] = useState('');
  const [ytUsername, setYtUsername] = useState('');
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const handleSimulateSync = async (platform: string, username: string) => {
    if (!username.trim()) {
      toast.error('Por favor, informe seu nome de usuário.');
      return;
    }
    setConnectingPlatform(platform);
    try {
      const res = await api.post('/integrations/simulate', { platform, username });
      if (res.data.success) {
        toast.success(`✦ ${platform} conectado por busca direta!`);
        await fetchIntegrations();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao conectar perfil.');
    } finally {
      setConnectingPlatform(null);
    }
  };

  useEffect(() => {
    const init = async () => {
       await Promise.all([
          fetchProfile(),
          fetchRateCard(),
          fetchIntegrations()
       ]);
       setLoading(false);
    };
    init();

    // Check for callback status in URL
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const platform = params.get('platform');
    const error = params.get('error');

    if (status === 'success') {
      toast.success(`✦ ${platform?.toUpperCase()} conectado com sucesso!`, {
        description: 'Seus dados e métricas já estão sendo processados.',
        duration: 5000
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'error') {
      toast.error('Falha na conexão social', {
        description: error === 'no_business_account' 
          ? 'Não encontramos uma conta do Instagram Business vinculada à sua página.'
          : 'Ocorreu um erro ao processar a autenticação.',
        duration: 5000
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const endpoint = isCompany ? '/dashboard/company' : '/dashboard/influencer';
      const res = await api.get(endpoint); 
      setProfile(res.data.profile);
      if (res.data.userState?.theme) {
        const theme = res.data.userState.theme;
        if (theme === 'light' || theme === 'default') {
          setSelectedBg('#ffffff');
        } else if (theme === 'dark') {
          setSelectedBg('#09090b');
        } else {
          setSelectedBg(theme);
        }
      }
      if (res.data.userState?.accentColor) setAccentColor(res.data.userState.accentColor);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        toast.error('Erro ao carregar dados do perfil');
      }
    }
  };

  const fetchRateCard = async () => {
    try {
      const res = await api.get('/influencers/rate-card');
      setRateCards(res.data);
    } catch (err) {
      console.error('Erro ao buscar rate card:', err);
    }
  };

  const fetchIntegrations = async () => {
    try {
      if (isCompany) return;
      const [connRes, urlsRes] = await Promise.all([
        api.get('/integrations/connected'),
        api.get('/integrations/urls')
      ]);
      setConnectedPlatforms(connRes.data.platforms || []);
      setAuthUrls(urlsRes.data);
    } catch (err) {
      console.error('Erro ao buscar integrações:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        theme: selectedBg,
        accentColor,
        bio: profile.bio || null,
        city: profile.city || null,
        state: profile.state || null,
      };

      if (isCompany) {
        payload.companyName = profile.companyName || profile.handle;
        payload.segment = profile.segment || profile.niche;
        payload.logoUrl = profile.logoUrl || profile.profileImageUrl || null;
        payload.taxId = profile.taxId || null;
        payload.employeeCount = profile.employeeCount || null;
        payload.campaignBudget = profile.campaignBudget || null;
      } else {
        payload.handle = profile.handle;
        payload.niche = profile.niche;
        payload.profileImageUrl = profile.profileImageUrl || null;
      }

      await api.patch('/influencers/profile', payload);

      if (rateCards.length > 0) {
        await api.post('/influencers/rate-card', rateCards);
      }

      toast.success('✦ Ajustes sincronizados com sucesso!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao salvar alterações.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = (url: string) => {
     if (!url) {
        toast.error('Configuração de API pendente no servidor.');
        return;
     }
     window.location.href = url;
  };

  const isDark = true;

  if (loading) {
    return (
      <div className="p-10 space-y-10 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 dark:bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="h-96 bg-slate-200 dark:bg-white/5 rounded-[2.5rem]" />
           <div className="h-96 bg-slate-200 dark:bg-white/5 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-12 animate-in fade-in duration-1000 pb-20">
      
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-200 dark:border-white/10 pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-1.5 w-12 bg-purple-600 rounded-full" />
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em]">Studio Control Center</span>
          </div>
          <h1 className={`text-4xl md:text-7xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Personalize seu <span className="text-purple-600 font-medium italic">Espaço</span>
          </h1>
        </div>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Profile & Rate Card */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Identity Card */}
          <section className={`border rounded-[3rem] p-8 md:p-10 space-y-10 transition-all duration-500 ${
            isDark ? 'bg-black/35 border-white/5 shadow-2xl' : 'bg-white border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)]'
          }`} style={isDark ? { backdropFilter: 'blur(30px)' } : undefined}>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group/avatar">
                <div className={`w-32 h-32 rounded-full border-4 overflow-hidden shadow-2xl transition-all group-hover/avatar:scale-105 ${
                  isDark ? 'bg-slate-900 border-white/20' : 'bg-slate-100 border-slate-200'
                }`}>
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200/50">
                       <User size={50} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-3 bg-purple-600 text-white rounded-full shadow-xl cursor-pointer hover:bg-purple-500 transition-colors">
                  <Camera size={16} />
                  <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" className="hidden" onChange={async (e) => {
                     const file = e.target.files?.[0];
                     if (!file) return;
                     try {
                       toast.loading('Otimizando imagem...', { id: 'img-upload' });
                       const base64Url = await compressImage(file, 800, 0.8);
                       setProfile({ ...profile, profileImageUrl: base64Url });
                       await api.patch('/influencers/profile', { profileImageUrl: base64Url });
                       toast.success('✦ Foto de perfil atualizada!', { id: 'img-upload' });
                     } catch (err) {
                       toast.error('Erro ao salvar foto no servidor', { id: 'img-upload' });
                     }
                  }} />
                </label>
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h2 className={`text-3xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>@{profile?.handle}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 px-4 py-1.5 bg-purple-600 text-white rounded-full w-fit mx-auto sm:mx-0 shadow-lg">
                  <Shield size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{profile?.scoreClass} Elite</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Identificador</label>
                <input 
                  value={profile?.handle || ''} 
                  onChange={e => setProfile({...profile, handle: e.target.value})}
                  className={`w-full border rounded-2xl h-14 px-6 font-bold focus:outline-none transition-all shadow-sm ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-purple-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-300'
                  }`}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Nicho de Atuação</label>
                <input 
                  value={profile?.niche || ''} 
                  onChange={e => setProfile({...profile, niche: e.target.value})}
                  placeholder="Ex: Fashion, High-End Tech"
                  className={`w-full border rounded-2xl h-14 px-6 font-bold focus:outline-none transition-all shadow-sm ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-purple-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-purple-300'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Sua História (Bio)</label>
              <textarea 
                value={profile?.bio || ''} 
                onChange={e => setProfile({...profile, bio: e.target.value})}
                placeholder="Conte sobre sua audiência e influência..."
                className={`w-full border rounded-[2rem] p-8 text-sm font-medium focus:outline-none min-h-[180px] transition-all shadow-sm ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-zinc-200 focus:bg-white/10 focus:border-purple-500/50' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-purple-300'
                }`}
              />
            </div>
          </section>

          {/* Rate Card Section */}
          <section className={`border rounded-[3rem] p-6 md:p-10 space-y-8 md:space-y-10 transition-all duration-500 ${
            isDark ? 'bg-black/35 border-white/5 shadow-2xl' : 'bg-white border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)]'
          }`} style={isDark ? { backdropFilter: 'blur(30px)' } : undefined}>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Price List</h3>
                    <p className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>Tabela de serviços e valores</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setRateCards([...rateCards, { serviceName: '', price: 0, description: '' }])}
                  className="w-full sm:w-auto px-6 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/10"
                >
                   + Adicionar Serviço
                </button>
             </div>

             <div className="space-y-4 md:space-y-6">
                {rateCards.map((rate, idx) => (
                  <div key={idx} className={`grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 p-5 md:p-6 rounded-[2rem] border group relative transition-all ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200/60'
                  }`}>
                     <div className="md:col-span-1">
                        <input 
                          placeholder="Serviço"
                          value={rate.serviceName}
                          onChange={e => {
                              const newCards = [...rateCards];
                              newCards[idx].serviceName = e.target.value;
                              setRateCards(newCards);
                          }}
                          className={`w-full border h-12 rounded-xl px-4 text-[10px] font-black uppercase focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-white/10 border-white/10 text-white focus:bg-white/15 focus:border-purple-500/50' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-purple-300'
                          }`}
                        />
                     </div>
                     <div className="relative">
                        <input 
                          type="number"
                          value={rate.price}
                          onChange={e => {
                              const newCards = [...rateCards];
                              newCards[idx].price = Number(e.target.value);
                              setRateCards(newCards);
                          }}
                          className={`w-full border h-12 rounded-xl pl-10 pr-4 text-[11px] font-black focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-white/10 border-white/10 text-white focus:bg-white/15 focus:border-purple-500/50' 
                              : 'bg-white border-slate-200 text-slate-900 focus:border-purple-300'
                          }`}
                        />
                        <span className="absolute left-4 top-3.5 text-[10px] font-bold text-slate-400">R$</span>
                     </div>
                     <div className="md:col-span-2 flex items-center gap-4">
                        <input 
                          placeholder="Detalhes..."
                          value={rate.description}
                          onChange={e => {
                              const newCards = [...rateCards];
                              newCards[idx].description = e.target.value;
                              setRateCards(newCards);
                          }}
                          className={`flex-1 border h-12 rounded-xl px-4 text-[10px] font-medium focus:outline-none transition-all ${
                            isDark 
                              ? 'bg-white/10 border-white/10 text-zinc-200 focus:bg-white/15 focus:border-purple-500/50' 
                              : 'bg-white border-slate-200 text-slate-600 focus:border-purple-300'
                          }`}
                        />
                        <button 
                          onClick={() => setRateCards(rateCards.filter((_, i) => i !== idx))}
                          className={`p-3 rounded-xl transition-all ${
                            isDark ? 'bg-white/10 text-slate-400 hover:text-rose-500' : 'bg-slate-200/50 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                           <XCircle size={20} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Right Column: Appearance & Socials */}
        <div className="space-y-10">
          


          {/* Social Platforms Card */}
          {!isCompany && (
            <section className={`border rounded-[3rem] p-8 space-y-8 transition-all duration-500 ${
              isDark ? 'bg-black/35 border-white/5 shadow-2xl' : 'bg-white border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)]'
            }`} style={isDark ? { backdropFilter: 'blur(30px)' } : undefined}>
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Ecossistema Social</h3>
                  <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sincronize sua autoridade</p>
                <div className="space-y-4 mt-6">
                  {/* Instagram */}
                  <button 
                    type="button"
                    onClick={() => !connectedPlatforms.includes('INSTAGRAM') && handleConnect(authUrls?.instagram)}
                    disabled={connectedPlatforms.includes('INSTAGRAM')}
                    className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group text-left ${
                      connectedPlatforms.includes('INSTAGRAM') 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/80')
                    }`}
                  >
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-xl shadow-lg transition-all ${
                           connectedPlatforms.includes('INSTAGRAM') 
                             ? 'bg-gradient-to-tr from-yellow-600 via-pink-600 to-purple-600 text-white ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#0d0b1a] ring-offset-white' 
                             : 'bg-slate-900 text-white'
                         }`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                            </svg>
                         </div>
                         <div>
                            <p className={`text-xs font-black ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>Instagram Insights</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest ${
                              connectedPlatforms.includes('INSTAGRAM') ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              {connectedPlatforms.includes('INSTAGRAM') ? '✦ Sincronizado' : 'Conectar Instagram'}
                            </p>
                         </div>
                      </div>
                      {connectedPlatforms.includes('INSTAGRAM') ? (
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Ativo</span>
                            <CheckCircle2 className="text-green-500" size={20} />
                         </div>
                      ) : (
                         <ExternalLink className={`transition-colors ${isDark ? 'text-zinc-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'}`} size={16} />
                      )}
                  </button>

                  {/* TikTok */}
                  <button 
                    type="button"
                    onClick={() => !connectedPlatforms.includes('TIKTOK') && handleConnect(authUrls?.tiktok)}
                    disabled={connectedPlatforms.includes('TIKTOK')}
                    className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group text-left ${
                      connectedPlatforms.includes('TIKTOK') 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/80')
                    }`}
                  >
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-xl shadow-lg transition-all ${
                           connectedPlatforms.includes('TIKTOK') 
                             ? 'bg-black text-white ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#0d0b1a] ring-offset-white border border-white/10' 
                             : 'bg-slate-900 text-white'
                         }`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.153 0 .3.013.443.037v-3.468a6.34 6.34 0 0 0-.443-.016 6.341 6.341 0 1 0 6.341 6.341V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686z" fill="currentColor" />
                            </svg>
                         </div>
                         <div>
                            <p className={`text-xs font-black ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>TikTok Analytics</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest ${
                              connectedPlatforms.includes('TIKTOK') ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              {connectedPlatforms.includes('TIKTOK') ? '✦ Sincronizado' : 'Entrar com TikTok'}
                            </p>
                         </div>
                      </div>
                      {connectedPlatforms.includes('TIKTOK') ? (
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Ativo</span>
                            <CheckCircle2 className="text-green-500" size={20} />
                         </div>
                      ) : (
                         <ExternalLink className={`transition-colors ${isDark ? 'text-zinc-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'}`} size={16} />
                      )}
                  </button>

                  {/* YouTube */}
                  <button 
                    type="button"
                    onClick={() => !connectedPlatforms.includes('YOUTUBE') && handleConnect(authUrls?.youtube)}
                    disabled={connectedPlatforms.includes('YOUTUBE')}
                    className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group text-left ${
                      connectedPlatforms.includes('YOUTUBE') 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/80')
                    }`}
                  >
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-xl shadow-lg transition-all ${
                           connectedPlatforms.includes('YOUTUBE') 
                             ? 'bg-[#FF0000] text-white ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#0d0b1a] ring-offset-white' 
                             : 'bg-slate-900 text-white'
                         }`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                               <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                         </div>
                         <div>
                            <p className={`text-xs font-black ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>YouTube</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest ${
                              connectedPlatforms.includes('YOUTUBE') ? 'text-green-600' : 'text-slate-400'
                            }`}>
                              {connectedPlatforms.includes('YOUTUBE') ? '✦ Sincronizado' : 'Entrar com Google'}
                            </p>
                         </div>
                      </div>
                      {connectedPlatforms.includes('YOUTUBE') ? (
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Ativo</span>
                            <CheckCircle2 className="text-green-500" size={20} />
                         </div>
                      ) : (
                         <ExternalLink className={`transition-colors ${isDark ? 'text-zinc-500 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'}`} size={16} />
                      )}
                  </button>

                  {/* Seção de simulação oculta/teste rápido para demonstração local */}
                  <div className="pt-6 border-t border-slate-200/50 dark:border-white/5 space-y-3">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 text-center">
                       ⚡ Ambientes Locais / Testes Rápidos (Simulação)
                     </p>
                     <div className="flex flex-wrap gap-2 justify-center">
                        {!connectedPlatforms.includes('INSTAGRAM') && (
                           <button 
                             type="button"
                             onClick={() => handleSimulateSync('INSTAGRAM', profile?.handle || 'instagram_demo')}
                             disabled={connectingPlatform !== null}
                             className="text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 transition-all"
                           >
                              {connectingPlatform === 'INSTAGRAM' ? 'Conectando...' : 'Simular Instagram'}
                           </button>
                        )}
                        {!connectedPlatforms.includes('TIKTOK') && (
                           <button 
                             type="button"
                             onClick={() => handleSimulateSync('TIKTOK', profile?.handle || 'tiktok_demo')}
                             disabled={connectingPlatform !== null}
                             className="text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 transition-all"
                           >
                              {connectingPlatform === 'TIKTOK' ? 'Conectando...' : 'Simular TikTok'}
                           </button>
                        )}
                        {!connectedPlatforms.includes('YOUTUBE') && (
                           <button 
                             type="button"
                             onClick={() => handleSimulateSync('YOUTUBE', profile?.handle || 'youtube_demo')}
                             disabled={connectingPlatform !== null}
                             className="text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 transition-all"
                           >
                              {connectingPlatform === 'YOUTUBE' ? 'Conectando...' : 'Simular YouTube'}
                           </button>
                        )}
                     </div>
                  </div>
               </div>
               </div>
            </section>
          )}

          {/* Final Action Button */}
          <button 
            type="submit" 
            disabled={saving}
            className={`w-full h-20 font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] transition-all shadow-2xl active:scale-95 disabled:opacity-50 ${
              isDark 
                ? 'bg-white text-slate-950 hover:bg-zinc-200' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {saving ? 'PROCESSANDO...' : 'SYNC STUDIO'}
          </button>

          <div className="flex items-center justify-center gap-3 opacity-30">
             <Lock size={12} className="text-slate-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security: SSL // AES-256</span>
          </div>

        </div>
      </form>
    </div>
  );
}
