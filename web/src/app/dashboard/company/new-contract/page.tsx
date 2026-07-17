'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api, searchInfluencers, createContract, InfluencerSearchItem } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Plus, Trash2, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

const formSchema = z.object({
  influencerId: z.string().min(1, 'Selecione um influenciador.'),
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  budget: z.coerce.number().min(1, 'O orçamento deve ser maior que zero.'),
  deliverables: z.array(z.object({
    title: z.string().min(3, 'O título do entregável é obrigatório.'),
    type: z.string().min(1, 'O tipo é obrigatório.'),
    dueDate: z.string().min(1, 'A data é obrigatória.')
  })).min(1, 'Adicione pelo menos um entregável.'),
  briefing: z.string().min(10, 'O briefing deve ser detalhado.')
});

type FormValues = z.infer<typeof formSchema>;

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const influencerIdParam = searchParams.get('influencerId');
  const handleParam = searchParams.get('handle');

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<InfluencerSearchItem[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerSearchItem | null>(null);
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

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: '',
      budget: 0,
      briefing: '',
      deliverables: [{ title: '', type: 'REEL', dueDate: '' }]
    }
  });

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

  const onSubmit = async (data: FormValues) => {
    try {
      await createContract(data);
      toast.success('Proposta enviada com sucesso ao Influenciador!');
      router.push('/dashboard/company');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar o contrato.');
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <header className={`flex items-center gap-4 pb-6 border-b ${
        isDark ? 'border-zinc-800/50' : 'border-zinc-200'
      }`}>
        <Link 
          href="/dashboard/company" 
          className={`p-2 border rounded-lg transition-colors shadow-lg ${
            isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-650 hover:text-zinc-950'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 tracking-tight">
            Propor Novo Contrato
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 font-medium mt-1">Busque um influenciador, defina o budget e crie entregáveis com segurança no Escrow.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Seção 1: Influenciador */}
        <section className={`border rounded-2xl p-6 shadow-xl ${
          isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200 shadow-zinc-100/50'
        }`}>
          <h2 className={`text-xl font-bold mb-6 border-b pb-4 ${isDark ? 'text-white border-zinc-800/50' : 'text-zinc-850 border-zinc-100'}`}>1. Selecione o Influenciador</h2>
          
          {!selectedInfluencer ? (
            <div className="relative">
              <div className={`flex items-center border rounded-xl px-4 py-2 focus-within:ring-2 ring-orange-500/50 transition-all shadow-inner ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <Search className="w-5 h-5 text-zinc-500 mr-3" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Busque pelo handle (ex: thiago)" 
                  className={`bg-transparent border-none focus:outline-none w-full h-10 ${
                    isDark ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-800 placeholder:text-zinc-400'
                  }`}
                />
              </div>
              
              {isSearching && <div className={`absolute top-16 left-0 right-0 border rounded-lg p-4 text-center text-xs font-bold z-10 shadow-2xl ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-450' : 'bg-white border-zinc-200 text-zinc-500'
              }`}>Buscando algoritmicamente...</div>}
              
              {searchResults.length > 0 && (
                <ul className={`absolute top-16 left-0 right-0 border rounded-lg max-h-60 overflow-y-auto z-10 shadow-2xl divide-y ${
                  isDark ? 'bg-zinc-900 border-zinc-800 divide-zinc-800/50' : 'bg-white border-zinc-200 divide-zinc-100'
                }`}>
                  {searchResults.map(inf => (
                    <li 
                      key={inf.id} 
                      onClick={() => selectInfluencer(inf)}
                      className={`p-4 cursor-pointer flex items-center justify-between transition-colors ${
                        isDark ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <span className="font-bold text-lg">@{inf.handle}</span>
                      {inf.verifiedMetrics && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                    </li>
                  ))}
                </ul>
              )}
              {errors.influencerId && <p className="text-red-400 text-sm mt-2 font-medium">{errors.influencerId.message}</p>}
            </div>
          ) : (
            <div className={`flex items-center justify-between p-5 rounded-xl border shadow-lg ${
              isDark ? 'bg-zinc-950 border-emerald-500/30' : 'bg-zinc-50 border-emerald-300'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_-3px_rgba(217,107,39,0.5)]">
                  {selectedInfluencer.handle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`font-bold text-xl ${isDark ? 'text-white' : 'text-zinc-850'}`}>@{selectedInfluencer.handle}</p>
                  {selectedInfluencer.verifiedMetrics && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3.5 h-3.5"/> Auditado</span>}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedInfluencer(null)} 
                className={`text-sm font-bold border px-3 py-1.5 rounded-lg transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-red-400 bg-zinc-900 border-zinc-800' : 'text-zinc-600 hover:text-red-650 bg-white border-zinc-250'
                }`}
              >
                Trocar
              </button>
            </div>
          )}
        </section>

        {/* Seção 2: Detalhes do Contrato */}
        <section className={`border rounded-2xl p-6 shadow-xl space-y-6 ${
          isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200 shadow-zinc-100/50'
        }`}>
          <h2 className={`text-xl font-bold mb-6 border-b pb-4 ${isDark ? 'text-white border-zinc-800/50' : 'text-zinc-850 border-zinc-100'}`}>2. Detalhes Financeiros</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-550 dark:text-zinc-300">Título da Campanha</label>
              <input 
                {...register('title')} 
                placeholder="Ex: Campanha Black Friday 2026"
                className={`w-full border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-650' : 'bg-zinc-50 border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:bg-white'
                }`}
              />
              {errors.title && <p className="text-red-400 text-xs font-medium mt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-550 dark:text-zinc-300">Orçamento em Escrow (BRL R$)</label>
              <input 
                {...register('budget')} 
                type="number"
                placeholder="Ex: 5000"
                className={`w-full border rounded-xl px-4 py-3.5 font-extrabold focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner text-lg ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-emerald-400' : 'bg-zinc-50 border-zinc-200 text-emerald-600 focus:bg-white'
                }`}
              />
              {errors.budget && <p className="text-red-400 text-xs font-medium mt-1">{errors.budget.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-550 dark:text-zinc-300">Briefing e Diretrizes</label>
              <button 
                type="button"
                onClick={async () => {
                  if (!selectedInfluencer) return toast.error('Selecione um influenciador primeiro.');
                  const loadingToast = toast.loading('IA está elaborando seu briefing...');
                  try {
                    const res = await api.post('/ai/generate-briefing', {
                      influencerHandle: selectedInfluencer.handle,
                      campaignTitle: control._formValues.title || 'Campanha de Marketing'
                    });
                    setValue('briefing', res.data.briefing, { shouldValidate: true });
                    toast.dismiss(loadingToast);
                    toast.success('✦ Briefing gerado com sucesso!');
                  } catch (err) {
                    toast.dismiss(loadingToast);
                    toast.error('Falha ao gerar briefing via IA.');
                  }
                }}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 transition-all"
              >
                <Sparkles className="w-3 h-3" /> Mágica IA
              </button>
            </div>
            <textarea 
              {...register('briefing')}
              rows={5}
              placeholder="Descreva o que o influenciador deve fazer, mencionar e os objetivos da campanha..."
              className={`w-full border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-inner leading-relaxed ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300 placeholder:text-zinc-650' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-700 placeholder:text-zinc-400 focus:bg-white'
              }`}
            />
            {errors.briefing && <p className="text-red-400 text-xs font-medium mt-1">{errors.briefing.message}</p>}
          </div>
        </section>

        {/* Seção 3: Entregáveis */}
        <section className={`border rounded-2xl p-6 shadow-xl ${
          isDark ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-white border-zinc-200 shadow-zinc-100/50'
        }`}>
          <div className={`flex items-center justify-between border-b pb-4 mb-6 ${isDark ? 'border-zinc-800/50' : 'border-zinc-150'}`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-850'}`}>3. Entregáveis (Deliverables)</h2>
            <button 
              type="button" 
              onClick={() => append({ title: '', type: 'REEL', dueDate: '' })}
              className="text-sm font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 px-3.5 py-2 rounded-lg border border-orange-500/20 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar Mais
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-5 rounded-xl border shadow-md animate-in fade-in zoom-in-95 duration-200 ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-250 shadow-zinc-100/30'
              }`}>
                <div className="md:col-span-5 space-y-1">
                  <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">O que deve ser feito?</label>
                  <input 
                    {...register(`deliverables.${index}.title` as const)}
                    placeholder="Ex: 1 Reels de 60s com Menção"
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-650' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 placeholder:text-zinc-400 focus:bg-white'
                    }`}
                  />
                  {errors.deliverables?.[index]?.title && <p className="text-red-400 text-xs font-medium mt-1">{errors.deliverables[index].title?.message}</p>}
                </div>
                
                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Formato</label>
                  <select 
                    {...register(`deliverables.${index}.type` as const)}
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all [color-scheme:dark] ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 bg-white'
                    }`}
                  >
                    <option value="REEL" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-850"}>Instagram Reel</option>
                    <option value="STORY" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-850"}>Instagram Story</option>
                    <option value="TIKTOK" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-850"}>TikTok Video</option>
                    <option value="YOUTUBE" className={isDark ? "bg-[#050508] text-white" : "bg-white text-zinc-850"}>YouTube Integration</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Prazo Final</label>
                  <input 
                    type="date"
                    {...register(`deliverables.${index}.dueDate` as const)}
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all [color-scheme:dark] ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
                        : 'bg-zinc-50 border border-zinc-200 text-zinc-800 focus:bg-white'
                    }`}
                  />
                  {errors.deliverables?.[index]?.dueDate && <p className="text-red-400 text-xs font-medium mt-1">{errors.deliverables[index].dueDate?.message}</p>}
                </div>

                <div className="md:col-span-1 flex justify-end mt-5 md:mt-6">
                  {fields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        isDark 
                          ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20' 
                          : 'text-zinc-450 hover:text-red-650 hover:bg-red-50 hover:border-red-200'
                      }`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {errors.deliverables?.root && <p className="text-red-400 text-sm font-medium mt-2">{errors.deliverables.root.message}</p>}
          </div>
        </section>

        {/* Submit */}
        <div className={`pt-8 border-t ${isDark ? 'border-zinc-800/50' : 'border-zinc-150'}`}>
          <button 
            type="submit" 
            disabled={isSubmitting || !selectedInfluencer}
            className="w-full h-16 rounded-xl text-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)] transition-all flex justify-center items-center gap-3"
          >
            {isSubmitting ? 'Gerando Contrato Inteligente...' : 'Criar Contrato em Escrow'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default function NewContractPage() {
  return (
    <React.Suspense fallback={<div className="p-10 text-zinc-400 text-center animate-pulse">Carregando formulário de contrato...</div>}>
      <NewContractForm />
    </React.Suspense>
  );
}
