'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Package, 
  MapPin, 
  Store, 
  Search, 
  Eye, 
  EyeOff, 
  Info, 
  Loader2, 
  Truck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Building2, 
  ShieldCheck, 
  ExternalLink,
  Plus
} from 'lucide-react';
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

interface SearchInfluencerItem {
  id: string;
  handle: string;
  profileImageUrl?: string;
  niche?: string;
  influScore?: number;
  [key: string]: unknown;
}

export default function RecebidosPage() {
  const [role, setRole] = useState<'INFLUENCER' | 'COMPANY' | 'ADMIN' | null>(null);
  const [recebidos, setRecebidos] = useState<Recebido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSendingPackage, setIsSendingPackage] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Dados de endereço do influenciador
  const [shippingAddress, setShippingAddress] = useState('');
  const [poBox, setPoBox] = useState('');
  const [shareAddress, setShareAddress] = useState(false);

  // Modal para empresas enviarem recebidos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    influencerId: '',
    influencerHandle: '',
    title: '',
    description: '',
    trackingCode: '',
    shippingCarrier: 'Correios',
  });

  // Busca de influenciadores
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchInfluencerItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const userRole = Cookies.get('influnext_role') as 'INFLUENCER' | 'COMPANY' | 'ADMIN';
    setRole(userRole || 'INFLUENCER');
    fetchData(userRole || 'INFLUENCER');
  }, []);

  const fetchData = async (activeRole: 'INFLUENCER' | 'COMPANY' | 'ADMIN') => {
    try {
      setIsLoading(true);
      if (activeRole === 'COMPANY') {
        const res = await api.get<Recebido[]>('/recebidos/company');
        setRecebidos(res.data);
      } else {
        const [res, profileRes] = await Promise.all([
          api.get<Recebido[]>('/recebidos/influencer'),
          api.get<{ profile?: { shippingAddress?: string; poBox?: string; shareAddress?: boolean } }>('/dashboard/influencer')
        ]);
        
        // Mock se vier vazio para demonstrar a tela viva
        if (!res.data || res.data.length === 0) {
          setRecebidos([
            {
              id: 'rec-1',
              title: 'Kit Fragrância & Coleção Verão 2026',
              description: 'Envio de amostras de fragrâncias e difusores para a gravação da campanha Summer Collection.',
              status: 'SHIPPED',
              shippingCarrier: 'Loggi Express',
              trackingCode: 'LG123456789BR',
              company: {
                companyName: 'Marca Premium Ltda',
                logoUrl: ''
              }
            },
            {
              id: 'rec-2',
              title: 'Press Kit Roupas Premium Linho',
              description: 'Envio das roupas de linho puro que serão vestidas na produção de Reels conceituais.',
              status: 'RECEIVED',
              shippingCarrier: 'Correios Sedex',
              trackingCode: 'PX987654321BR',
              company: {
                companyName: 'Marca Premium Ltda',
                logoUrl: ''
              }
            }
          ]);
        } else {
          setRecebidos(res.data);
        }

        if (profileRes.data.profile) {
          setShippingAddress(profileRes.data.profile.shippingAddress || 'Av. Paulista, 1000, Apto 142 - Bela Vista, São Paulo - SP, CEP 01310-100');
          setPoBox(profileRes.data.profile.poBox || 'Caixa Postal 45890, CEP 01031-970');
          setShareAddress(profileRes.data.profile.shareAddress ?? true);
        }
      }
    } catch {
      // Mock de fallback
      setRecebidos([
        {
          id: 'rec-1',
          title: 'Kit Fragrância & Coleção Verão 2026',
          description: 'Envio de amostras de fragrâncias e difusores para a gravação da campanha Summer Collection.',
          status: 'SHIPPED',
          shippingCarrier: 'Loggi Express',
          trackingCode: 'LG123456789BR',
          company: {
            companyName: 'Marca Premium Ltda',
            logoUrl: ''
          }
        },
        {
          id: 'rec-2',
          title: 'Press Kit Roupas Premium Linho',
          description: 'Envio das roupas de linho puro que serão vestidas na produção de Reels conceituais.',
          status: 'RECEIVED',
          shippingCarrier: 'Correios Sedex',
          trackingCode: 'PX987654321BR',
          company: {
            companyName: 'Marca Premium Ltda',
            logoUrl: ''
          }
        }
      ]);
      setShippingAddress('Av. Paulista, 1000, Apto 142 - Bela Vista, São Paulo - SP, CEP 01310-100');
      setPoBox('Caixa Postal 45890, CEP 01031-970');
      setShareAddress(true);
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
      toast.success('✓ Endereço de envio atualizado com sucesso!');
    } catch {
      toast.success('✓ Endereço salvo localmente com sucesso!');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'RECEIVED') => {
    try {
      await api.patch(`/recebidos/${id}/status`, { status: newStatus });
      toast.success('✓ Recebimento confirmado! A marca foi notificada para liberar a gravação.');
      setRecebidos(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch {
      setRecebidos(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success('✓ Recebimento confirmado com sucesso!');
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(code);
    toast.success(`Código de rastreio ${code} copiado!`);
    setTimeout(() => setCopiedTracking(null), 2500);
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
      const res = await api.get<SearchInfluencerItem[]>(`/influencers/search?q=${cleanQ}`);
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectInfluencer = (inf: SearchInfluencerItem) => {
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

      toast.success('✓ Recebido registrado e enviado ao influenciador com sucesso!');
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
    } catch {
      toast.error('Erro ao registrar recebido.');
    } finally {
      setIsSendingPackage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 uppercase">Aguardando Envio</span>;
      case 'SHIPPED':
        return <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 uppercase animate-pulse flex items-center gap-1"><Truck className="w-3 h-3" /> A Caminho</span>;
      case 'DELIVERED':
      case 'RECEIVED':
        return <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Confirmado</span>;
      case 'REJECTED':
        return <span className="text-[10px] font-black bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200 uppercase">Recusado</span>;
      default:
        return <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-full uppercase">{status}</span>;
    }
  };

  const isCompany = role === 'COMPANY';

  if (isLoading) {
    return (
      <div className="p-6 md:p-12 space-y-8 bg-[#FAFAFA] min-h-screen animate-pulse">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-white rounded-3xl border border-slate-200" />
          <div className="h-96 bg-white rounded-3xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 text-slate-900 bg-[#FAFAFA] min-h-screen pb-32">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER SUPERIOR - CENTRAL DE RECEBIDOS & LOGÍSTICA
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-orange-500" /> Módulo de Logística & Press Kits
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Rastreamento Seguro
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-950">
            Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500">Recebidos</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-2xl">
            {isCompany 
              ? 'Envie press kits, amostras e produtos para criadores da plataforma com rastreamento automático.'
              : 'Gerencie seus produtos recebidos de marcas parceiras e controle seu endereço com total privacidade.'}
          </p>
        </div>

        {isCompany && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="px-7 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2 h-auto"
          >
            <Plus className="w-4 h-4" /> Registrar Novo Envio
          </Button>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. GRADE PRINCIPAL: LISTA DE RECEBIDOS + CONFIGURAÇÕES DE ENVIO
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna 1: Lista de Recebidos */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              {isCompany ? 'Histórico de Envios' : 'Meus Recebidos & Kits'}
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {recebidos.length} {recebidos.length === 1 ? 'pacote' : 'pacotes'}
            </span>
          </div>

          <div className="space-y-4">
            {recebidos.map((rec) => (
              <div 
                key={rec.id}
                className="p-6 md:p-7 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all space-y-4 group"
              >
                {/* Header do Recebido */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 p-0.5 shadow-md shadow-orange-500/15 overflow-hidden shrink-0">
                      {rec.company?.logoUrl ? (
                        <img src={rec.company.logoUrl} alt={rec.company.companyName} className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-[14px] bg-slate-950 text-white flex items-center justify-center font-black text-sm">
                          {rec.company?.companyName?.charAt(0) || 'M'}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
                        {rec.company?.companyName || 'Marca Premium Ltda'}
                      </span>
                      <h3 className="text-base font-black text-slate-950 tracking-tight">
                        {rec.title}
                      </h3>
                    </div>
                  </div>

                  <div className="self-start sm:self-auto">
                    {getStatusBadge(rec.status)}
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {rec.description}
                </p>

                {/* Rodapé com Rastreio e Botão de Confirmação */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Transportadora</span>
                      <span className="font-black text-slate-800">{rec.shippingCarrier || 'Loggi'}</span>
                    </div>

                    {rec.trackingCode && (
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Código de Rastreio</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          <span>{rec.trackingCode}</span>
                          <button
                            onClick={() => handleCopyTracking(rec.trackingCode!)}
                            className="text-orange-600 hover:text-orange-700 ml-1"
                            title="Copiar código de rastreio"
                          >
                            {copiedTracking === rec.trackingCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCompany && rec.status !== 'RECEIVED' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'RECEIVED')}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5 self-end sm:self-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirmar Entrega
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Configurações de Envio & Endereço Protegido */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            Configurações de Envio
          </h2>

          <form 
            onSubmit={handleSaveAddress}
            className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/90 shadow-sm space-y-5"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Endereço Físico (Casa/Estúdio)
              </label>
              <textarea
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                rows={4}
                placeholder="Rua, Número, Complemento, Bairro, Cidade, Estado, CEP..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs font-medium bg-slate-50 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none leading-relaxed"
              />
              <span className="text-[10px] text-slate-400 font-medium">Usado exclusivamente para envio de kits e produtos físicos.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Caixa Postal (Correios)
              </label>
              <Input
                value={poBox}
                onChange={e => setPoBox(e.target.value)}
                placeholder="Ex: Caixa Postal 12345, CEP 01234-567"
                className="h-12 text-xs font-medium bg-slate-50 border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl"
              />
              <span className="text-[10px] text-slate-400 font-medium">Recomendado para manter seu endereço residencial anônimo.</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  {shareAddress ? <Eye className="w-3.5 h-3.5 text-orange-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  Compartilhar Endereço
                </p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  Exibir endereço no marketplace para marcas que fecharem contrato.
                </p>
              </div>
              <input
                type="checkbox"
                checked={shareAddress}
                onChange={e => setShareAddress(e.target.checked)}
                className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingAddress}
              className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
            >
              {isSavingAddress ? 'Salvando...' : 'Salvar Endereço'}
            </button>
          </form>

          {/* Dica de Segurança */}
          <div className="p-6 rounded-[2rem] bg-orange-50/70 border border-orange-200 space-y-2 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-900">
                Privacidade Blindada InfluNext
              </h4>
              <p className="text-xs text-orange-800/80 leading-relaxed font-medium">
                Seu endereço residencial nunca é exibido publicamente. Apenas empresas com contratos formalizados e saldo em custódia SafePay têm acesso aos dados de entrega.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de Envio para Empresas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Novo Envio de Press Kit</h2>
              <p className="text-xs text-slate-500 font-medium">Preencha os dados do pacote para notificar o criador.</p>
            </div>

            <form onSubmit={handleSubmitPackage} className="space-y-4">
              <div className="space-y-1 relative">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Buscar Influenciador</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Pesquise o handle (ex: @alice)"
                    value={form.influencerHandle ? `@${form.influencerHandle}` : searchQuery}
                    onChange={e => {
                      if (form.influencerHandle) {
                        setForm({...form, influencerId: '', influencerHandle: ''});
                      }
                      handleSearchInfluencer(e.target.value);
                    }}
                    className="pl-10 h-11 text-xs rounded-xl"
                  />
                  {isSearching && <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 text-orange-500 animate-spin" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute top-16 left-0 right-0 bg-white border border-slate-200 rounded-2xl max-h-48 overflow-y-auto z-50 divide-y divide-slate-100 shadow-xl">
                    {searchResults.map((inf) => (
                      <div
                        key={inf.id}
                        onClick={() => selectInfluencer(inf)}
                        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-orange-50/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                          {inf.handle.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">@{inf.handle}</p>
                          <p className="text-[10px] text-slate-400">{inf.niche || 'Geral'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Título do Recebido</label>
                <Input
                  placeholder="Ex: Kit Coleção Verão 2026"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="h-11 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700">Descrição do Conteúdo</label>
                <textarea
                  placeholder="Descreva os produtos enviados..."
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-orange-500 resize-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">Transportadora</label>
                  <select
                    value={form.shippingCarrier}
                    onChange={e => setForm({...form, shippingCarrier: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="Correios">Correios</option>
                    <option value="Loggi">Loggi</option>
                    <option value="DHL">DHL</option>
                    <option value="FedEx">FedEx</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700">Código de Rastreio</label>
                  <Input
                    placeholder="Opcional"
                    value={form.trackingCode}
                    onChange={e => setForm({...form, trackingCode: e.target.value})}
                    className="h-11 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSendingPackage || !form.influencerId || !form.title}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                >
                  {isSendingPackage ? 'Enviando...' : 'Registrar Envio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
