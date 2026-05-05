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
  Camera as InstagramIcon, 
  Zap, 
  Globe, 
  Palette,
  CreditCard,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState('#a855f7');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [authUrls, setAuthUrls] = useState<any>(null);

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
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/dashboard/influencer'); 
      setProfile(res.data.profile);
      if (res.data.profile.accentColor) setAccentColor(res.data.profile.accentColor);
    } catch (err) {
      toast.error('Erro ao carregar dados do perfil');
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
        theme,
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
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-12 animate-in fade-in duration-700">
      
      {/* Pro Max Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.03] pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
             <div className="h-1 w-8 bg-purple-600 rounded-full" />
             <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">Account_Kernel_v2.0</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            Centro de <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Configurações</span>
          </h1>
        </div>
      </header>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Rate Card */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Basic Identity */}
          <section className="bg-[#0d0b1a] border border-white/[0.05] rounded-[2.5rem] p-8 space-y-8 group hover:border-purple-500/20 transition-all duration-500">
            <div className="flex items-center gap-6">
              <div className="relative group/avatar">
                <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-white/[0.05] overflow-hidden transition-all group-hover/avatar:border-purple-500/50">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-gradient-to-br from-zinc-900 to-black">
                       <User size={40} />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer rounded-full backdrop-blur-sm">
                  <Camera size={20} className="text-white" />
                  <input type="file" className="hidden" />
                </label>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tighter">@{profile?.handle}</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                  <Shield size={10} className="text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Status: {profile?.scoreClass}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2"><AtSign size={12} className="text-purple-500" /> Identificador</label>
                <Input 
                  value={profile?.handle || ''} 
                  onChange={e => setProfile({...profile, handle: e.target.value})}
                  className="bg-white/[0.02] border-white/[0.05] rounded-xl h-12 font-bold focus:border-purple-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2"><Tag size={12} className="text-purple-500" /> Especialidade</label>
                <Input 
                  value={profile?.niche || ''} 
                  onChange={e => setProfile({...profile, niche: e.target.value})}
                  className="bg-white/[0.02] border-white/[0.05] rounded-xl h-12 font-bold focus:border-purple-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] flex items-center gap-2"><FileText size={12} className="text-purple-500" /> Manifesto_Pessoal</label>
              <textarea 
                value={profile?.bio || ''} 
                onChange={e => setProfile({...profile, bio: e.target.value})}
                placeholder="Qual sua proposta única de valor para as marcas?"
                className="w-full bg-white/[0.02] border-white/[0.05] rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-purple-500/50 min-h-[120px] transition-all"
              />
            </div>
          </section>

          {/* Rate Card Section */}
          <section className="bg-[#0d0b1a] border border-white/[0.05] rounded-[2.5rem] p-8 space-y-8">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Tabela_de_Preços</h3>
                   <p className="text-xs font-bold text-zinc-400">Defina o valor da sua influência</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setRateCards([...rateCards, { serviceName: '', price: 0, description: '' }])}
                  className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-black text-purple-400 hover:bg-purple-500/20 transition-all uppercase tracking-widest"
                >
                   + Novo Serviço
                </button>
             </div>

             <div className="space-y-4">
                {rateCards.map((rate, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white/[0.01] rounded-2xl border border-white/[0.03] group relative hover:border-white/[0.08] transition-all">
                     <Input 
                       placeholder="Serviço (ex: Reels)"
                       value={rate.serviceName}
                       onChange={e => {
                          const newCards = [...rateCards];
                          newCards[idx].serviceName = e.target.value;
                          setRateCards(newCards);
                       }}
                       className="bg-zinc-950/50 border-white/[0.05] h-10 text-[10px] font-black uppercase tracking-widest"
                     />
                     <div className="relative">
                        <Input 
                          type="number"
                          placeholder="Valor"
                          value={rate.price}
                          onChange={e => {
                             const newCards = [...rateCards];
                             newCards[idx].price = Number(e.target.value);
                             setRateCards(newCards);
                          }}
                          className="bg-zinc-950/50 border-white/[0.05] h-10 text-[11px] font-black pl-8"
                        />
                        <span className="absolute left-3 top-2.5 text-[10px] font-bold text-zinc-600">R$</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Detalhes..."
                          value={rate.description}
                          onChange={e => {
                             const newCards = [...rateCards];
                             newCards[idx].description = e.target.value;
                             setRateCards(newCards);
                          }}
                          className="bg-zinc-950/50 border-white/[0.05] h-10 text-[10px] font-medium"
                        />
                        <button 
                          onClick={() => setRateCards(rateCards.filter((_, i) => i !== idx))}
                          className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"
                        >
                           <XCircle size={18} />
                        </button>
                     </div>
                  </div>
                ))}
                {rateCards.length === 0 && (
                  <div className="py-12 border-2 border-dashed border-white/[0.02] rounded-[2rem] flex flex-col items-center justify-center space-y-3 opacity-30">
                     <CreditCard size={24} className="text-zinc-600" />
                     <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nenhum serviço configurado</p>
                  </div>
                )}
             </div>
          </section>
        </div>

        {/* Right Column: Socials & Appearance */}
        <div className="space-y-8">
          
          {/* SOCIAL INTEGRATIONS - THE KEY SECTION */}
          <section className="bg-[#0d0b1a] border border-white/[0.05] rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
             
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Conexões_Sociais</h3>
                <p className="text-xs font-bold text-zinc-400">Aumente seu InfluScore conectando suas redes</p>
             </div>

             <div className="space-y-4">
                {/* Instagram */}
                <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-4 group hover:border-rose-500/30 transition-all duration-500">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
                            <InstagramIcon size={20} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-white">Instagram</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Insights & Atividade</p>
                         </div>
                      </div>
                      {connectedPlatforms.includes('INSTAGRAM') ? (
                         <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <CheckCircle2 size={10} className="text-emerald-400" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase">Ativo</span>
                         </div>
                      ) : (
                         <button 
                           type="button"
                           onClick={() => handleConnect(authUrls?.instagram)}
                           className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-[9px] font-black text-rose-400 uppercase tracking-widest transition-all"
                         >
                            CONECTAR
                         </button>
                      )}
                   </div>
                   {!connectedPlatforms.includes('INSTAGRAM') && (
                      <p className="text-[9px] text-zinc-600 italic leading-relaxed">Conecte para sincronizar seguidores e engajamento real.</p>
                   )}
                </div>

                {/* TikTok */}
                <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-4 group hover:border-zinc-300/30 transition-all duration-500">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-zinc-100/10 rounded-2xl text-white">
                            <Globe size={20} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-white">TikTok</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Vídeos & Trends</p>
                         </div>
                      </div>
                      {connectedPlatforms.includes('TIKTOK') ? (
                         <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <CheckCircle2 size={10} className="text-emerald-400" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase">Ativo</span>
                         </div>
                      ) : (
                         <button 
                            type="button"
                            onClick={() => handleConnect(authUrls?.tiktok)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all"
                         >
                            CONECTAR
                         </button>
                      )}
                   </div>
                   {!connectedPlatforms.includes('TIKTOK') && (
                      <p className="text-[9px] text-zinc-600 italic leading-relaxed">Sincronize sua autoridade em vídeos curtos.</p>
                   )}
                </div>
             </div>
             
             <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-start gap-3">
                <Zap size={14} className="text-purple-400 mt-0.5" />
                <p className="text-[9px] font-bold text-purple-300 leading-relaxed uppercase tracking-tighter">Conectar contas reais aumenta seu InfluScore em até 40 pontos imediatamente.</p>
             </div>
          </section>

          {/* Appearance Section */}
          <section className="bg-[#0d0b1a] border border-white/[0.05] rounded-[2.5rem] p-8 space-y-8">
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">Cromatismo_e_Interface</h3>
                <p className="text-xs font-bold text-zinc-400">Personalize seu workspace neural</p>
             </div>

             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-purple-600 bg-purple-500/5' : 'border-white/[0.03] bg-transparent opacity-40 hover:opacity-100'}`}
                  >
                    <div className="w-full h-8 bg-zinc-900 rounded-lg mb-2" />
                    <span className="text-[10px] font-black uppercase text-white tracking-widest">Dark</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-purple-600 bg-white' : 'border-white/[0.03] bg-transparent opacity-40 hover:opacity-100'}`}
                  >
                    <div className="w-full h-8 bg-zinc-100 rounded-lg mb-2" />
                    <span className="text-[10px] font-black uppercase text-zinc-900 tracking-widest">Clean</span>
                  </button>
                </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Cor de Identidade</p>
                   <div className="flex justify-center gap-4">
                      {['#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#f59e0b'].map(color => (
                        <button 
                          key={color}
                          type="button"
                          onClick={() => setAccentColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-8 h-8 rounded-full border-2 ${accentColor === color ? 'border-white scale-125' : 'border-transparent opacity-30'} shadow-lg transition-all duration-300`}
                        />
                      ))}
                   </div>
                </div>
             </div>
          </section>

          {/* Action Footer */}
          <Button 
            type="submit" 
            disabled={saving}
            className="w-full h-16 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] transition-all shadow-[0_20px_40px_rgba(124,58,237,0.2)] active:scale-[0.98]"
          >
            {saving ? 'SINCRONIZANDO...' : 'ATUALIZAR CONFIGURAÇÕES'}
          </Button>

          <div className="flex items-center justify-center gap-3 opacity-20">
             <Lock size={12} className="text-zinc-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Dados Criptografados // AES-256</span>
          </div>
        </div>
      </form>
    </div>
  );
}
