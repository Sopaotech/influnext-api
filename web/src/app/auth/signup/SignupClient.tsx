'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Check } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const INFLUENCER_NICHES = [
  'Moda & Estilo', 'Fitness & Saúde', 'Gastronomia', 'Tech & Gadgets',
  'Gamer', 'Música', 'Arte & Design', 'Lifestyle', 'Viagem',
  'Finanças', 'Educação', 'Humor & Entretenimento', 'Esportes',
  'Beleza & Skincare', 'Negócios & Empreendedorismo', 'Família & Maternidade',
];

const CAREER_GOALS = [
  { value: 'close_contracts', label: 'Fechar contratos com marcas' },
  { value: 'grow_audience', label: 'Crescer minha audiência' },
  { value: 'monetize', label: 'Monetizar meu conteúdo' },
  { value: 'build_brand', label: 'Construir minha marca pessoal' },
];

const COMPANY_SEGMENTS = [
  'Moda & Vestuário', 'Tecnologia', 'Alimentação & Bebidas', 'Saúde & Bem-estar',
  'Beleza & Cosméticos', 'Viagem & Turismo', 'Educação', 'Finanças',
  'Games & Entretenimento', 'Casa & Decoração', 'Esportes', 'Automotivo', 'Outro',
];

const EMPLOYEE_RANGES = [
  { value: '1-10', label: '1 – 10 funcionários (Micro)' },
  { value: '11-50', label: '11 – 50 funcionários (Pequena)' },
  { value: '51-200', label: '51 – 200 funcionários (Média)' },
  { value: '200+', label: '200+ funcionários (Grande)' },
];

const BUDGET_RANGES = [
  { value: 'até_5k', label: 'Até R$ 5.000 / campanha' },
  { value: '5k_20k', label: 'R$ 5.000 – R$ 20.000' },
  { value: '20k_100k', label: 'R$ 20.000 – R$ 100.000' },
  { value: '100k+', label: 'Acima de R$ 100.000' },
];

// ─── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        return (
          <React.Fragment key={i}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border transition-all duration-300
              ${isDone ? 'bg-purple-600 border-purple-600 text-white shadow-[0_0_12px_rgba(192,132,252,0.4)]'
                : isActive ? 'bg-transparent border-purple-500 text-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.2)]'
                : 'bg-transparent border-zinc-800 text-zinc-700'}
            `}>
              {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
            </div>
            {i < totalSteps - 1 && (
              <div className={`flex-1 h-px max-w-[40px] transition-all duration-500 ${isDone ? 'bg-purple-600' : 'bg-zinc-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SignupClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type') || 'influencer';

  const [userType, setUserType] = useState(typeParam);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isInfluencer = userType === 'influencer';

  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Influencer
  const [niche, setNiche] = useState('');
  const [yearsOfCareer, setYearsOfCareer] = useState(0);
  const [goal, setGoal] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Step 2: Company
  const [companyName, setCompanyName] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [segment, setSegment] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('');

  const cookieOptions: Cookies.CookieAttributes = {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
  };

  const step1Valid = email.trim() !== '' && password.length >= 8 && password === confirmPassword;
  const step2InfluencerValid = niche !== '' && (city.trim() !== '' || true); // city optional
  const step2CompanyValid = companyName.trim().length >= 2;

  // ─── Step 1: Register user ─────────────────────────────────────────────────

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const role = isInfluencer ? 'INFLUENCER' : 'COMPANY';
      const res = await api.post<any>('/auth/signup', { email, password, role });

      // Signup only creates User; we need to login to get a token for step 2
      // Immediately login to get the JWT
      const loginRes = await api.post<any>('/auth/login', { email, password });
      Cookies.set('influnext_token', loginRes.data.token, cookieOptions);
      Cookies.set('influnext_role', loginRes.data.user.role, cookieOptions);

      setStep(2);
    } catch (err: any) {
      let msg = err.response?.data?.error;
      if (!msg && err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join(' | ');
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://influnext-api-production.up.railway.app/v1';
      setError(`${msg || err.message || 'Erro de conexão'} (URL: ${apiUrl})`);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Complete profile ──────────────────────────────────────────────

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isInfluencer) {
        await api.post('/auth/complete-profile', {
          niche,
          yearsOfCareer,
          goal,
          city,
          state,
        });
        setStep(3); // Go to Social Connection
      } else {
        await api.post('/auth/complete-profile', {
          companyName,
          city: companyCity,
          state: companyState,
          segment,
          employeeCount,
          campaignBudget,
        });
        router.push('/dashboard/company');
      }
    } catch (err: any) {
      let msg = err.response?.data?.error;
      if (!msg && err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join(' | ');
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://influnext-api-production.up.railway.app/v1';
      setError(`${msg || err.message || 'Erro de conexão'} (URL: ${apiUrl})`);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all";
  const selectClass = "w-full bg-[#0d0b18] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/40 transition-all appearance-none";
  const labelClass = "block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Logo Centralizada */}
      <div className="text-center">
        <Logo size="lg" href="/" className="justify-center" />
      </div>


        <div className="relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-purple-500/20 via-purple-500/5 to-transparent" />
          <div className="relative bg-[#0d0b18]/80 backdrop-blur-xl rounded-2xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.7)] border border-white/[0.04] space-y-6">

            {/* Header */}
            <div>
              <Stepper currentStep={step} totalSteps={3} />

              {step === 1 && (
                <>
                  <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-4 w-max mx-auto">
                    <button
                      type="button"
                      onClick={() => setUserType('influencer')}
                      className={`px-5 py-2 text-[11px] font-black rounded-lg tracking-wider uppercase transition-all ${isInfluencer ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(192,132,252,0.3)]' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      Influencer
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('company')}
                      className={`px-5 py-2 text-[11px] font-black rounded-lg tracking-wider uppercase transition-all ${!isInfluencer ? 'bg-blue-600 text-white shadow-[0_0_16px_rgba(59,130,246,0.3)]' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      Empresa
                    </button>
                  </div>
                  <div className="text-center space-y-0.5">
                    <h1 className="text-xl font-black text-white tracking-tight">Criar conta</h1>
                    <p className="text-zinc-600 text-xs">Passo 1 de 2 — Credenciais de acesso</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="text-center space-y-0.5">
                  <Stepper currentStep={step} totalSteps={3} />
                  <h1 className="text-xl font-black text-white tracking-tight">
                    {isInfluencer ? 'Estratégia de Carreira' : 'Perfil da Empresa'}
                  </h1>
                  <p className="text-zinc-600 text-xs">
                    Passo 2 de 3 — {isInfluencer ? 'Construindo seu alicerce de elite' : 'Nos conte sobre sua empresa'}
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="text-center space-y-0.5">
                  <Stepper currentStep={step} totalSteps={3} />
                  <h1 className="text-xl font-black text-white tracking-tight">Potencializando Alcance</h1>
                  <p className="text-zinc-600 text-xs">Passo 3 de 3 — Conecte suas fontes de dados</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/8 border border-red-500/25 text-red-400 p-3 rounded-xl text-xs text-center font-semibold">
                {error}
              </div>
            )}

            {/* ─── STEP 1: Credentials ─────────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className={inputClass}
                  />
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-amber-500/80 text-[10px] mt-1 font-semibold">Pelo menos 8 caracteres</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Confirmar Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a senha"
                    className={`${inputClass} ${confirmPassword.length > 0 && confirmPassword !== password ? 'border-red-500/40' : ''}`}
                  />
                  {confirmPassword.length > 0 && confirmPassword !== password && (
                    <p className="text-red-400 text-[10px] mt-1 font-semibold">As senhas não coincidem</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!step1Valid || isLoading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-30 text-white font-bold rounded-xl shadow-[0_0_24px_rgba(192,132,252,0.15)] hover:shadow-[0_0_32px_rgba(192,132,252,0.3)] transition-all duration-300 text-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Criando conta...
                    </span>
                  ) : 'Continuar →'}
                </button>
              </form>
            )}

            {/* ─── STEP 2: Influencer Interview (Chat de Consultoria) ─── */}
            {step === 2 && isInfluencer && (
              <form onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* AI Consultant Message */}
                <div className="bg-[#1a1040] text-purple-200 p-4 rounded-2xl rounded-tl-sm text-xs border border-purple-500/20 shadow-md">
                  <p className="font-bold mb-1 flex items-center gap-2 text-purple-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Consultor de Performance
                  </p>
                  <p>Bora pra cima! O mercado não espera quem fica parado. Para desenharmos sua estratégia de escala, preciso saber: Qual seu nicho dominante e onde você quer chegar?</p>
                </div>

                {/* User Reply Area */}
                <div className="bg-purple-600/10 border border-purple-500/20 p-4 rounded-2xl rounded-tr-sm text-sm ml-auto w-[90%] space-y-4">
                  <div>
                    <label className={labelClass}>Meu Nicho é:</label>
                    <select value={niche} onChange={(e) => setNiche(e.target.value)} required className={selectClass}>
                      <option value="" className="bg-zinc-900">Selecione...</option>
                      {INFLUENCER_NICHES.map(n => (
                        <option key={n} value={n} className="bg-zinc-900">{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Estou nessa jornada há:</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={yearsOfCareer}
                        onChange={(e) => setYearsOfCareer(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] text-purple-300 font-bold">
                        <span>{yearsOfCareer === 0 ? 'Começando' : `${yearsOfCareer} anos`}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>E meu grande objetivo é:</label>
                    <div className="grid grid-cols-1 gap-2">
                      {CAREER_GOALS.map(g => (
                        <label key={g.value} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${goal === g.value ? 'border-purple-500/50 bg-purple-500/20 text-white' : 'border-purple-500/10 bg-black/20 text-purple-200 hover:border-purple-500/30'}`}>
                          <input
                            type="radio"
                            name="goal"
                            value={g.value}
                            checked={goal === g.value}
                            onChange={() => setGoal(g.value)}
                            className="accent-purple-500 hidden"
                          />
                          <span className="text-xs font-bold">{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>UF</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="SP"
                      maxLength={2}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 border border-white/[0.08] text-zinc-500 rounded-xl text-sm font-bold hover:bg-white/[0.04] hover:text-zinc-300 transition-all"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={!step2InfluencerValid || isLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-30 text-white font-bold rounded-xl transition-all text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Analizando perfil...
                      </span>
                    ) : 'Próximo Passo →'}
                  </button>
                </div>
              </form>
            )}

            {/* ─── STEP 3: Social Connection ───────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-[#1a1040] text-purple-200 p-4 rounded-2xl rounded-tl-sm text-xs border border-purple-500/20 shadow-md">
                  <p className="font-bold mb-1 flex items-center gap-2 text-purple-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Verificador de Autoridade
                  </p>
                  <p>Quase lá! Agora conecte suas redes sociais. Sem dados reais, você é invisível para as marcas. Com dados, você é imparável.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: 'Instagram', icon: '📸', color: 'hover:border-pink-500/40 hover:bg-pink-500/5' },
                    { name: 'TikTok', icon: '🎵', color: 'hover:border-zinc-100/40 hover:bg-zinc-100/5' },
                    { name: 'YouTube', icon: '📺', color: 'hover:border-red-500/40 hover:bg-red-500/5' }
                  ].map((plat) => (
                    <button 
                      key={plat.name}
                      onClick={() => toast.success(`Conectando ${plat.name}... (Simulação)`)}
                      className={`flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl transition-all ${plat.color}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{plat.icon}</span>
                        <span className="text-sm font-bold text-zinc-300">{plat.name}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-zinc-600 bg-zinc-900 px-2 py-1 rounded">Conectar</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => router.push('/dashboard/influencer')}
                  className="w-full h-12 bg-zinc-100 hover:bg-white text-black font-black uppercase tracking-widest rounded-xl transition-all text-xs"
                >
                  Concluir e Acessar Hub
                </button>
              </div>
            )}

            {/* STEP 2: Company Interview */}
            {step === 2 && !isInfluencer && (
              <form onSubmit={handleStep2Submit} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className={labelClass}>Nome da Empresa *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Razão social ou nome fantasia"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Cidade</label>
                    <input
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="São Paulo"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>UF</label>
                    <input
                      type="text"
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="SP"
                      maxLength={2}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Segmento de Atuação</label>
                  <select value={segment} onChange={(e) => setSegment(e.target.value)} className={selectClass}>
                    <option value="" className="bg-zinc-900">Selecione o segmento...</option>
                    {COMPANY_SEGMENTS.map(s => (
                      <option key={s} value={s} className="bg-zinc-900">{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Tamanho da Empresa</label>
                  <div className="grid grid-cols-1 gap-2">
                    {EMPLOYEE_RANGES.map(r => (
                      <label key={r.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${employeeCount === r.value ? 'border-blue-500/50 bg-blue-500/8 text-blue-300' : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300'}`}>
                        <input
                          type="radio"
                          name="employees"
                          value={r.value}
                          checked={employeeCount === r.value}
                          onChange={() => setEmployeeCount(r.value)}
                          className="accent-blue-500"
                        />
                        <span className="text-xs font-semibold">{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Budget para Campanhas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_RANGES.map(b => (
                      <label key={b.value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-center justify-center ${campaignBudget === b.value ? 'border-emerald-500/50 bg-emerald-500/8 text-emerald-300' : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300'}`}>
                        <input
                          type="radio"
                          name="budget"
                          value={b.value}
                          checked={campaignBudget === b.value}
                          onChange={() => setCampaignBudget(b.value)}
                          className="sr-only"
                        />
                        <span className="text-[10px] font-bold">{b.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 border border-white/[0.08] text-zinc-500 rounded-xl text-sm font-bold hover:bg-white/[0.04] hover:text-zinc-300 transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={!step2CompanyValid || isLoading}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-30 text-white font-bold rounded-xl transition-all text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Configurando...
                      </span>
                    ) : 'Acessar Marketplace'}
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <p className="text-center text-xs text-zinc-700">
                Já tem conta?{' '}
                <Link href="/auth/login" className="text-purple-500 hover:text-purple-400 font-semibold transition-colors">
                  Entrar
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    );
}
