'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';

const NICHES = [
  'Fitness', 'Tech', 'Lifestyle', 'Moda', 'Gastronomia',
  'Gamer', 'Artista', 'Modelo', 'Esportes', 'Business', 'Finance'
];

export default function SignupClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type') || 'influencer';
  
  const [userType, setUserType] = useState(typeParam);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    city: '',
    niche: '',
    goal: '',
    companyName: '',
    region: '',
    profileType: '',
  });

  const isInfluencer = userType === 'influencer';

  // Validação do step 1
  const step1Valid = isInfluencer
    ? formData.name.trim() !== '' && formData.handle.trim() !== '' && formData.city.trim() !== ''
    : formData.companyName.trim() !== '' && formData.city.trim() !== '';

  // Validação do step 2
  const step2Valid = isInfluencer
    ? formData.niche !== '' && formData.goal.trim() !== ''
    : formData.profileType !== '';

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      document.cookie = `plim_welcome=true; path=/; max-age=60`;
      document.cookie = `user_name=${encodeURIComponent(formData.name || formData.companyName)}; path=/; max-age=60`;
      const destination = isInfluencer ? '/dashboard/influencer' : '/dashboard/company';
      router.push(destination);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-transparent to-pink-950/10" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="md" href="/" />
        </div>

        {/* Toggle de tipo */}
        <div className="flex gap-1 mb-6 p-1 bg-white/5 border border-white/10 rounded-xl w-max mx-auto">
          <button
            onClick={() => { setUserType('influencer'); setStep(1); }}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${isInfluencer ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Influencer
          </button>
          <button
            onClick={() => { setUserType('company'); setStep(1); }}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${!isInfluencer ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Marca / Empresa
          </button>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/10" />
          <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 shadow-[0_40px_60px_rgba(0,0,0,0.5)] space-y-6">

            {/* Header com mensagem da IA */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-purple-300 font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                {isInfluencer ? 'Workspace✦' : 'Marketplace Seguro'} — Passo {step}/2
              </div>
              <div className="bg-purple-950/40 border border-purple-500/20 p-4 rounded-xl">
                <p className="text-sm text-purple-200/80 leading-relaxed">
                  <span className="font-black text-purple-400 mr-1">IA ↗</span>
                  {step === 1
                    ? isInfluencer
                      ? 'Vamos montar seu perfil. Preciso do seu nome, arroba e de onde você é para conectar com as marcas certas.'
                      : 'Bem-vindo ao ambiente seguro. Me diga quem é sua empresa e onde quer encontrar talentos.'
                    : isInfluencer
                      ? 'Última etapa! Qual o seu nicho e o que você quer conquistar este ano?'
                      : 'Qual perfil de influenciador você está buscando?'
                  }
                </p>
              </div>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4">
                {isInfluencer ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Seu nome real"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                        @ Instagram / TikTok *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="@seuhandle"
                        value={formData.handle}
                        onChange={e => setFormData({ ...formData, handle: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Razão social ou nome fantasia"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                    📍 Localidade (Cidade/UF) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: São Paulo, SP"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <button
                  onClick={handleNext}
                  disabled={!step1Valid}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Continuar →
                </button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4">
                {isInfluencer ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                        Nicho Principal *
                      </label>
                      <select
                        required
                        value={formData.niche}
                        onChange={e => setFormData({ ...formData, niche: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      >
                        <option value="" className="bg-zinc-900">Selecione seu nicho...</option>
                        {NICHES.map(n => (
                          <option key={n} value={n} className="bg-zinc-900">{n}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                        Maior objetivo este ano *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Fechar 5 contratos fixos"
                        value={formData.goal}
                        onChange={e => setFormData({ ...formData, goal: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                      Perfil que busca *
                    </label>
                    <select
                      required
                      value={formData.profileType}
                      onChange={e => setFormData({ ...formData, profileType: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="" className="bg-zinc-900">Selecione...</option>
                      <option value="nano" className="bg-zinc-900">Nano (até 10k) — Comércio local</option>
                      <option value="micro" className="bg-zinc-900">Micro (10k–50k) — Autoridade regional</option>
                      <option value="mid" className="bg-zinc-900">Mid-tier (50k–200k) — Escala nacional</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-3 border border-white/10 text-zinc-400 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
                  >
                    ← Voltar
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!step2Valid}
                    className={`flex-1 font-bold py-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isInfluencer
                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500'
                    } text-white`}
                  >
                    {isInfluencer ? 'Iniciar Império ↗' : 'Acessar Marketplace →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
