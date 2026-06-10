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
  'Gamer', 'Música', 'Arte & Design', 'Lifestyle', 'Viagem', 'Serviços (Fotógrafos, Editores, etc.)',
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

function Stepper({ currentStep, totalSteps, isInfluencer }: { currentStep: number; totalSteps: number; isInfluencer: boolean }) {
  const activeColor = isInfluencer 
    ? 'border-violet-500 text-violet-400 bg-violet-500/10' 
    : 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
  const doneBg = isInfluencer ? 'bg-violet-600 border-violet-600' : 'bg-emerald-600 border-emerald-600';
  const doneLine = isInfluencer ? 'bg-violet-600' : 'bg-emerald-600';

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
              ${isDone ? `${doneBg} text-white shadow-lg`
                : isActive ? `${activeColor} shadow-sm`
                : 'bg-white/[0.02] border-white/5 text-zinc-500'}
            `}>
              {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
            </div>
            {i < totalSteps - 1 && (
              <div className={`flex-1 h-px max-w-[40px] transition-all duration-500 ${isDone ? doneLine : 'bg-white/5'}`} />
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
  const [socialUrls, setSocialUrls] = useState<any>(null);

  React.useEffect(() => {
    api.get('/auth/social/public-urls')
      .then(res => setSocialUrls(res.data))
      .catch(err => console.error('Erro ao carregar URLs sociais públicas:', err));
  }, []);

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

      // Immediately login to get the JWT
      const loginRes = await api.post<any>('/auth/login', { email, password });
      Cookies.set('influnext_token', loginRes.data.token, cookieOptions);
      Cookies.set('influnext_role', loginRes.data.user.role, cookieOptions);

      if (loginRes.data.user.role === 'INFLUENCER') {
        router.push('/onboarding');
      } else {
        setStep(2);
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

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-650 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all shadow-sm";
  const selectClass = "w-full bg-[#0a0a10] border border-white/[0.08] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all appearance-none font-bold";
  const labelClass = "block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1";

  const glowBorder = isInfluencer
    ? "from-violet-500/20 via-pink-500/10 to-transparent"
    : "from-emerald-500/20 via-teal-500/10 to-transparent";

  const buttonAccent = isInfluencer
    ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-xl shadow-violet-600/20"
    : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-600/20";

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
      <div className="text-center">
        <Logo size="lg" href="/" className="justify-center" variant="light" />
        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
          Onboarding Experience
        </p>
      </div>

      <div className="relative">
        {/* Glow border */}
        <div className={`absolute -inset-px rounded-[2.5rem] bg-gradient-to-b ${glowBorder} pointer-events-none`} />
        
        <div 
          className="relative bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 space-y-8 overflow-hidden"
          style={{ backdropFilter: 'blur(40px)' }}
        >
          {/* Inner dynamic glows */}
          {isInfluencer ? (
            <>
              <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[60px] pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-pink-650/10 blur-[60px] pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[60px] pointer-events-none" />
              <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-650/10 blur-[60px] pointer-events-none" />
            </>
          )}

          {/* Inner top gradient accent */}
          <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${isInfluencer ? 'via-violet-500/40' : 'via-emerald-500/40'} to-transparent`} />

          {/* Header */}
          <div className="space-y-4">
            <Stepper currentStep={step} totalSteps={3} isInfluencer={isInfluencer} />

            {step === 1 && (
              <>
                <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/[0.08] rounded-2xl mb-4 w-max mx-auto relative z-10">
                  <button
                    type="button"
                    onClick={() => setUserType('influencer')}
                    className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${isInfluencer ? buttonAccent : 'text-zinc-500 hover:text-zinc-350'}`}
                  >
                    Influenciador
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('company')}
                    className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${!isInfluencer ? buttonAccent : 'text-zinc-500 hover:text-zinc-350'}`}
                  >
                    Empresa
                  </button>
                </div>
                <div className="text-center space-y-1 relative z-10">
                  <h1 className="text-2xl font-black text-white tracking-tighter">Criar sua conta</h1>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Passo 1 de 3 — Credenciais</p>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="text-center space-y-1 relative z-10">
                <h1 className="text-2xl font-black text-white tracking-tighter">
                  {isInfluencer ? 'Estratégia de Carreira' : 'Perfil Estratégico'}
                </h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  Passo 2 de 3 — {isInfluencer ? 'Construindo seu alicerce' : 'Personalizando sua experiência'}
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-1 relative z-10">
                <h1 className="text-2xl font-black text-white tracking-tighter">Potencializando Alcance</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Passo 3 de 3 — Conecte-se</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-[9px] text-center font-black uppercase tracking-widest animate-in shake relative z-10">
              {error}
            </div>
          )}

          {/* Form Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6 relative z-10">
              {isInfluencer && socialUrls && (
                <div className="space-y-4">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">Cadastrar via Rede Social</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (socialUrls.instagram) window.location.href = socialUrls.instagram;
                      }}
                      className="p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase tracking-wider hover:bg-white/[0.06] hover:border-pink-500/30 transition-all text-white shadow-sm group"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500 group-hover:scale-110 transition-transform">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                      </svg>
                      Instagram
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (socialUrls.tiktok) window.location.href = socialUrls.tiktok;
                      }}
                      className="p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase tracking-wider hover:bg-white/[0.06] hover:border-zinc-300/30 transition-all text-white shadow-sm group"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:scale-110 transition-transform">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                      </svg>
                      TikTok
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em]">ou via e-mail</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
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

              <div className="space-y-2">
                <label className={labelClass}>Escolha uma Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Confirme a Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={!step1Valid || isLoading}
                className={`w-full h-16 bg-gradient-to-r ${isInfluencer ? 'from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-violet-600/20' : 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'} disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl transition-all active:scale-95`}
              >
                {isLoading ? 'CONFIGURANDO...' : 'PRÓXIMO PASSO'}
              </button>
            </form>
          )}

          {/* Step 2 Influencer */}
          {step === 2 && isInfluencer && (
            <form onSubmit={handleStep2Submit} className="space-y-6 relative z-10">
              <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                   Estratégia AI
                 </p>
                 <p className="text-xs font-bold text-zinc-300 leading-relaxed italic">"Incrível! O mercado busca autenticidade. Qual seu nicho dominante e qual seu grande objetivo hoje?"</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={labelClass}>Meu nicho é:</label>
                  <select 
                    value={niche} 
                    onChange={(e) => setNiche(e.target.value)} 
                    required 
                    className={selectClass}
                  >
                    <option value="" className="bg-[#0a0a10]">Selecione...</option>
                    {INFLUENCER_NICHES.map(n => <option key={n} value={n} className="bg-[#0a0a10]">{n}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                   <label className={labelClass}>Meu objetivo é:</label>
                   <div className="grid grid-cols-1 gap-2">
                      {CAREER_GOALS.map(g => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setGoal(g.value)}
                          className={`p-5 rounded-2xl border text-left transition-all ${goal === g.value ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-transparent shadow-xl shadow-violet-600/20' : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:bg-white/[0.06] hover:text-white'}`}
                        >
                           <span className="text-[10px] font-black uppercase tracking-widest">{g.label}</span>
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!step2InfluencerValid || isLoading}
                className="w-full h-16 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-violet-600/20 transition-all active:scale-95"
              >
                {isLoading ? 'GERANDO PERFIL...' : 'FINALIZAR ESTRATÉGIA'}
              </button>
            </form>
          )}

          {/* Step 2 Company */}
          {step === 2 && !isInfluencer && (
            <form onSubmit={handleStep2Submit} className="space-y-6 relative z-10">
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Perfil da Empresa
                 </p>
                 <p className="text-xs font-bold text-zinc-300 leading-relaxed italic">"Boas-vindas! Personalize a busca por criadores de conteúdo definindo o perfil da sua empresa."</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={labelClass}>Nome da Empresa</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Nome Fantasia"
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={labelClass}>Cidade</label>
                    <input
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      placeholder="São Paulo"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Estado (UF)</label>
                    <input
                      type="text"
                      value={companyState}
                      onChange={(e) => setCompanyState(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Segmento de Atuação</label>
                  <div className="relative">
                    <select
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {COMPANY_SEGMENTS.map(s => <option key={s} value={s} className="bg-[#0a0a10]">{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Tamanho da Empresa</label>
                  <div className="relative">
                    <select
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {EMPLOYEE_RANGES.map(r => <option key={r.value} value={r.value} className="bg-[#0a0a10]">{r.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Budget Estimado (Campanha)</label>
                  <div className="relative">
                    <select
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {BUDGET_RANGES.map(b => <option key={b.value} value={b.value} className="bg-[#0a0a10]">{b.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!step2CompanyValid || isLoading}
                className="w-full h-16 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
              >
                {isLoading ? 'GERANDO PERFIL...' : 'FINALIZAR CADASTRO'}
              </button>
            </form>
          )}

          {/* Step 3 Social Connection */}
          {step === 3 && (
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Validação de Alcance</p>
                 <p className="text-xs font-bold text-zinc-300 leading-relaxed italic">Conecte suas redes para validar seu InfluScore. Dados reais aceleram fechamentos.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 {['Instagram', 'TikTok', 'YouTube'].map((plat) => (
                   <button 
                    key={plat}
                    className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl hover:bg-white/[0.06] hover:border-violet-500/30 transition-all group"
                   >
                     <span className="text-[10px] font-black uppercase tracking-widest text-white">{plat}</span>
                     <span className="text-[9px] font-black uppercase text-zinc-500 group-hover:text-violet-400 transition-colors">Conectar →</span>
                   </button>
                 ))}
              </div>

              <button
                onClick={() => router.push('/dashboard/influencer')}
                className="w-full h-16 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-violet-600/20 transition-all active:scale-95"
              >
                ACESSAR STUDIO
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 text-center relative z-10">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Já possui conta?{' '}
              <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 transition-colors font-black">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
