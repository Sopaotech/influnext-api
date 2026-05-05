'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';
import { User, Camera, AtSign, Tag, FileText, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rateCards, setRateCards] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchRateCard();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/dashboard/influencer'); // Reaproveitando endpoint de dashboard
      setProfile(res.data.profile);
    } catch (err) {
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Salvar Perfil
      await api.patch('/influencers/profile', {
        handle: profile.handle,
        niche: profile.niche,
        profileImageUrl: profile.profileImageUrl || null,
        bio: profile.bio
      });

      // Salvar Tabela de Preços (Se houver)
      if (rateCards.length > 0) {
        await api.post('/influencers/rate-card', rateCards);
      }

      toast.success('✦ Ajustes sincronizados com sucesso!');
    } catch (err: any) {
      console.error('[SETTINGS_SAVE_ERROR]', err.response?.data || err.message);
      const errorMsg = err.response?.data?.error || 'Erro ao salvar alterações. Verifique os campos.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-zinc-500 animate-pulse">Carregando configurações...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-100">Ajustes_Conta</h1>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Gerencie sua identidade no Influnext</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Foto e Info Básica */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-800 overflow-hidden">
                {profile.profileImageUrl ? (
                  <img src={profile.profileImageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700"><User size={40} /></div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Camera size={20} className="text-white" />
                <input type="file" className="hidden" />
              </label>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-zinc-200">@{profile.handle}</h2>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <Shield size={10} /> Status: {profile.scoreClass}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2"><AtSign size={10}/> Handle</label>
              <Input 
                value={profile.handle || ''} 
                onChange={e => setProfile({...profile, handle: e.target.value})}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2"><Tag size={10}/> Nicho</label>
              <Input 
                value={profile.niche || ''} 
                onChange={e => setProfile({...profile, niche: e.target.value})}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2"><FileText size={10}/> Bio Profissional</label>
            <textarea 
              value={profile.bio || ''} 
              onChange={e => setProfile({...profile, bio: e.target.value})}
              placeholder="Conte para as marcas quem você é..."
              className="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-zinc-950 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800 bg-zinc-900 border-zinc-800 min-h-[100px]"
            />
          </div>
        </section>

        {/* Personalização do Layout (Appearance) */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Shield size={60} className="text-purple-500" />
          </div>
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            Aparência_do_Sistema
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Modo de Exibição</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border-2 text-left space-y-2 transition-all ${theme === 'dark' ? 'border-purple-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-950 opacity-50'}`}
                >
                  <div className="w-full h-2 bg-zinc-800 rounded-full" />
                  <div className="w-1/2 h-2 bg-zinc-800 rounded-full" />
                  <span className="text-[10px] font-black uppercase text-white block mt-2">Dark Mode</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border-2 text-left space-y-2 transition-all ${theme === 'light' ? 'border-purple-600 bg-white' : 'border-zinc-800 bg-zinc-100 opacity-50'}`}
                >
                  <div className="w-full h-2 bg-zinc-300 rounded-full" />
                  <div className="w-1/2 h-2 bg-zinc-300 rounded-full" />
                  <span className="text-[10px] font-black uppercase text-zinc-900 block mt-2">Clean Mode</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">Cor de Destaque (Brand)</label>
              <div className="flex flex-wrap gap-3">
                {['#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#f59e0b'].map(color => (
                  <button 
                    key={color}
                    type="button"
                    style={{ backgroundColor: color }}
                    className={`w-8 h-8 rounded-full border-2 ${color === '#a855f7' ? 'border-white' : 'border-transparent'} shadow-lg transform active:scale-90 transition-all`}
                  />
                ))}
              </div>
              <p className="text-[9px] text-zinc-600 font-medium italic">O sistema irá reajustar todos os botões e detalhes para a cor escolhida.</p>
            </div>
          </div>
        </section>

        {/* Tabela de Preços (Rate Card) */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tabela de Preços (Rate Card)</h3>
              <button 
                type="button"
                onClick={() => setRateCards([...rateCards, { serviceName: '', price: 0, description: '' }])}
                className="text-[10px] font-black text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest"
              >
                 + Adicionar Item
              </button>
           </div>

           <div className="space-y-4">
              {rateCards.map((rate, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 group relative">
                   <div className="md:col-span-1">
                      <Input 
                        placeholder="Ex: Reels"
                        value={rate.serviceName}
                        onChange={e => {
                           const newCards = [...rateCards];
                           newCards[idx].serviceName = e.target.value;
                           setRateCards(newCards);
                        }}
                        className="bg-zinc-950 border-zinc-800 text-[10px] font-black uppercase"
                      />
                   </div>
                   <div className="md:col-span-1">
                      <Input 
                        type="number"
                        placeholder="Preço (R$)"
                        value={rate.price}
                        onChange={e => {
                           const newCards = [...rateCards];
                           newCards[idx].price = Number(e.target.value);
                           setRateCards(newCards);
                        }}
                        className="bg-zinc-950 border-zinc-800 text-[10px] font-black"
                      />
                   </div>
                   <div className="md:col-span-1 flex items-center gap-2">
                      <Input 
                        placeholder="Descrição curta"
                        value={rate.description}
                        onChange={e => {
                           const newCards = [...rateCards];
                           newCards[idx].description = e.target.value;
                           setRateCards(newCards);
                        }}
                        className="bg-zinc-950 border-zinc-800 text-[10px]"
                      />
                      <button 
                        onClick={() => setRateCards(rateCards.filter((_, i) => i !== idx))}
                        className="p-2 text-zinc-700 hover:text-red-400 transition-colors"
                      >
                         <Shield size={14} className="rotate-45" />
                      </button>
                   </div>
                </div>
              ))}
              {rateCards.length === 0 && (
                <p className="text-center py-10 text-[9px] text-zinc-700 font-bold uppercase tracking-widest border-2 border-dashed border-zinc-900 rounded-xl">Nenhum serviço configurado</p>
              )}
           </div>
        </section>

        <Button 
          type="submit" 
          disabled={saving}
          className="w-full h-14 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition-all shadow-[0_10px_20px_rgba(124,58,237,0.3)]"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </div>
  );
}
