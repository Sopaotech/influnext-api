'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api, searchInfluencers, createContract, InfluencerSearchItem } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ArrowLeft, 
  Sparkles, 
  FileText, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Clock, 
  HelpCircle,
  Building2,
  User,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

const deliverableItemSchema = z.object({
  title: z.string().min(3, 'O título do entregável é obrigatório.'),
  type: z.string().min(1, 'O tipo é obrigatório.'),
  dueDate: z.string().min(1, 'A data limite é obrigatória.')
});

const formSchema = z.object({
  influencerId: z.string().min(1, 'Selecione um influenciador.'),
  contractType: z.enum(['SPOT', 'RETAINER']),
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  budget: z.coerce.number().min(50, 'O orçamento mínimo para custódia SafePay é R$ 50,00.'),
  briefing: z.string().min(10, 'O briefing deve conter orientações claras.'),
  exclusivityDays: z.coerce.number().int().min(0),
  usageRightsDays: z.coerce.number().int().min(1),
  allowPaidMedia: z.boolean(),
  deliverables: z.array(deliverableItemSchema).min(1, 'Adicione pelo menos um entregável.'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'Você precisa aceitar os termos jurídicos e a custódia SafePay Escrow.'
  })
});

type FormValues = z.infer<typeof formSchema>;

function NewContractWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const influencerIdParam = searchParams.get('influencerId');
  const handleParam = searchParams.get('handle');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<InfluencerSearchItem[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerSearchItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

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

  const { register, control, handleSubmit, setValue, watch, getValues, trigger, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      contractType: 'SPOT',
      title: '',
      budget: 1000,
      briefing: '',
      exclusivityDays: 0,
      usageRightsDays: 30,
      allowPaidMedia: false,
      termsAccepted: false,
      deliverables: [{ title: '1x Reels com Demonstração e Menção Oficial', type: 'REEL', dueDate: '' }]
    }
  });

  const watchedBudget = watch('budget') || 0;
  const watchedContractType = watch('contractType');
  const watchedExclusivity = watch('exclusivityDays');
  const watchedUsageRights = watch('usageRightsDays');
  const watchedPaidMedia = watch('allowPaidMedia');
  const watchedTitle = watch('title');
  const watchedBriefing = watch('briefing');
  const watchedDeliverables = watch('deliverables');

  // Cálculo transparente de taxas SafePay (15% padrão)
  const platformFee = watchedBudget * 0.15;
  const netAmount = watchedBudget - platformFee;

  useEffect(() => {
    if (influencerIdParam && handleParam) {
      const inf: InfluencerSearchItem = {
        id: influencerIdParam,
        handle: handleParam,
        verifiedMetrics: true
      };
      setSelectedInfluencer(inf);
      setValue('influencerId', inf.id, { shouldValidate: true });
    }
  }, [influencerIdParam, handleParam, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'deliverables'
  });

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchTerm(q);
    
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await searchInfluencers(q);
      setSearchResults(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectInfluencer = (inf: InfluencerSearchItem) => {
    setSelectedInfluencer(inf);
    setValue('influencerId', inf.id, { shouldValidate: true });
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleNextFromStep1 = async () => {
    const isStep1Valid = await trigger(['influencerId', 'contractType', 'deliverables']);
    if (!selectedInfluencer) {
      toast.error('Selecione um influenciador para continuar.');
      return;
    }
    if (isStep1Valid) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextFromStep2 = async () => {
    const isStep2Valid = await trigger(['title', 'budget', 'briefing', 'exclusivityDays', 'usageRightsDays']);
    if (isStep2Valid) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAIBriefing = async () => {
    if (!selectedInfluencer) {
      toast.error('Selecione um influenciador primeiro.');
      return;
    }
    setIsGeneratingBriefing(true);
    const loadingToast = toast.loading('✦ IA analisando nicho e gerando briefing...');
    try {
      const res = await api.post<{ briefing: string }>('/ai/generate-briefing', {
        influencerHandle: selectedInfluencer.handle,
        campaignTitle: getValues('title') || 'Campanha de Marketing'
      });
      setValue('briefing', res.data.briefing, { shouldValidate: true });
      toast.dismiss(loadingToast);
      toast.success('✦ Briefing gerado com sucesso pela IA!');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Falha ao gerar briefing automático.');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        influencerId: data.influencerId,
        title: data.title,
        budget: data.budget,
        briefing: data.briefing,
        contractType: data.contractType,
        exclusivityDays: data.exclusivityDays,
        usageRightsDays: data.usageRightsDays,
        allowPaidMedia: data.allowPaidMedia,
        deliverables: data.deliverables,
        legalTerms: {
          conarCompliance: true,
          autoReleaseDays: 5,
          exclusivityDays: data.exclusivityDays,
          usageRightsDays: data.usageRightsDays,
          allowPaidMedia: data.allowPaidMedia,
          contractType: data.contractType,
          createdAt: new Date().toISOString()
        }
      };

      await createContract(payload);
      toast.success('Proposta formal e Minuta Jurídica enviadas com sucesso ao Creator!');
      router.push('/dashboard/contracts');
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(errorObj.response?.data?.message || errorObj.response?.data?.error || 'Erro ao criar o contrato.');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-28">
      
      {/* Top Header */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${
        isDark ? 'border-zinc-800/80' : 'border-zinc-200'
      }`}>
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/company" 
            className={`p-2.5 border rounded-xl transition-colors shadow-sm ${
              isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-650 hover:text-zinc-950'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-orange-500 tracking-widest uppercase">
              <Scale className="w-4 h-4" /> Governança & Blindagem Jurídica
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Nova Proposta de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">Contrato Oficial</span>
            </h1>
          </div>
        </div>

        {/* Wizard Stepper Indicators */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {[
            { num: 1, label: 'Escopo & Creator' },
            { num: 2, label: 'Valores & Cláusulas' },
            { num: 3, label: 'Minuta & Assinatura' }
          ].map(s => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div 
                key={s.num}
                onClick={() => {
                  if (s.num === 1) setStep(1);
                  else if (s.num === 2 && selectedInfluencer) setStep(2);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-sm' 
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isActive ? 'bg-orange-500 text-white' : isDone ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isDone ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* ══════════════════════════════════════════════════════════════════════
            PASSO 1: INFLUENCIADOR & ENTREGÁVEIS
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* 1.1 Seleção do Influenciador */}
            <section className={`border rounded-2xl p-6 md:p-8 shadow-xl space-y-6 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-400" />
                    1. Influenciador Contratado
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Selecione o criador que executará a campanha com métricas auditadas.</p>
                </div>
              </div>

              {!selectedInfluencer ? (
                <div className="relative space-y-3">
                  <div className={`flex items-center border rounded-xl px-4 py-3 focus-within:ring-2 ring-orange-500/50 transition-all ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <Search className="w-5 h-5 text-zinc-500 mr-3 shrink-0" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={handleSearch}
                      placeholder="Buscar por @handle do influenciador (ex: thiago)..." 
                      className="bg-transparent border-none focus:outline-none w-full text-zinc-100 placeholder:text-zinc-500 text-sm font-medium"
                    />
                  </div>

                  {isSearching && (
                    <div className="p-4 text-center text-xs font-bold text-orange-400 bg-zinc-900 border border-zinc-800 rounded-xl">
                      Pesquisando base neural de criadores...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <ul className="border border-zinc-800 rounded-xl max-h-64 overflow-y-auto divide-y divide-zinc-800 bg-zinc-900 shadow-2xl z-10">
                      {searchResults.map(inf => (
                        <li 
                          key={inf.id}
                          onClick={() => selectInfluencer(inf)}
                          className="p-4 hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                              {inf.handle.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">@{inf.handle}</p>
                              <span className="text-[10px] text-zinc-400 uppercase font-bold">{inf.niche || 'Criador Verificado'}</span>
                            </div>
                          </div>
                          {inf.verifiedMetrics && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <ShieldCheck className="w-3.5 h-3.5" /> Métricas Auditadas (SHA-256)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.influencerId && <p className="text-red-400 text-xs font-medium">{errors.influencerId.message}</p>}
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                      {selectedInfluencer.handle.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-extrabold text-white text-base">@{selectedInfluencer.handle}</p>
                        {selectedInfluencer.verifiedMetrics && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Auditado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">{selectedInfluencer.niche || 'Influenciador Digital Profissional'}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedInfluencer(null);
                      setValue('influencerId', '');
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-red-400 bg-zinc-900 border border-zinc-800 transition-colors"
                  >
                    Trocar Creator
                  </button>
                </div>
              )}
            </section>

            {/* 1.2 Tipo de Contrato */}
            <section className={`border rounded-2xl p-6 md:p-8 shadow-xl space-y-4 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
            }`}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                2. Modalidade do Contrato
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  watchedContractType === 'SPOT' 
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm uppercase tracking-wider text-orange-400">SPOT (Ação Pontual)</span>
                    <input 
                      type="radio" 
                      value="SPOT" 
                      {...register('contractType')} 
                      className="accent-orange-500"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Ideal para campanhas de lançamento, publiposts, reels ou pacotes de stories com prazos de entrega específicos.
                  </p>
                </label>

                <label className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  watchedContractType === 'RETAINER' 
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm uppercase tracking-wider text-orange-400">RETAINER (Embaixador Mensal)</span>
                    <input 
                      type="radio" 
                      value="RETAINER" 
                      {...register('contractType')} 
                      className="accent-orange-500"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Parceria continuada de embaixador de marca com frequência recorrente de entregas e garantia de custódia mensal.
                  </p>
                </label>
              </div>
            </section>

            {/* 1.3 Entregáveis */}
            <section className={`border rounded-2xl p-6 md:p-8 shadow-xl space-y-6 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-400" />
                    3. Relação de Entregáveis (Deliverables)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Especifique cada peça que o criador deverá produzir, o formato e o prazo.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => append({ title: '', type: 'REEL', dueDate: '' })}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Adicionar Peça
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-4 shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      
                      <div className="md:col-span-5 space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Descrição da Peça</label>
                        <input 
                          {...register(`deliverables.${index}.title` as const)}
                          placeholder="Ex: 1 Reels de 60s mostrando o unboxing"
                          className="w-full border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs bg-zinc-900 text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        {errors.deliverables?.[index]?.title && (
                          <p className="text-red-400 text-[10px] font-medium">{errors.deliverables[index].title?.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Formato</label>
                        <select 
                          {...register(`deliverables.${index}.type` as const)}
                          className="w-full border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs bg-zinc-900 text-white focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
                        >
                          <option value="REEL">Instagram Reel (Vídeo)</option>
                          <option value="STORY">Instagram Stories (Combo)</option>
                          <option value="TIKTOK">TikTok Vídeo</option>
                          <option value="YOUTUBE">YouTube Integração</option>
                          <option value="FEED_POST">Post Feed / Collab</option>
                        </select>
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prazo Final</label>
                        <input 
                          type="date"
                          {...register(`deliverables.${index}.dueDate` as const)}
                          className="w-full border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs bg-zinc-900 text-white focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark]"
                        />
                        {errors.deliverables?.[index]?.dueDate && (
                          <p className="text-red-400 text-[10px] font-medium">{errors.deliverables[index].dueDate?.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-1 flex justify-end md:pt-6">
                        {fields.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => remove(index)}
                            className="p-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                            title="Remover entregável"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-8 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                Próximo: Valores & Cláusulas Jurídicas
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PASSO 2: FINANCEIRO, IA & CLÁUSULAS JURÍDICAS
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* 2.1 Identificação e Financeiro */}
            <section className={`border rounded-2xl p-6 md:p-8 shadow-xl space-y-6 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
            }`}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800/60 pb-4">
                <DollarSign className="w-5 h-5 text-orange-400" />
                1. Título da Campanha e Custódia SafePay Escrow
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Título Oficial da Campanha</label>
                  <input 
                    {...register('title')} 
                    placeholder="Ex: Campanha Primavera 2026 - Lançamento da Coleção"
                    className="w-full border border-zinc-800 rounded-xl px-4 py-3 text-sm bg-zinc-950 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  {errors.title && <p className="text-red-400 text-xs font-medium">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Orçamento Bruto em Escrow (BRL R$)</label>
                  <input 
                    type="number"
                    {...register('budget')} 
                    placeholder="Ex: 3500"
                    className="w-full border border-zinc-800 rounded-xl px-4 py-3 text-lg font-extrabold bg-zinc-950 text-emerald-400 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  {errors.budget && <p className="text-red-400 text-xs font-medium">{errors.budget.message}</p>}
                </div>
              </div>

              {/* Box de Transparência SafePay */}
              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Depósito em Custódia</span>
                  <p className="text-lg font-black text-white">
                    R$ {Number(watchedBudget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1 border-y sm:border-y-0 sm:border-x border-zinc-800 py-2 sm:py-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Taxa InfluNext (15%)</span>
                  <p className="text-lg font-black text-orange-400">
                    R$ {Number(platformFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Líquido do Criador</span>
                  <p className="text-lg font-black text-emerald-400">
                    R$ {Number(netAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </section>

            {/* 2.2 Briefing e Roteiro com IA */}
            <section className={`border rounded-2xl p-6 md:p-8 shadow-xl space-y-4 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    2. Briefing e Diretrizes da Campanha
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Orientações de tom de voz, mensagens-chave, hashtags e objetivos.</p>
                </div>

                <button 
                  type="button"
                  onClick={handleAIBriefing}
                  disabled={isGeneratingBriefing}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mágica IA
                </button>
              </div>

              <textarea 
                {...register('briefing')}
                rows={5}
                placeholder="Descreva o que o influenciador deve destacar, cuidados a tomar, links ou cupons a divulgar e requisitos visuais..."
                className="w-full border border-zinc-800 rounded-xl p-4 text-xs leading-relaxed bg-zinc-950 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {errors.briefing && <p className="text-red-400 text-xs font-medium">{errors.briefing.message}</p>}
            </section>

            {/* 2.3 Blindagem Jurídica e Cláusulas Customizadas */}
            <section className={`border rounded-2xl p-6 md:p-8 shadow-xl space-y-6 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200'
            }`}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800/60 pb-4">
                <Scale className="w-5 h-5 text-orange-400" />
                3. Cláusulas e Blindagem Jurídica
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Exclusividade */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Exclusividade Setorial</label>
                  <select 
                    {...register('exclusivityDays')}
                    className="w-full border border-zinc-800 rounded-xl px-3 py-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-orange-500 [color-scheme:dark]"
                  >
                    <option value={0}>Sem exclusividade (Livre)</option>
                    <option value={15}>15 dias de exclusividade</option>
                    <option value={30}>30 dias de exclusividade</option>
                    <option value={60}>60 dias de exclusividade</option>
                  </select>
                  <p className="text-[10px] text-zinc-500">Período em que o criador não poderá divulgar concorrentes diretos.</p>
                </div>

                {/* Direitos de Imagem */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Cessão de Imagem e Voz</label>
                  <select 
                    {...register('usageRightsDays')}
                    className="w-full border border-zinc-800 rounded-xl px-3 py-2 text-xs bg-zinc-900 text-white focus:outline-none focus:border-orange-500 [color-scheme:dark]"
                  >
                    <option value={30}>30 dias de uso de imagem</option>
                    <option value={90}>90 dias de uso de imagem</option>
                    <option value={180}>180 dias de uso de imagem</option>
                    <option value={365}>365 dias (1 ano completo)</option>
                  </select>
                  <p className="text-[10px] text-zinc-500">Prazo de veiculação e exibição autorizada do conteúdo.</p>
                </div>

                {/* Tráfego Pago / Dark Post */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Tráfego Pago (Dark Post)</label>
                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="allowPaidMedia"
                      {...register('allowPaidMedia')}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <label htmlFor="allowPaidMedia" className="text-xs text-white font-medium cursor-pointer">
                      Permitir anúncios patrocinados
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-500">Autorização para rodar Meta Ads / TikTok Ads usando o conteúdo.</p>
                </div>

              </div>
            </section>

            {/* Step 2 Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors"
              >
                Voltar ao Passo 1
              </button>

              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-8 py-3.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                Próximo: Revisar Minuta Jurídica
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PASSO 3: MINUTA JURÍDICA OFICIAL & ASSINATURA ELETRÔNICA
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Live Legal Document Preview */}
            <section className="border border-zinc-800 rounded-2xl bg-zinc-950 p-6 md:p-10 shadow-2xl space-y-8 text-zinc-300 text-xs leading-relaxed">
              
              {/* Header Documento */}
              <div className="text-center pb-6 border-b border-zinc-800 space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-black text-orange-500 tracking-widest uppercase">
                  <ShieldCheck className="w-4 h-4" /> InfluNext SafePay Escrow // Minuta Legal
                </div>
                <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
                  Contrato de Prestação de Serviços de Publicidade Digital e Licenciamento de Imagem
                </h1>
                <p className="text-[11px] text-zinc-500">
                  Pré-visualização gerada em tempo real com base nos parâmetros acordados.
                </p>
              </div>

              {/* Partes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
                  <span className="text-[10px] font-bold text-orange-400 uppercase">Contratante (Empresa)</span>
                  <p className="font-bold text-white text-sm">Sua Empresa (Contratante)</p>
                  <p className="text-zinc-400">Modalidade: <span className="text-zinc-200 font-bold">{watchedContractType}</span></p>
                  <p className="text-zinc-400">Status: <span className="text-emerald-400 font-semibold">Assinatura em andamento</span></p>
                </div>
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 space-y-1">
                  <span className="text-[10px] font-bold text-orange-400 uppercase">Contratado (Creator)</span>
                  <p className="font-bold text-white text-sm">@{selectedInfluencer?.handle || 'Influenciador'}</p>
                  <p className="text-zinc-400">Nicho: <span className="text-zinc-200">{selectedInfluencer?.niche || 'Geral'}</span></p>
                  <p className="text-zinc-400">Status: <span className="text-orange-400 font-semibold">Aguardando envio para aceite</span></p>
                </div>
              </div>

              {/* As 7 Cláusulas Oficiais */}
              <div className="space-y-4 text-zinc-300">
                <h3 className="font-black text-xs uppercase tracking-wider text-orange-400 border-b border-zinc-800 pb-2">
                  Cláusulas e Condições Contratuais
                </h3>

                <div className="space-y-3">
                  <p>
                    <strong>Cláusula 1ª (Do Objeto):</strong> A CONTRATADA compromete-se a produzir e veicular os entregáveis da campanha <strong>"{watchedTitle}"</strong> conforme briefing: <em>"{watchedBriefing}"</em>.
                  </p>
                  <p>
                    <strong>Cláusula 2ª (Uso de Imagem & Mídia):</strong> Fica acordado o licenciamento de imagem por <strong>{watchedUsageRights} dias</strong>. {watchedPaidMedia ? 'Autorizado o impulsionamento via tráfego pago.' : 'Uso restrito às mídias orgânicas.'}
                  </p>
                  <p>
                    <strong>Cláusula 3ª (Conformidade CONAR):</strong> Obrigatória a identificação publicitária transparente (#publi ou tag de parceria paga).
                  </p>
                  <p>
                    <strong>Cláusula 4ª (Exclusividade):</strong> {watchedExclusivity > 0 ? `Vigente exclusividade setorial por ${watchedExclusivity} dias.` : 'Sem cláusula de exclusividade setorial.'}
                  </p>
                  <p>
                    <strong>Cláusula 5ª (Ajustes e Qualidade):</strong> Direito a até 2 rodadas de revisões pontuais pré-publicação para garantir conformidade com o briefing.
                  </p>
                  <p>
                    <strong>Cláusula 6ª (SafePay Escrow):</strong> O valor de <strong>R$ {Number(watchedBudget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ficará retido em custódia até a validação da entrega, com prazo de auto-release de 5 dias úteis.
                  </p>
                  <p>
                    <strong>Cláusula 7ª (Validade e Assinatura Eletrônica):</strong> As partes reconhecem a validade executiva do presente contrato firmado sob carimbo criptográfico SHA-256 (MP 2.200-2/01 e Lei 14.063/20).
                  </p>
                </div>
              </div>

              {/* Tabela de Entregáveis */}
              <div className="space-y-2 border-t border-zinc-800 pt-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-orange-400">Anexo I: Entregáveis Registrados</h4>
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Entregável</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Data Limite</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {watchedDeliverables.map((d, i) => (
                        <tr key={i} className="hover:bg-zinc-900/30">
                          <td className="p-3 font-medium text-white">{d.title || `Item #${i+1}`}</td>
                          <td className="p-3 text-zinc-400 font-mono">{d.type}</td>
                          <td className="p-3 text-zinc-300">{d.dueDate ? new Date(d.dueDate).toLocaleDateString('pt-BR') : 'A definir'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </section>

            {/* Checkbox de Aceite Legal */}
            <div className={`p-6 rounded-2xl border ${
              errors.termsAccepted ? 'border-red-500 bg-red-950/10' : 'border-zinc-800 bg-zinc-900/40'
            } space-y-3`}>
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox"
                  id="termsAccepted"
                  {...register('termsAccepted')}
                  className="w-5 h-5 accent-orange-500 rounded mt-0.5"
                />
                <label htmlFor="termsAccepted" className="text-xs text-zinc-200 leading-relaxed cursor-pointer font-medium">
                  Declaro que li e concordo com os termos da presente Minuta Jurídica e com a retenção do valor em custódia <strong>InfluNext SafePay Escrow</strong>, autorizando a emissão da proposta com assinatura eletrônica vinculante.
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="text-red-400 text-xs font-bold pl-8">{errors.termsAccepted.message}</p>
              )}
            </div>

            {/* Step 3 Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors"
              >
                Voltar ao Passo 2
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 rounded-xl text-base font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  'Assinando e Emitindo Contrato...'
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Assinar e Enviar Proposta em Escrow
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </form>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <React.Suspense fallback={<div className="p-10 text-zinc-400 text-center animate-pulse">Carregando gerador de contratos...</div>}>
      <NewContractWizard />
    </React.Suspense>
  );
}
