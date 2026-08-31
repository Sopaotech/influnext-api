'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  Scale,
  DollarSign,
  Briefcase,
  AlertCircle,
  Check,
  Zap,
  Layers,
  FileCheck,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

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

function NewContractWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const influencerIdParam = searchParams.get('influencerId');
  const handleParam = searchParams.get('handle');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<InfluencerSearchItem[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerSearchItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  const { register, control, handleSubmit, setValue, watch, getValues, trigger, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      contractType: 'SPOT',
      title: '',
      budget: 1500,
      briefing: '',
      exclusivityDays: 15,
      usageRightsDays: 90,
      allowPaidMedia: true,
      termsAccepted: false,
      deliverables: [
        { title: '1x Reels com Demonstração de Produto e Menção Oficial', type: 'REEL', dueDate: '' },
        { title: 'Combo 3x Stories com Link Direto e Cupom', type: 'STORY', dueDate: '' }
      ]
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

  // Taxa transparente SafePay (15%)
  const platformFee = watchedBudget * 0.15;
  const netAmount = watchedBudget - platformFee;

  const getAvatarUrl = (handle?: string) => {
    if (!handle) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop';
    if (handle.includes('pedro')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop';
    if (handle.includes('lucas')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop';
    if (handle.includes('sandbox')) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop';
    if (handle.includes('teste')) return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop';
  };

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
    } catch {
      // Fallback local se busca falhar
      setSearchResults([
        { id: 'demo-inf', handle: 'demo.influencer', verifiedMetrics: true, niche: 'Fashion & Lifestyle' },
        { id: 'pedro-inf', handle: 'pedro_ph', verifiedMetrics: true, niche: 'Fotografia & Direção' },
        { id: 'lucas-inf', handle: 'lucas_filmes', verifiedMetrics: true, niche: 'Produção Audiovisual' }
      ]);
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
    } catch {
      toast.dismiss(loadingToast);
      // Fallback rico
      const fallbackBriefing = `OBJETIVO DA CAMPANHA: Divulgação oficial de lançamento com foco em conversão e engajamento genuíno.\n\nDIRETRIZES DE CRIAÇÃO:\n- Mostrar o produto no corpo/uso real nos primeiros 3 segundos (gancho viral).\n- Destacar os benefícios exclusivos, cupom de desconto personalizado e link direto no sticker.\n- Tom de voz autêntico, espontâneo e em alinhamento com a estética do feed.\n- Menção clara à conta oficial da marca (@marcapremium) e uso da hashtag oficial.`;
      setValue('briefing', fallbackBriefing, { shouldValidate: true });
      toast.success('✦ Briefing sugerido inserido!');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const onSubmit = async (formData: FormValues) => {
    try {
      const payload = {
        influencerId: formData.influencerId,
        title: formData.title,
        budget: formData.budget,
        briefing: formData.briefing,
        contractType: formData.contractType,
        exclusivityDays: formData.exclusivityDays,
        usageRightsDays: formData.usageRightsDays,
        allowPaidMedia: formData.allowPaidMedia,
        deliverables: formData.deliverables,
        legalTerms: {
          conarCompliance: true,
          autoReleaseDays: 2,
          exclusivityDays: formData.exclusivityDays,
          usageRightsDays: formData.usageRightsDays,
          allowPaidMedia: formData.allowPaidMedia,
          contractType: formData.contractType,
          createdAt: new Date().toISOString()
        }
      };

      await createContract(payload);
      toast.success('🎉 Proposta formal e Minuta Jurídica emitidas com sucesso!');
      router.push('/dashboard/contracts');
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { error?: string; message?: string } } };
      toast.error(errorObj.response?.data?.message || errorObj.response?.data?.error || 'Erro ao criar o contrato.');
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#FAFAFA] text-slate-900 pb-32">
      
      {/* ══════════════════════════════════════════════════════════════════════
          SOMBREAMENTO AMBIENTAL LARANJA SUAVE (AMBIENT LIGHT GLOW)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-orange-500/[0.08] via-amber-500/[0.03] to-transparent blur-[100px] rounded-full -z-0" />

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* ══════════════════════════════════════════════════════════════════════
            HEADER SUPERIOR WIDESCREEN & STEPPER
        ══════════════════════════════════════════════════════════════════════ */}
        <header className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/company" 
              className="p-3 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-orange-600 tracking-wider uppercase">
                <Scale className="w-4 h-4" /> Governança & Blindagem Jurídica SafePay
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">
                Nova Proposta de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Contrato Oficial</span>
              </h1>
            </div>
          </div>

          {/* Wizard Stepper Pills */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {[
              { num: 1, label: '1. Escopo & Creator' },
              { num: 2, label: '2. Valores & Cláusulas' },
              { num: 3, label: '3. Minuta & Emissão' }
            ].map(s => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  type="button"
                  key={s.num}
                  onClick={() => {
                    if (s.num === 1) setStep(1);
                    else if (s.num === 2 && selectedInfluencer) setStep(2);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                    isActive 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm' 
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isActive 
                      ? 'bg-orange-600 text-white' 
                      : isDone 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {isDone ? '✓' : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* ══════════════════════════════════════════════════════════════════════
              PASSO 1: INFLUENCIADOR, MODALIDADE & ENTREGÁVEIS
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* 1.1 Seleção do Influenciador */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-600" />
                      1. Influenciador Contratado
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Selecione o criador que executará a campanha com métricas auditadas.</p>
                  </div>
                </div>

                {!selectedInfluencer ? (
                  <div className="relative space-y-3">
                    <div className="flex items-center border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                      <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                      <input 
                        type="text" 
                        value={searchTerm}
                        onChange={handleSearch}
                        placeholder="Buscar por @handle do influenciador (ex: demo.influencer, pedro_ph)..." 
                        className="bg-transparent border-none focus:outline-none w-full text-slate-900 placeholder:text-slate-400 text-sm font-medium"
                      />
                    </div>

                    {isSearching && (
                      <div className="p-4 text-center text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-2xl">
                        Pesquisando base auditada de criadores...
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <ul className="border border-slate-200 rounded-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 bg-white shadow-xl">
                        {searchResults.map(inf => (
                          <li 
                            key={inf.id}
                            onClick={() => selectInfluencer(inf)}
                            className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={getAvatarUrl(inf.handle)} 
                                alt={inf.handle} 
                                className="w-10 h-10 rounded-full object-cover border border-orange-500/20"
                              />
                              <div>
                                <p className="font-black text-slate-900 text-sm">@{inf.handle}</p>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">{inf.niche || 'Criador Verificado'}</span>
                              </div>
                            </div>
                            {inf.verifiedMetrics && (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Auditado SHA-256
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors.influencerId && <p className="text-red-600 text-xs font-bold">{errors.influencerId.message}</p>}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={getAvatarUrl(selectedInfluencer.handle)} 
                          alt={selectedInfluencer.handle} 
                          className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-0.5 rounded-full border-2 border-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-950 text-lg">@{selectedInfluencer.handle}</p>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Auditado
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{selectedInfluencer.niche || 'Fashion & Lifestyle Creator'}</p>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedInfluencer(null);
                        setValue('influencerId', '');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-black text-slate-600 hover:text-red-600 bg-white border border-slate-200 hover:border-red-200 transition-all shadow-sm"
                    >
                      Trocar Creator
                    </button>
                  </div>
                )}
              </section>

              {/* 1.2 Modalidade do Contrato */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-4">
                <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  2. Modalidade da Parceria
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    watchedContractType === 'SPOT' 
                      ? 'bg-orange-50/50 border-orange-500 shadow-md shadow-orange-500/10' 
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm uppercase tracking-wide text-orange-600 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> SPOT (Ação Pontual)
                      </span>
                      <input 
                        type="radio" 
                        value="SPOT" 
                        {...register('contractType')} 
                        className="w-4 h-4 accent-orange-600"
                      />
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Ideal para campanhas de lançamento, publiposts, reels ou pacotes de stories com prazos de entrega específicos.
                    </p>
                  </label>

                  <label className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    watchedContractType === 'RETAINER' 
                      ? 'bg-orange-50/50 border-orange-500 shadow-md shadow-orange-500/10' 
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm uppercase tracking-wide text-orange-600 flex items-center gap-2">
                        <Layers className="w-4 h-4" /> RETAINER (Embaixador Mensal)
                      </span>
                      <input 
                        type="radio" 
                        value="RETAINER" 
                        {...register('contractType')} 
                        className="w-4 h-4 accent-orange-600"
                      />
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Parceria continuada de embaixador de marca com frequência recorrente de entregas e garantia de custódia mensal.
                    </p>
                  </label>
                </div>
              </section>

              {/* 1.3 Entregáveis */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-600" />
                      3. Peças & Entregáveis Acordados
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Especifique cada peça que o criador deverá produzir, o formato e o prazo.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => append({ title: '', type: 'REEL', dueDate: '' })}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" /> Adicionar Peça
                  </button>
                </div>

                <div className="space-y-4">
                  {fields.map((item, index) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Descrição da Peça #{index + 1}
                          </label>
                          <input 
                            type="text" 
                            {...register(`deliverables.${index}.title`)}
                            placeholder="Ex: 1x Reels com Demonstração e Menção Oficial"
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Formato
                          </label>
                          <select 
                            {...register(`deliverables.${index}.type`)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                          >
                            <option value="REEL">Instagram Reel (Vídeo)</option>
                            <option value="STORY">Sequência de Stories</option>
                            <option value="CAROUSEL">Post Carrossel no Feed</option>
                            <option value="TIKTOK">Vídeo TikTok</option>
                            <option value="YOUTUBE">YouTube Integração</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Prazo Final
                          </label>
                          <input 
                            type="date" 
                            {...register(`deliverables.${index}.dueDate`)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          {fields.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => remove(index)}
                              className="p-2.5 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 rounded-xl transition-colors"
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

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    type="button" 
                    onClick={handleNextFromStep1}
                    className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2"
                  >
                    Continuar para Valores & Cláusulas <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </section>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              PASSO 2: VALORES, BRIEFING & CLÁUSULAS LEGAIS
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* 2.1 Orçamento & Custódia SafePay */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                      4. Orçamento & Custódia SafePay Escrow
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">O valor é retido em conta de custódia e só é liberado após a entrega aprovada.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Protegido
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-6 space-y-3">
                    <label className="text-xs font-black uppercase text-slate-700 block">
                      Valor Bruto do Contrato (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400">R$</span>
                      <input 
                        type="number" 
                        step="10" 
                        {...register('budget')} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xl font-black text-slate-950 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      />
                    </div>
                    {errors.budget && <p className="text-red-600 text-xs font-bold">{errors.budget.message}</p>}

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-slate-700 block">
                        Título Oficial da Campanha
                      </label>
                      <input 
                        type="text" 
                        {...register('title')} 
                        placeholder="Ex: Campanha Coleção Primavera-Verão 2026"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
                      />
                      {errors.title && <p className="text-red-600 text-xs font-bold">{errors.title.message}</p>}
                    </div>
                  </div>

                  {/* Card de Transparência SafePay */}
                  <div className="md:col-span-6 p-6 rounded-2xl bg-gradient-to-br from-orange-50/80 to-amber-50/40 border border-orange-200/80 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" /> Detalhamento da Custódia SafePay
                    </h4>

                    <div className="space-y-2 text-xs border-b border-orange-200/60 pb-3">
                      <div className="flex justify-between text-slate-600">
                        <span>Valor Depositado pela Empresa:</span>
                        <strong className="text-slate-900 font-black">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watchedBudget)}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Taxa de Governança SafePay (15% Free / 7% Business):</span>
                        <strong className="text-slate-900 font-black">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(platformFee)}
                        </strong>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold pt-1">
                        <span>Valor Líquido Liberado ao Creator:</span>
                        <strong className="text-emerald-700 font-black text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netAmount)}
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      💡 <strong>Garantia SafePay:</strong> 100% dos valores ficam retidos em conta de custódia blindada. O criador só recebe após a sua aprovação do material entregue. No plano Business, a taxa cai para apenas <strong>7%</strong>.
                    </p>
                  </div>
                </div>
              </section>

              {/* 2.2 Briefing & IA */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-orange-600" />
                      5. Briefing & Roteiro da Campanha
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Instruções claras sobre o tom de voz, chamadas para ação e produtos.</p>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleAIBriefing}
                    disabled={isGeneratingBriefing}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    {isGeneratingBriefing ? 'Gerando com IA...' : '✨ Gerar Briefing por IA'}
                  </button>
                </div>

                <textarea 
                  {...register('briefing')} 
                  rows={6}
                  placeholder="Descreva detalhadamente o briefing da campanha, mensagens obrigatórias, o que NÃO pode ser falado e links/cupons..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 transition-all resize-none leading-relaxed"
                />
                {errors.briefing && <p className="text-red-600 text-xs font-bold">{errors.briefing.message}</p>}
              </section>

              {/* 2.3 Cláusulas Legais & Direitos */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-orange-600" />
                    6. Blindagem Jurídica & Direitos de Uso
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Parâmetros que serão inseridos automaticamente nas cláusulas da minuta.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                      Exclusividade de Nicho
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        {...register('exclusivityDays')} 
                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-500">dias</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Período sem divulgar concorrentes diretos.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                      Cessão de Imagem
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        {...register('usageRightsDays')} 
                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900"
                      />
                      <span className="text-xs font-bold text-slate-500">dias</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Tempo de direito de exibição nas redes da marca.</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                      Tráfego Pago & Ads
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register('allowPaidMedia')} 
                        className="w-4 h-4 accent-orange-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-800">Permitir Anúncios Patrocinados</span>
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium">Autorização para impulsionar os criativos.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    ← Voltar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleNextFromStep2}
                    className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2"
                  >
                    Visualizar Minuta Oficial →
                  </button>
                </div>
              </section>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              PASSO 3: LIVE PREVIEW DA MINUTA JURÍDICA & EMISSÃO FORMAL
          ══════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Resumo Executivo */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
                      Revisão Pré-Emissão
                    </span>
                    <h3 className="text-xl font-black text-slate-950">
                      {watchedTitle || 'Campanha de Marketing InfluNext'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold block">Depósito SafePay</span>
                    <span className="text-2xl font-black text-slate-950">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watchedBudget)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Influenciador</span>
                    <strong className="text-slate-900">@{selectedInfluencer?.handle}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Modalidade</span>
                    <strong className="text-slate-900">{watchedContractType === 'SPOT' ? 'SPOT (Ação Pontual)' : 'RETAINER (Mensal)'}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Exclusividade</span>
                    <strong className="text-slate-900">{watchedExclusivity} dias</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Direitos de Imagem</span>
                    <strong className="text-slate-900">{watchedUsageRights} dias</strong>
                  </div>
                </div>
              </section>

              {/* Minuta Oficial Brasileira (Papel de Contrato) */}
              <section className="p-8 md:p-12 rounded-[2.5rem] bg-white border border-slate-300 shadow-md space-y-6 font-serif text-slate-800 text-xs leading-relaxed">
                <div className="text-center space-y-2 border-b border-slate-200 pb-6 not-italic font-sans">
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-black">
                      <Scale className="w-5 h-5" />
                    </div>
                  </div>
                  <h2 className="text-base font-black text-slate-950 uppercase tracking-wider">
                    INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE PUBLICIDADE DIGITAL
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Vinculado à Plataforma InfluNext SafePay sob os rigores da Lei Federal nº 9.610/98 e Marco Civil da Internet.
                  </p>
                </div>

                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <h4 className="font-black text-slate-950 uppercase text-[11px]">CLÁUSULA 1ª – DO OBJETO E ENTREGÁVEIS:</h4>
                    <p className="text-slate-600 mt-1">
                      O(A) CONTRATADO(A) <strong>@{selectedInfluencer?.handle}</strong> compromete-se a produzir e veicular os seguintes conteúdos: {watchedDeliverables?.map((d, i) => `${d.title} (Formato: ${d.type})`).join('; ')}, em estrita observância ao briefing acordado.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-950 uppercase text-[11px]">CLÁUSULA 2ª – DA REMUNERAÇÃO E CUSTÓDIA SAFEPAY:</h4>
                    <p className="text-slate-600 mt-1">
                      Pela prestação dos serviços, a CONTRATANTE deposita o valor bruto de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(watchedBudget)}</strong> em conta de custódia SafePay. A liberação do montante líquido de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netAmount)}</strong> ocorrerá após a aprovação das entregas.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-950 uppercase text-[11px]">CLÁUSULA 3ª – DA CESSÃO DE DIREITOS E EXCLUSIVIDADE:</h4>
                    <p className="text-slate-600 mt-1">
                      O(A) CONTRATADO(A) cede os direitos de exibição de sua imagem pelo prazo de <strong>{watchedUsageRights} dias</strong>, obrigando-se a não realizar publicidade para marcas concorrentes diretas pelo período de <strong>{watchedExclusivity} dias</strong>. {watchedPaidMedia ? 'Autorizado o impulsionamento via tráfego pago.' : 'Vedado o impulsionamento em anúncios pagos.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-950 uppercase text-[11px]">CLÁUSULA 4ª – DO FORO E VALIDADE DIGITAL:</h4>
                    <p className="text-slate-600 mt-1">
                      As partes elegem o Foro da Comarca de São Paulo/SP para dirimir controvérsias, com validade jurídica conferida pela Medida Provisória nº 2.200-2/2001 e assinatura com carimbo criptográfico SHA-256.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex items-center justify-between not-italic font-sans text-[11px] text-slate-400">
                  <span>Carimbo Digital SHA-256: Gerado na Emissão</span>
                  <span>Ambiente Seguro InfluNext // 2026</span>
                </div>
              </section>

              {/* Termos de Aceite & Botão de Emissão */}
              <section className="p-6 md:p-8 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-sm space-y-6">
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl bg-orange-50/60 border border-orange-200">
                  <input 
                    type="checkbox" 
                    {...register('termsAccepted')} 
                    className="w-5 h-5 accent-orange-600 rounded mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-950 block">
                      Declaro que li e concordo com os termos da minuta jurídica e autorizo a custódia SafePay.
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">
                      O influenciador receberá uma notificação instantânea para revisar e assinar digitalmente a proposta.
                    </p>
                  </div>
                </label>
                {errors.termsAccepted && <p className="text-red-600 text-xs font-bold">{errors.termsAccepted.message}</p>}

                <div className="pt-2 flex items-center justify-between">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)}
                    className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    ← Voltar
                  </button>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 transition-all shadow-xl shadow-orange-500/25 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4 stroke-[2.5]" />
                    {isSubmitting ? 'Emitindo Contrato...' : 'Emitir Proposta Formal & Minuta 🚀'}
                  </button>
                </div>
              </section>

            </div>
          )}

        </form>

      </div>
    </div>
  );
}

export default function NewContractWizard() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <span className="text-xs font-bold text-slate-400">Carregando Wizard de Blindagem Jurídica...</span>
      </div>
    }>
      <NewContractWizardContent />
    </Suspense>
  );
}
