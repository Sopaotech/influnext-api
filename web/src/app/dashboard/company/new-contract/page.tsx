'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api, searchInfluencers, createContract, InfluencerSearchItem } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Plus, Trash2, ShieldCheck, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

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

export default function NewContractPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<InfluencerSearchItem[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerSearchItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: '',
      budget: 0,
      briefing: '',
      deliverables: [{ title: '', type: 'REEL', dueDate: '' }]
    }
  });

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

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <header className="flex items-center gap-4 pb-6 border-b border-zinc-800/50">
        <Link href="/dashboard/company" className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors shadow-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
            Propor Novo Contrato
          </h1>
          <p className="text-zinc-400 font-medium mt-1">Busque um influenciador, defina o budget e crie entregáveis com segurança no Escrow.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Seção 1: Influenciador */}
        <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800/50 pb-4">1. Selecione o Influenciador</h2>
          
          {!selectedInfluencer ? (
            <div className="relative">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 focus-within:ring-2 ring-purple-500/50 transition-all shadow-inner">
                <Search className="w-5 h-5 text-zinc-500 mr-3" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Busque pelo handle (ex: thiago)" 
                  className="bg-transparent border-none text-zinc-100 focus:outline-none w-full h-10"
                />
              </div>
              
              {isSearching && <div className="absolute top-16 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center text-zinc-400 text-sm z-10 shadow-2xl">Buscando algoritmicamente...</div>}
              
              {searchResults.length > 0 && (
                <ul className="absolute top-16 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-lg max-h-60 overflow-y-auto z-10 shadow-2xl divide-y divide-zinc-800/50">
                  {searchResults.map(inf => (
                    <li 
                      key={inf.id} 
                      onClick={() => selectInfluencer(inf)}
                      className="p-4 hover:bg-zinc-800 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <span className="font-bold text-zinc-200 text-lg">@{inf.handle}</span>
                      {inf.verifiedMetrics && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                    </li>
                  ))}
                </ul>
              )}
              {errors.influencerId && <p className="text-red-400 text-sm mt-2 font-medium">{errors.influencerId.message}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-zinc-950 border border-emerald-500/30 p-5 rounded-xl shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_-3px_rgba(168,85,247,0.5)]">
                  {selectedInfluencer.handle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-xl">@{selectedInfluencer.handle}</p>
                  {selectedInfluencer.verifiedMetrics && <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5"><ShieldCheck className="w-3.5 h-3.5"/> Auditado</span>}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedInfluencer(null)} className="text-sm font-bold text-zinc-400 hover:text-red-400 transition-colors bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">Trocar</button>
            </div>
          )}
        </section>

        {/* Seção 2: Detalhes do Contrato */}
        <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-800/50 pb-4">2. Detalhes Financeiros</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">Título da Campanha</label>
              <input 
                {...register('title')} 
                placeholder="Ex: Campanha Black Friday 2026"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner"
              />
              {errors.title && <p className="text-red-400 text-xs font-medium mt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-300">Orçamento em Escrow (BRL R$)</label>
              <input 
                {...register('budget')} 
                type="number"
                placeholder="Ex: 5000"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-emerald-400 font-extrabold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner text-lg"
              />
              {errors.budget && <p className="text-red-400 text-xs font-medium mt-1">{errors.budget.message}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-300">Briefing e Diretrizes</label>
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
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 transition-all"
              >
                <Sparkles className="w-3 h-3" /> Mágica IA
              </button>
            </div>
            <textarea 
              {...register('briefing')}
              rows={5}
              placeholder="Descreva o que o influenciador deve fazer, mencionar e os objetivos da campanha..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner leading-relaxed"
            />
            {errors.briefing && <p className="text-red-400 text-xs font-medium mt-1">{errors.briefing.message}</p>}
          </div>
        </section>

        {/* Seção 3: Entregáveis */}
        <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">3. Entregáveis (Deliverables)</h2>
            <button 
              type="button" 
              onClick={() => append({ title: '', type: 'REEL', dueDate: '' })}
              className="text-sm font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 px-3.5 py-2 rounded-lg border border-purple-500/20 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar Mais
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-md animate-in fade-in zoom-in-95 duration-200">
                <div className="md:col-span-5 space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">O que deve ser feito?</label>
                  <input 
                    {...register(`deliverables.${index}.title` as const)}
                    placeholder="Ex: 1 Reels de 60s com Menção"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                  {errors.deliverables?.[index]?.title && <p className="text-red-400 text-xs font-medium mt-1">{errors.deliverables[index].title?.message}</p>}
                </div>
                
                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Formato</label>
                  <select 
                    {...register(`deliverables.${index}.type` as const)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                  >
                    <option value="REEL">Instagram Reel</option>
                    <option value="STORY">Instagram Story</option>
                    <option value="TIKTOK">TikTok Video</option>
                    <option value="YOUTUBE">YouTube Integration</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prazo Final</label>
                  <input 
                    type="date"
                    {...register(`deliverables.${index}.dueDate` as const)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all [color-scheme:dark]"
                  />
                  {errors.deliverables?.[index]?.dueDate && <p className="text-red-400 text-xs font-medium mt-1">{errors.deliverables[index].dueDate?.message}</p>}
                </div>

                <div className="md:col-span-1 flex justify-end mt-5 md:mt-6">
                  {fields.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
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
        <div className="pt-8 border-t border-zinc-800/50">
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
