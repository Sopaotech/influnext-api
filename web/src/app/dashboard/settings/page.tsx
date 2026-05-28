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
  Globe, 
  Palette,
  CreditCard,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Image as ImageIcon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { BACKGROUNDS } from '@/lib/constants';

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
      // Limpa os parâmetros da URL sem recarregar a página
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
      const res = await api.get('/dashboard/influencer'); 
      setProfile(res.data.profile);
      if (res.data.userState?.theme) setSelectedBg(res.data.userState.theme);
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
      await api.patch('/influencers/profile', {
        handle: profile.handle,
        niche: profile.niche,
        profileImageUrl: profile.profileImageUrl || null,
        bio: profile.bio,
        theme: selectedBg,
        accentColor
      });

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

  const handleSyncMetrics = async () => {
    if (connectedPlatforms.length === 0) {
      toast.error('Nenhuma plataforma conectada para sincronizar.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await api.post('/integrations/sync-metrics');
      const { results } = res.data;
      const synced = Object.entries(results)
        .filter(([, v]) => v === 'synced')
        .map(([k]) => k)
        .join(', ');
      toast.success(`✦ Métricas sincronizadas: ${synced}`, {
        description: 'Seus dados de seguidores e perfil foram atualizados.'
      });
      await fetchIntegrations();
    } catch {
      toast.error('Erro ao sincronizar métricas. Tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 space-y-10 animate-pulse">
        <div className="h-12 w-64 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="h-96 bg-white/5 rounded-[2.5rem]" />
           <div className="h-96 bg-white/5 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-12 animate-in fade-in duration-1000 pb-20">
      
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
             <div className="h-1.5 w-12 bg-slate-900 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Studio Control Center</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]">
            Personalize seu <span className="text-slate-400 font-medium italic">Espaço</span>
          </h1>
        </div>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Profile & Rate Card */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Identity Glass Card */}
          <section className="bg-white/10 border border-white/20 rounded-[3rem] p-8 md:p-10 space-y-10 shadow-sm group hover:bg-white/15 transition-all duration-500" style={{ backdropFilter: 'blur(30px)' }}>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group/avatar">
                <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-white/20 overflow-hidden shadow-2xl transition-all group-hover/avatar:scale-105">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-200">
                       <User size={50} />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-3 bg-slate-900 text-white rounded-full shadow-xl cursor-pointer hover:bg-slate-800 transition-colors">
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
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">@{profile?.handle}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full w-fit mx-auto sm:mx-0 shadow-lg">
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 font-bold text-slate-900 focus:outline-none focus:bg-white/20 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Nicho de Atuação</label>
                <input 
                  value={profile?.niche || ''} 
                  onChange={e => setProfile({...profile, niche: e.target.value})}
                  placeholder="Ex: Fashion, High-End Tech"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 font-bold text-slate-900 focus:outline-none focus:bg-white/20 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] ml-2">Sua História (Bio)</label>
              <textarea 
                value={profile?.bio || ''} 
                onChange={e => setProfile({...profile, bio: e.target.value})}
                placeholder="Conte sobre sua audiência e influência..."
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-sm font-medium text-slate-700 focus:outline-none focus:bg-white/20 min-h-[180px] transition-all shadow-sm"
              />
            </div>
          </section>

          {/* Rate Card Glass Card */}
          <section className="bg-white/10 border border-white/20 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 space-y-8 md:space-y-10 shadow-sm" style={{ backdropFilter: 'blur(30px)' }}>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Price List</h3>
                    <p className="text-xs font-bold text-slate-400">Tabela de serviços e valores</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setRateCards([...rateCards, { serviceName: '', price: 0, description: '' }])}
                  className="w-full sm:w-auto px-6 py-3 md:py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                >
                   + Adicionar Serviço
                </button>
             </div>

             <div className="space-y-4 md:space-y-6">
                {rateCards.map((rate, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 p-5 md:p-6 bg-white/5 rounded-[2rem] border border-white/10 group relative transition-all">
                     <div className="md:col-span-1">
                        <input 
                          placeholder="Serviço"
                          value={rate.serviceName}
                          onChange={e => {
                              const newCards = [...rateCards];
                              newCards[idx].serviceName = e.target.value;
                              setRateCards(newCards);
                          }}
                          className="w-full bg-white/10 border border-white/10 h-12 rounded-xl px-4 text-[10px] font-black uppercase text-slate-900"
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
                          className="w-full bg-white/10 border border-white/10 h-12 rounded-xl pl-10 pr-4 text-[11px] font-black text-slate-900"
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
                          className="flex-1 bg-white/10 border border-white/10 h-12 rounded-xl px-4 text-[10px] font-medium text-slate-600"
                        />
                        <button 
                          onClick={() => setRateCards(rateCards.filter((_, i) => i !== idx))}
                          className="p-3 bg-white/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
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
          
          {/* BACKGROUND SELECTOR */}
          <section className="bg-white/10 border border-white/20 rounded-[3rem] p-8 space-y-6 shadow-sm" style={{ backdropFilter: 'blur(30px)' }}>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <ImageIcon size={18} />
               </div>
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Plano de Fundo</h3>
                  <p className="text-xs font-bold text-slate-900">Personalize seu espaço visual</p>
               </div>
             </div>

             {/* Grid de backgrounds — Custom Pic sempre primeiro */}
             <div className="grid grid-cols-3 gap-3">

               {/* 1º: Custom Pic (sempre visível, sempre primeiro) */}
               <label className="relative flex flex-col items-center justify-center rounded-[1.5rem] aspect-[4/3] border-2 border-dashed border-slate-300/50 bg-white/10 hover:bg-white/20 hover:border-slate-400/60 transition-all group cursor-pointer">
                 <input 
                   type="file" 
                   accept="image/png, image/jpeg, image/jpg, image/webp" 
                   className="hidden" 
                   onChange={async (e) => {
                     const file = e.target.files?.[0];
                     if (!file) return;
                     try {
                       toast.loading('Preparando fundo...', { id: 'bg-upload' });
                       const base64Url = await compressImage(file, 1920, 0.7);
                       setSelectedBg(base64Url);
                       window.dispatchEvent(new CustomEvent('theme-updated', { detail: { theme: base64Url } }));
                       await api.patch('/influencers/profile', { theme: base64Url });
                       toast.success('✦ Fundo personalizado aplicado!', { id: 'bg-upload' });
                     } catch (err) {
                       console.error('Falha ao salvar bg automaticamente', err);
                       toast.error('Erro ao salvar o fundo de tela.', { id: 'bg-upload' });
                     }
                   }}
                 />
                 <div className="w-8 h-8 rounded-full bg-slate-900/10 flex items-center justify-center text-slate-600 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white transition-all">
                   <span className="text-xl font-light leading-none">+</span>
                 </div>
                 <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-2">Custom Pic</span>
               </label>

               {/* Backgrounds da biblioteca (3 visíveis por padrão, todos se expandido) */}
               {(showAllBgs ? BACKGROUNDS : BACKGROUNDS.slice(0, 5)).map((bg) => (
                 <button
                   key={bg.id}
                   type="button"
                   onClick={async () => {
                     setSelectedBg(bg.url);
                     window.dispatchEvent(new CustomEvent('theme-updated', { detail: { theme: bg.url } }));
                     toast.info(`✦ ${bg.name} selecionado!`);
                     try {
                       await api.patch('/influencers/profile', { theme: bg.url });
                     } catch (err) {
                       console.error('Falha ao salvar bg automaticamente', err);
                     }
                   }}
                   className={`relative group rounded-[1.5rem] overflow-hidden aspect-[4/3] transition-all duration-300 ${
                     selectedBg === bg.url
                       ? 'ring-[3px] ring-slate-900 scale-[0.97] shadow-2xl z-10'
                       : 'ring-1 ring-white/10 opacity-75 hover:opacity-100 hover:scale-[1.03] hover:shadow-lg'
                   }`}
                 >
                   <img src={bg.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={bg.name} />
                   {/* Overlay de contraste — garante legibilidade das letras do sistema sobre qualquer imagem */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                   {/* Nome no hover */}
                   <div className="absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[7px] font-black text-white uppercase tracking-widest truncate drop-shadow-lg">{bg.name}</span>
                   </div>
                   {/* Check mark quando selecionado */}
                   {selectedBg === bg.url && (
                     <div className="absolute top-2 right-2 p-1 bg-slate-900 text-white rounded-full shadow-lg">
                       <CheckCircle2 size={10} />
                     </div>
                   )}
                 </button>
               ))}
             </div>

             {/* Botão Ver Mais / Recolher */}
             <button
               type="button"
               onClick={() => setShowAllBgs(prev => !prev)}
               className="w-full py-3 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/15 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
             >
               {showAllBgs ? `Recolher ↑` : `Ver mais fundos (${BACKGROUNDS.length - 5} restantes) ↓`}
             </button>
          </section>

          {/* Social Platforms Glass Card */}
          <section className="bg-white/10 border border-white/20 rounded-[3rem] p-8 space-y-8 shadow-sm" style={{ backdropFilter: 'blur(30px)' }}>
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Ecossistema Social</h3>
                <p className="text-xs font-bold text-slate-900">Sincronize sua autoridade</p>
              <div className="space-y-4 mt-6">
                
                <div className="p-4 rounded-2xl border flex items-start gap-3 bg-blue-50/50 border-blue-100 text-blue-800 backdrop-blur-md">
                   <div className="mt-0.5"><Sparkles className="w-4 h-4" /></div>
                   <div className="space-y-1">
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-wider">Atenção: Integração Meta Oficial</p>
                      <p className="text-[10px] md:text-[11px] leading-relaxed opacity-80 font-medium">A Meta não permite integrações de contas "pessoais". Para conectar o Instagram à InfluNext, seu perfil <strong>DEVE</strong> ser uma Conta Profissional vinculada a uma Página do Facebook. Por isso o botão abaixo abrirá o portal do Facebook.</p>
                   </div>
                </div>

                {/* Instagram */}
                <button 
                  type="button"
                  onClick={() => handleConnect(authUrls?.instagram)}
                  className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${
                    connectedPlatforms.includes('INSTAGRAM') 
                      ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/15'
                  }`}
                >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl shadow-lg transition-colors ${
                         connectedPlatforms.includes('INSTAGRAM') ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
                       }`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                          </svg>
                       </div>
                       <div className="text-left">
                          <p className="text-xs font-black text-blue-600">Meta: Insights Profissionais</p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest ${
                            connectedPlatforms.includes('INSTAGRAM') ? 'text-green-600' : 'text-slate-400'
                          }`}>
                            {connectedPlatforms.includes('INSTAGRAM') ? '✦ Sincronizado' : 'Conectar Conta de Criador'}
                          </p>
                       </div>
                    </div>
                    {connectedPlatforms.includes('INSTAGRAM') ? (
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Ativo</span>
                          <CheckCircle2 className="text-green-500" size={20} />
                       </div>
                    ) : (
                       <ExternalLink className="text-slate-300 group-hover:text-slate-900 transition-colors" size={16} />
                    )}
                </button>

                {/* TikTok */}
                <button 
                  type="button"
                  onClick={() => handleConnect(authUrls?.tiktok)}
                  className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${
                    connectedPlatforms.includes('TIKTOK') 
                      ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/15'
                  }`}
                >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl shadow-lg transition-colors ${
                         connectedPlatforms.includes('TIKTOK') ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
                       }`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.891 2.896 2.896 0 0 1-2.891-2.891 2.896 2.896 0 0 1 2.891-2.891c.153 0 .3.013.443.037v-3.468a6.34 6.34 0 0 0-.443-.016 6.341 6.341 0 1 0 6.341 6.341V8.658a8.212 8.212 0 0 0 4.265 1.474V6.686z" fill="currentColor" />
                          </svg>
                       </div>
                       <div className="text-left">
                          <p className="text-xs font-black text-slate-900">TikTok</p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest ${
                            connectedPlatforms.includes('TIKTOK') ? 'text-green-600' : 'text-slate-400'
                          }`}>
                            {connectedPlatforms.includes('TIKTOK') ? '✦ Sincronizado' : 'Conectar via TikTok'}
                          </p>
                       </div>
                    </div>
                    {connectedPlatforms.includes('TIKTOK') ? (
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Ativo</span>
                          <CheckCircle2 className="text-green-500" size={20} />
                       </div>
                    ) : (
                       <ExternalLink className="text-slate-300 group-hover:text-slate-900 transition-colors" size={16} />
                    )}
                </button>

                {/* YouTube */}
                <button 
                  type="button"
                  onClick={() => handleConnect(authUrls?.youtube)}
                  className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${
                    connectedPlatforms.includes('YOUTUBE') 
                      ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/15'
                  }`}
                >
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl shadow-lg transition-colors ${
                         connectedPlatforms.includes('YOUTUBE') ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
                       }`}>
                          <Zap size={18} />
                       </div>
                       <div className="text-left">
                          <p className="text-xs font-black text-slate-900">YouTube Studios</p>
                          <p className={`text-[8px] font-bold uppercase tracking-widest ${
                            connectedPlatforms.includes('YOUTUBE') ? 'text-green-600' : 'text-slate-400'
                          }`}>
                            {connectedPlatforms.includes('YOUTUBE') ? '✦ Sincronizado' : 'Conectar via Google'}
                          </p>
                       </div>
                    </div>
                    {connectedPlatforms.includes('YOUTUBE') ? (
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Ativo</span>
                          <CheckCircle2 className="text-green-500" size={20} />
                       </div>
                    ) : (
                       <ExternalLink className="text-slate-300 group-hover:text-slate-900 transition-colors" size={16} />
                    )}
                </button>
             </div>
             </div>
          </section>

          {/* Final Action Button */}
          <button 
            type="submit" 
            disabled={saving}
            className="w-full h-20 bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-[0.4em] rounded-[2rem] transition-all shadow-2xl active:scale-95 disabled:opacity-50"
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
