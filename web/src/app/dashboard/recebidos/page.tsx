'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Package, MapPin, Store, Search, Eye, EyeOff, Info, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

interface Recebido {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'RECEIVED' | 'REJECTED';
  trackingCode?: string;
  shippingCarrier?: string;
  sentAt?: string;
  receivedAt?: string;
  company?: {
    companyName: string;
    logoUrl?: string;
  };
  influencer?: {
    handle: string;
    profileImageUrl?: string;
  };
}

export default function RecebidosPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [role, setRole] = useState<'INFLUENCER' | 'COMPANY' | 'ADMIN' | null>(null);
  const [recebidos, setRecebidos] = useState<Recebido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSendingPackage, setIsSendingPackage] = useState(false);

  // Influencer shipping profile fields
  const [shippingAddress, setShippingAddress] = useState('');
  const [poBox, setPoBox] = useState('');
  const [shareAddress, setShareAddress] = useState(false);

  // Company registry modal fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    influencerId: '',
    influencerHandle: '',
    title: '',
    description: '',
    trackingCode: '',
    shippingCarrier: 'Correios',
  });

  // Search influencers
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Monitor theme updates
  useEffect(() => {
    const savedTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const interval = setInterval(() => {
      const currentTheme = Cookies.get('influnext_theme') as 'dark' | 'light' | undefined;
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [theme]);

  useEffect(() => {
    const userRole = Cookies.get('influnext_role') as 'INFLUENCER' | 'COMPANY' | 'ADMIN';
    setRole(userRole || 'INFLUENCER');
    fetchData(userRole || 'INFLUENCER');
  }, []);

  const fetchData = async (activeRole: 'INFLUENCER' | 'COMPANY' | 'ADMIN') => {
    try {
      setIsLoading(true);
      if (activeRole === 'COMPANY') {
        const res = await api.get('/recebidos/company');
        setRecebidos(res.data);
      } else {
        const [res, profileRes] = await Promise.all([
          api.get('/recebidos/influencer'),
          api.get('/dashboard/influencer')
        ]);
        setRecebidos(res.data);
        if (profileRes.data.profile) {
          setShippingAddress(profileRes.data.profile.shippingAddress || '');
          setPoBox(profileRes.data.profile.poBox || '');
          setShareAddress(profileRes.data.profile.shareAddress || false);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados de recebidos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingAddress(true);
      await api.patch('/recebidos/shipping', {
        shippingAddress,
        poBox,
        shareAddress
      });
      toast.success('✦ Endereço de envio atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar endereço.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'RECEIVED') => {
    try {
      await api.patch(`/recebidos/${id}/status`, { status: newStatus });
      toast.success('✦ Recebido marcado como recebido com sucesso! O remetente foi notificado.');
      if (role) fetchData(role);
    } catch (err) {
      toast.error('Erro ao atualizar status.');
    }
  };

  const handleSearchInfluencer = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const cleanQ = q.startsWith('@') ? q.slice(1) : q;
      const res = await api.get(`/influencers/search?q=${cleanQ}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Erro ao pesquisar influenciadores:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectInfluencer = (inf: any) => {
    setForm({
      ...form,
      influencerId: inf.id,
      influencerHandle: inf.handle
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmitPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.influencerId || !form.title) {
      return toast.error('Selecione um influenciador e digite um título.');
    }

    try {
      setIsSendingPackage(true);
      await api.post('/recebidos', {
        influencerId: form.influencerId,
        title: form.title,
        description: form.description || undefined,
        trackingCode: form.trackingCode || undefined,
        shippingCarrier: form.shippingCarrier || undefined,
      });

      toast.success('✦ Recebido registrado e enviado ao influenciador com sucesso!');
      setIsModalOpen(false);
      setForm({
        influencerId: '',
        influencerHandle: '',
        title: '',
        description: '',
        trackingCode: '',
        shippingCarrier: 'Correios',
      });
      if (role) fetchData(role);
    } catch (err) {
      toast.error('Erro ao registrar recebido.');
    } finally {
      setIsSendingPackage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[8px] font-black bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-white/5 uppercase">Pendente</span>;
      case 'SHIPPED':
        return <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/10 uppercase animate-pulse">Enviado</span>;
      case 'DELIVERED':
        return <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/10 uppercase">Entregue</span>;
      case 'RECEIVED':
        return <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/10 uppercase">Confirmado</span>;
      case 'REJECTED':
        return <span className="text-[8px] font-black bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/10 uppercase">Recusado</span>;
      default:
        return <span className="text-[8px] font-black bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">{status}</span>;
    }
  };

  const isDark = theme === 'dark';
  const isCompany = role === 'COMPANY';

  if (isLoading) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Buscando Caixa de Recebidos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-orange-400 font-black text-[10px] tracking-widest uppercase mb-1">
          <Package className="w-4 h-4" />
          Módulo de Recebidos e Envios de Brindes
        </div>
        <h1 className="text-4xl font-black text-current tracking-tighter">
          Central de <span className="text-orange-400">Recebidos</span>
        </h1>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">
          {isCompany 
            ? 'Envie brindes para os influenciadores da plataforma e acompanhe as postagens.'
            : 'Gerencie seus brindes recebidos de marcas parceiras e controle seu endereço de entrega.'}
        </p>
      </header>

      {isCompany ? (
        <div className="space-y-8">
          <div className={`flex justify-between items-center border rounded-3xl p-6 ${
            isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-md'
          }`}>
            <div className="space-y-1">
              <h3 className={`text-sm font-black uppercase ${isDark ? 'text-white' : 'text-zinc-800'}`}>Novo Envio</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Envie kits, presentes e amostras de produtos para seus criadores preferidos.</p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest h-12 px-6 rounded-2xl shadow-lg shadow-orange-600/10 active:scale-95 transition-all animate-in fade-in"
            >
              Registrar Novo Envio
            </Button>
          </div>

          <section className="space-y-6">
            <h2 className="text-xl font-black text-current tracking-tight uppercase">Histórico de Envios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recebidos.length > 0 ? recebidos.map((rec) => (
                <div 
                  key={rec.id} 
                  className={`p-6 border rounded-[2rem] flex flex-col justify-between h-56 relative hover:border-orange-500/25 transition-all group shadow-sm ${
                    isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-md shadow-zinc-100/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5">
                          <img src={rec.influencer?.profileImageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="Influenciador" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-wider">@{rec.influencer?.handle}</h4>
                          <h3 className={`text-xs font-black line-clamp-1 uppercase mt-0.5 ${isDark ? 'text-white' : 'text-zinc-800'}`}>{rec.title}</h3>
                        </div>
                      </div>
                      {getStatusBadge(rec.status)}
                    </div>
                    <p className="text-[11px] text-zinc-550 dark:text-zinc-400 line-clamp-2 leading-relaxed font-bold">{rec.description || 'Nenhuma descrição fornecida.'}</p>
                  </div>

                  <div className={`border-t pt-4 flex flex-col gap-1 text-[10px] text-zinc-500 ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
                    <div className="flex justify-between">
                      <span>Transportadora:</span>
                      <span className={`font-bold uppercase ${isDark ? 'text-white' : 'text-zinc-700'}`}>{rec.shippingCarrier || 'Não Informada'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rastreio:</span>
                      <span className={`font-bold select-all ${isDark ? 'text-zinc-200' : 'text-zinc-600'}`}>{rec.trackingCode || 'Sem Código'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4">
                  <Package className="w-10 h-10 text-zinc-500 animate-pulse" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nenhum envio registrado</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* List of Received Packages */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black text-current tracking-tight uppercase">Meus Recebidos</h2>
            <div className="space-y-4 animate-in fade-in">
              {recebidos.length > 0 ? recebidos.map((rec) => (
                <div 
                  key={rec.id} 
                  className={`p-6 border rounded-3xl hover:border-orange-500/25 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden group ${
                    isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-md shadow-zinc-100/50'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="space-y-4 relative z-10 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5">
                        <img src={rec.company?.logoUrl || '/logo.png'} alt="Marca" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">{rec.company?.companyName}</span>
                          {getStatusBadge(rec.status)}
                        </div>
                        <h4 className={`text-sm font-black uppercase tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-zinc-800'}`}>{rec.title}</h4>
                      </div>
                    </div>
                    
                    <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{rec.description || 'Nenhum detalhe adicional.'}</p>
                    
                    <div className={`flex flex-wrap gap-x-8 gap-y-2 text-[10px] text-zinc-500 border-t pt-4 ${
                      isDark ? 'border-white/5' : 'border-zinc-150'
                    }`}>
                      <div>Transportadora: <span className={`font-bold uppercase ${isDark ? 'text-white' : 'text-zinc-700'}`}>{rec.shippingCarrier || 'Correios'}</span></div>
                      <div>Código de Rastreio: <span className={`font-bold select-all ${isDark ? 'text-zinc-200' : 'text-zinc-750'}`}>{rec.trackingCode || 'Não informado'}</span></div>
                    </div>
                  </div>

                  {rec.status !== 'RECEIVED' && (
                    <Button
                      onClick={() => handleUpdateStatus(rec.id, 'RECEIVED')}
                      className="bg-emerald-600 hover:bg-emerald-50 text-white font-black text-[9px] uppercase tracking-widest px-5 h-10 rounded-xl relative z-10 flex-shrink-0 active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
                    >
                      Confirmar Entrega
                    </Button>
                  )}
                </div>
              )) : (
                <div className={`py-24 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 ${
                  isDark ? 'border-white/5 bg-black/10' : 'border-zinc-250 bg-white shadow-sm'
                }`}>
                  <Package className="w-10 h-10 text-zinc-400 animate-pulse" />
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nenhum brinde recebido ou a caminho</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address Config */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-current tracking-tight uppercase">Configurações de Envio</h2>
            <form 
              onSubmit={handleSaveAddress} 
              className={`border rounded-[2.5rem] p-8 space-y-6 shadow-sm relative overflow-hidden group hover:border-orange-500/25 transition-all ${
                isDark ? 'bg-black/35 border-white/5' : 'bg-white border-zinc-200 shadow-md shadow-zinc-100'
              }`}
            >
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Store className="w-20 h-20 text-orange-500" />
              </div>

              <div className="space-y-2 relative z-10">
                <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center justify-between">
                  Endereço Físico (Casa/Estúdio)
                  <span className="text-[8px] font-bold text-zinc-400 capitalize">Para envios diretos</span>
                </label>
                <textarea 
                  placeholder="Rua, Número, Complemento, Bairro, Cidade, Estado, CEP..."
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  className={`w-full border rounded-2xl px-5 py-4 text-xs font-medium min-h-[120px] outline-none transition-all resize-none ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-200 focus:bg-white/10' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-orange-400'
                  }`}
                />
              </div>

              <div className="space-y-2 relative z-10">
                <label className="text-[10px] font-black uppercase text-zinc-500 flex items-center justify-between">
                  Caixa Postal
                  <span className="text-[8px] font-bold text-zinc-400 capitalize">Para envios via Correios</span>
                </label>
                <Input 
                  placeholder="Ex: Caixa Postal 12345, CEP 01234-567"
                  value={poBox}
                  onChange={e => setPoBox(e.target.value)}
                  className={`h-12 text-xs font-bold ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-orange-200' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:bg-white focus:border-orange-400'
                  }`}
                />
              </div>

              <div className={`flex items-center justify-between p-4 border rounded-2xl relative z-10 ${
                isDark ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="space-y-0.5">
                  <p className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-zinc-850'}`}>
                    {shareAddress ? <Eye className="w-3.5 h-3.5 text-orange-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-550" />}
                    Compartilhar Endereço
                  </p>
                  <p className="text-[8px] text-zinc-500 dark:text-zinc-400 font-bold uppercase leading-normal">Exibir endereço no marketplace para marcas parceiras</p>
                </div>
                <input 
                  type="checkbox"
                  checked={shareAddress}
                  onChange={e => setShareAddress(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                disabled={isSavingAddress}
                className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl relative z-10"
              >
                {isSavingAddress ? 'Salvando...' : 'Salvar Endereço'}
              </Button>
            </form>

            <div className={`p-6 border rounded-3xl flex gap-3 text-xs leading-relaxed font-medium ${
              isDark ? 'bg-orange-950/20 border-orange-500/10 text-orange-350' : 'bg-orange-50 border border-orange-200 text-orange-850'
            }`}>
              <Info className="w-5 h-5 flex-shrink-0 text-orange-400" />
              <span>
                <strong>Dica de Segurança:</strong> Se você preferir manter sua privacidade, preencha apenas a Caixa Postal. As marcas cadastradas utilizarão a caixa postal para envio via Correios.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Brand sending modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`border rounded-[2.5rem] w-full max-w-lg p-8 md:p-10 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-250 ${
            isDark ? 'bg-[#0b0b0f] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            
            <header className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-current">Novo Envio de Recebido</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Preencha os dados do pacote para notificar o criador.</p>
            </header>

            <form onSubmit={handleSubmitPackage} className="space-y-6">
              
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-500">Buscar Influenciador (Handle)</label>
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                  <Input 
                    placeholder="Pesquise o handle (ex: @alexsandro)"
                    value={form.influencerHandle ? `@${form.influencerHandle}` : searchQuery}
                    onChange={e => {
                      if (form.influencerHandle) {
                        setForm({...form, influencerId: '', influencerHandle: ''});
                      }
                      handleSearchInfluencer(e.target.value);
                    }}
                    className={`h-12 pl-12 text-xs font-bold focus:border-orange-200 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-650' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-450 focus:bg-white focus:border-orange-400'
                    }`}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-3.5 w-4 h-4 text-orange-500 animate-spin" />
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className={`absolute top-[76px] left-0 right-0 border rounded-2xl max-h-48 overflow-y-auto z-50 divide-y shadow-2xl ${
                    isDark ? 'bg-[#0d0d14] border-white/10 divide-white/5' : 'bg-white border-zinc-200 divide-zinc-100'
                  }`}>
                    {searchResults.map((inf) => (
                      <div 
                        key={inf.id}
                        onClick={() => selectInfluencer(inf)}
                        className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/5">
                          <img src={inf.profileImageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="Influenciador" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-zinc-800'}`}>@{inf.handle}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{inf.niche || 'Geral'} · InfluScore {inf.influScore}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-500">Título do Recebido</label>
                <Input 
                  placeholder="Ex: Kit Maquiagem Coleção Verão"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className={`h-12 text-xs font-bold focus:border-orange-200 ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-650' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-450 focus:bg-white focus:border-orange-400'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-500">Descrição do Conteúdo</label>
                <textarea 
                  placeholder="Descreva brevemente os produtos enviados no brinde..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className={`w-full border rounded-2xl px-5 py-4 text-xs font-medium min-h-[90px] outline-none transition-all resize-none ${
                    isDark 
                      ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-650 focus:border-orange-200 focus:bg-white/10' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-450 focus:bg-white focus:border-orange-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-500">Transportadora</label>
                  <select 
                    value={form.shippingCarrier}
                    onChange={e => setForm({...form, shippingCarrier: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-3 h-12 text-xs font-black outline-none transition-all appearance-none cursor-pointer [color-scheme:dark] ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white focus:border-orange-300' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 focus:border-orange-400 bg-white'
                    }`}
                  >
                     <option value="Correios" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>Correios</option>
                     <option value="Loggi" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>Loggi</option>
                     <option value="DHL" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>DHL</option>
                     <option value="FedEx" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>FedEx</option>
                     <option value="Mandaê" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>Mandaê</option>
                     <option value="Outra" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-800"}>Outra</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-550 dark:text-zinc-500">Código de Rastreio</label>
                  <Input 
                    placeholder="Opcional"
                    value={form.trackingCode}
                    onChange={e => setForm({...form, trackingCode: e.target.value})}
                    className={`h-12 text-xs font-bold focus:border-orange-200 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-zinc-650' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-450 focus:bg-white focus:border-orange-400'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`flex-1 h-12 border font-bold text-[10px] uppercase tracking-widest rounded-xl ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-zinc-200 hover:bg-zinc-150 text-zinc-700'
                  }`}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSendingPackage || !form.influencerId || !form.title}
                  className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-600/10"
                >
                  {isSendingPackage ? 'Enviando...' : 'Registrar Envio'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
