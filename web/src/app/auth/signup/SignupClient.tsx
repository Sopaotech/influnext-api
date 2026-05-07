'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

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
              w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-300
              ${isDone ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20'
                : isActive ? 'bg-white border-purple-500 text-purple-600 shadow-sm'
                : 'bg-white border-slate-100 text-slate-300'}
            `}>
              {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
            </div>
            {i < totalSteps - 1 && (
              <div className={`flex-1 h-px max-w-[40px] transition-all duration-500 ${isDone ? 'bg-purple-600' : 'bg-slate-100'}`} />
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

  const inputClass = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-purple-300 focus:bg-white transition-all shadow-sm";
  const selectClass = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 focus:outline-none focus:border-purple-300 focus:bg-white transition-all appearance-none font-bold";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2";

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Logo Centralizada */}
      <div className="text-center">
        <Logo size="lg" href="/" className="justify-center" />
      </div>


        <div className="relative">
          <div className="relative bg-white rounded-[2.5rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 space-y-8">

            {/* Header */}
            <div className="space-y-4">
              <Stepper currentStep={step} totalSteps={3} />

              {step === 1 && (
                <>
                  <div className="flex gap-1 p-1 bg-slate-50 border border-slate-100 rounded-2xl mb-4 w-max mx-auto">
                    <button
                      type="button"
                      onClick={() => setUserType('influencer')}
                      className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${isInfluencer ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Influenciador
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('company')}
                      className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${!isInfluencer ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Empresa
                    </button>
                  </div>
                  <div className="text-center space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Criar sua conta</h1>
                    <p className="text-slate-500 text-xs font-medium">Passo 1 de 3 — Credenciais de acesso</p>
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="text-center space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {isInfluencer ? 'Estratégia de Carreira' : 'Perfil Estratégico'}
                  </h1>
                  <p className="text-slate-500 text-xs font-medium">
                    Passo 2 de 3 — {isInfluencer ? 'Construindo seu alicerce de elite' : 'Personalizando sua experiência'}
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="text-center space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Potencializando Alcance</h1>
                  <p className="text-slate-500 text-xs font-medium">Passo 3 de 3 — Conecte suas fontes de dados</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-[10px] text-center font-black uppercase tracking-widest animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            {/* ─── STEP 1: Credentials ─────────────────────────────────────── */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <label className={labelClass}>E-mail Profissional</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemplo@email.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Escolha uma Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className={inputClass}
                  />
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-amber-600 text-[10px] mt-2 font-black uppercase tracking-widest">Senha muito curta</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Confirme a Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repita a senha"
                    className={`${inputClass} ${confirmPassword.length > 0 && confirmPassword !== password ? 'border-red-300' : ''}`}
                  />
                  {confirmPassword.length > 0 && confirmPassword !== password && (
                    <p className="text-red-500 text-[10px] mt-2 font-black uppercase tracking-widest">Senhas não conferem</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!step1Valid || isLoading}
                  className="w-full h-14 bg-slate-900 hover:bg-purple-600 disabled:opacity-30 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-slate-900/10 transition-all duration-500 active:scale-95"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Processando...
                    </span>
                  ) : 'Continuar para Perfil →'}
                </button>
              </form>
            )}

            {/* ─── STEP 2: Influencer Interview (Chat de Consultoria) ─── */}
            {step === 2 && isInfluencer && (
              <form onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* AI Consultant Message */}
                <div className="bg-slate-50 text-slate-600 p-5 rounded-2xl rounded-tl-sm text-[11px] font-medium border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                  <p className="font-black mb-1 flex items-center gap-2 text-purple-600 uppercase tracking-widest text-[9px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Consultor de Estratégia
                  </p>
                  <p>Incrível! O mercado busca autenticidade. Para desenharmos sua estratégia de crescimento, preciso entender: Qual seu nicho dominante e qual seu grande objetivo hoje?</p>
                </div>

                {/* User Reply Area */}
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl rounded-tr-sm text-sm ml-auto w-[95%] space-y-5 shadow-sm">
                  <div>
                    <label className={labelClass}>Meu Nicho é:</label>
                    <select value={niche} onChange={(e) => setNiche(e.target.value)} required className={selectClass}>
                      <option value="">Selecione...</option>
                      {INFLUENCER_NICHES.map(n => (
                        <option key={n} value={n}>{n}</option>
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
                        className="w-full h-1.5 bg-purple-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between text-[10px] text-purple-400 font-black uppercase tracking-widest">
                        <span>{yearsOfCareer === 0 ? 'Começando' : `${yearsOfCareer} anos`}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>E meu grande objetivo é:</label>
                    <div className="grid grid-cols-1 gap-2">
                      {CAREER_GOALS.map(g => (
                        <label key={g.value} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${goal === g.value ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:border-purple-200 hover:bg-slate-50'}`}>
                          <input
                            type="radio"
                            name="goal"
                            value={g.value}
                            checked={goal === g.value}
                            onChange={() => setGoal(g.value)}
                            className="accent-purple-600 w-4 h-4"
                          />
                          <span className="text-[11px] font-black uppercase tracking-wider">{g.label}</span>
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-4 border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all"
                  >
                    ← Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={!step2InfluencerValid || isLoading}
                    className="flex-1 h-14 bg-slate-900 hover:bg-purple-600 disabled:opacity-30 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processando...
                      </span>
                    ) : 'Próximo Passo →'}
                  </button>
                </div>
              </form>
            )}

            {/* ─── STEP 3: Social Connection ───────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-50 text-slate-600 p-5 rounded-2xl rounded-tl-sm text-[11px] font-medium border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <p className="font-black mb-1 flex items-center gap-2 text-emerald-600 uppercase tracking-widest text-[9px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Validação de Autoridade
                  </p>
                  <p>Etapa final! Conecte suas redes sociais para validar seu alcance. Dados reais garantem segurança nas negociações e aceleram seu fechamento com marcas.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { 
                      id: 'instagram', 
                      name: 'Instagram', 
                      icon: (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        </div>
                      ),
                      color: 'hover:border-purple-200 hover:bg-purple-50/30 text-slate-900' 
                    },
                    { 
                      id: 'tiktok', 
                      name: 'TikTok', 
                      icon: (
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 3.44-.3 6.88-.45 10.32-.06 1.58-.56 3.17-1.6 4.38-1.14 1.36-2.88 2.09-4.63 2.13-2.07.13-4.22-.72-5.49-2.39-1.27-1.74-1.31-4.2-.23-6.01.94-1.57 2.66-2.58 4.49-2.61.31-.01.62.01.93.04v4.04c-.6-.11-1.25-.01-1.79.29-.71.41-1.07 1.25-.95 2.05.11.9.96 1.57 1.86 1.5.81-.02 1.51-.62 1.64-1.42.13-2.18.26-4.36.39-6.54V.02h-3.91z"/>
                          </svg>
                        </div>
                      ),
                      color: 'hover:border-slate-300 hover:bg-slate-50 text-slate-900' 
                    },
                    { 
                      id: 'youtube', 
                      name: 'YouTube', 
                      icon: (
                        <div className="w-8 h-8 rounded-lg bg-[#FF0000] flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      ),
                      color: 'hover:border-red-200 hover:bg-red-50 text-slate-900' 
                    }
                  ].map((plat) => (
                    <button 
                      key={plat.id}
                      onClick={async () => {
                        const id = toast.loading(`Iniciando conexão segura com ${plat.name}...`);
                        try {
                          const { data } = await api.get('/auth/social/urls');
                          const url = data[plat.id];
                          if (url) {
                            window.location.href = url;
                          } else {
                            toast.error('O serviço de conexão está temporariamente indisponível.', { id });
                          }
                        } catch (err) {
                          toast.error('Falha na comunicação com a API InfluNext.', { id });
                        }
                      }}
                      className={`flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2rem] transition-all duration-300 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 group ${plat.color}`}
                    >
                      <div className="flex items-center gap-4">
                        {plat.icon}
                        <div className="text-left">
                          <span className="block text-xs font-black uppercase tracking-widest leading-none mb-1">{plat.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Vincular métricas oficiais</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-all">
                          Conectar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => router.push('/dashboard/influencer')}
                  className="w-full h-14 bg-slate-900 hover:bg-purple-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all text-[10px] shadow-lg shadow-slate-900/10 active:scale-95"
                >
                  Concluir e Acessar Painel
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
                    <option value="">Selecione o segmento...</option>
                    {COMPANY_SEGMENTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Tamanho da Empresa</label>
                  <div className="grid grid-cols-1 gap-2">
                    {EMPLOYEE_RANGES.map(r => (
                      <label key={r.value} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${employeeCount === r.value ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:border-purple-200 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name="employees"
                          value={r.value}
                          checked={employeeCount === r.value}
                          onChange={() => setEmployeeCount(r.value)}
                          className="accent-purple-600 w-4 h-4"
                        />
                        <span className="text-[11px] font-black uppercase tracking-wider">{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Budget para Campanhas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_RANGES.map(b => (
                      <label key={b.value} className={`flex items-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all text-center justify-center ${campaignBudget === b.value ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-sm' : 'border-slate-100 bg-white text-slate-500 hover:border-purple-200 hover:bg-slate-50'}`}>
                        <input
                          type="radio"
                          name="budget"
                          value={b.value}
                          checked={campaignBudget === b.value}
                          onChange={() => setCampaignBudget(b.value)}
                          className="sr-only"
                        />
                        <span className="text-[10px] font-black uppercase tracking-tight">{b.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-4 border border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={!step2CompanyValid || isLoading}
                    className="flex-1 h-14 bg-slate-900 hover:bg-purple-600 disabled:opacity-30 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Configurando...
                      </span>
                    ) : 'Finalizar Cadastro'}
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                Já possui conta?{' '}
                <Link href="/auth/login" className="text-purple-500 hover:text-purple-700 transition-colors">
                  Fazer Login
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    );
}
