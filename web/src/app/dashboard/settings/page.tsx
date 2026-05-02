'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { User, Camera, AtSign, Tag, FileText, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/influencers/profile', {
        handle: profile.handle,
        niche: profile.niche,
        profileImageUrl: profile.profileImageUrl,
        bio: profile.bio
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar alterações');
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
            <Textarea 
              value={profile.bio || ''} 
              onChange={e => setProfile({...profile, bio: e.target.value})}
              placeholder="Conte para as marcas quem você é..."
              className="bg-zinc-900 border-zinc-800 min-h-[100px]"
            />
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
