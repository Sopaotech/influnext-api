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

  const inputClass = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-purple-300 focus:bg-white transition-all shadow-sm";
  const selectClass = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm text-slate-900 focus:outline-none focus:border-purple-300 focus:bg-white transition-all appearance-none font-bold";
  const labelClass = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2";

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
      <div className="text-center">
        <Logo size="lg" href="/" className="justify-center" />
        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">
          Onboarding Experience
        </p>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 rounded-[3rem] blur opacity-25"></div>
        <div 
          className="relative bg-white/10 border border-white/20 rounded-[3rem] p-10 space-y-8 shadow-2xl overflow-hidden"
          style={{ backdropFilter: 'blur(30px)' }}
        >
          {/* Header */}
          <div className="space-y-4">
            <Stepper currentStep={step} totalSteps={3} />

            {step === 1 && (
              <>
                <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl mb-4 w-max mx-auto">
                  <button
                    type="button"
                    onClick={() => setUserType('influencer')}
                    className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${isInfluencer ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Influenciador
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('company')}
                    className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${!isInfluencer ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Empresa
                  </button>
                </div>
                <div className="text-center space-y-1">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Criar sua conta</h1>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Passo 1 de 3 — Credenciais</p>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                  {isInfluencer ? 'Estratégia de Carreira' : 'Perfil Estratégico'}
                </h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  Passo 2 de 3 — {isInfluencer ? 'Construindo seu alicerce' : 'Personalizando sua experiência'}
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Potencializando Alcance</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Passo 3 de 3 — Conecte-se</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-[9px] text-center font-black uppercase tracking-widest animate-in shake">
              {error}
            </div>
          )}

          {/* Form Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {isInfluencer && socialUrls && (
                <div className="space-y-4">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200/50"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Cadastrar via Rede Social</span>
                    <div className="flex-grow border-t border-slate-200/50"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (socialUrls.instagram) window.location.href = socialUrls.instagram;
                      }}
                      className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase tracking-wider hover:bg-white/10 transition-all text-slate-900 shadow-sm"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500">
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
                      className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase tracking-wider hover:bg-white/10 transition-all text-slate-900 shadow-sm"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900 dark:text-white">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                      </svg>
                      TikTok
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200/50"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">ou via e-mail</span>
                    <div className="flex-grow border-t border-slate-200/50"></div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">E-mail Profissional</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="exemplo@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white/15 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Escolha uma Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white/15 transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Confirme a Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white/15 transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={!step1Valid || isLoading}
                className="w-full h-16 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {isLoading ? 'CONFIGURANDO...' : 'PRÓXIMO PASSO'}
              </button>
            </form>
          )}

          {/* Step 2 Influencer */}
          {step === 2 && isInfluencer && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="p-6 bg-slate-900/5 border border-slate-900/10 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   Estratégia AI
                 </p>
                 <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"Incrível! O mercado busca autenticidade. Qual seu nicho dominante e qual seu grande objetivo hoje?"</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Meu nicho é:</label>
                  <select 
                    value={niche} 
                    onChange={(e) => setNiche(e.target.value)} 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-slate-900 focus:outline-none focus:bg-white/15 transition-all"
                  >
                    <option value="">Selecione...</option>
                    {INFLUENCER_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                   <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Meu objetivo é:</label>
                   <div className="grid grid-cols-1 gap-2">
                      {CAREER_GOALS.map(g => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setGoal(g.value)}
                          className={`p-5 rounded-2xl border text-left transition-all ${goal === g.value ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
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
                className="w-full h-16 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl transition-all active:scale-95"
              >
                {isLoading ? 'GERANDO PERFIL...' : 'FINALIZAR ESTRATÉGIA'}
              </button>
            </form>
          )}

          {/* Step 3 Social Connection */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Validação de Alcance</p>
                 <p className="text-xs font-bold text-slate-700 leading-relaxed italic">Conecte suas redes para validar seu InfluScore. Dados reais aceleram fechamentos.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 {['Instagram', 'TikTok', 'YouTube'].map((plat) => (
                   <button 
                    key={plat}
                    className="flex items-center justify-between p-6 bg-white/10 border border-white/20 rounded-[2rem] hover:bg-white/20 transition-all group"
                   >
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{plat}</span>
                     <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-slate-900 transition-colors">Conectar →</span>
                   </button>
                 ))}
              </div>

              <button
                onClick={() => router.push('/dashboard/influencer')}
                className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl transition-all"
              >
                ACESSAR STUDIO
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Já possui conta?{' '}
              <Link href="/auth/login" className="text-slate-900 hover:underline">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    );
}
