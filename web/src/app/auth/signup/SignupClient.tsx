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
  { value: 'até_2k', label: 'Até R$ 2.000 / mês' },
  { value: '2k_5k', label: 'R$ 2.000 – R$ 5.000 / mês' },
  { value: '5k_15k', label: 'R$ 5.000 – R$ 15.000 / mês' },
  { value: '15k+', label: 'Acima de R$ 15.000 / mês' },
];

const SALES_GOALS = [
  { value: 'leads', label: 'Atrair leads qualificados' },
  { value: 'sales', label: 'Aumentar vendas diretas de produtos/serviços' },
  { value: 'awareness', label: 'Branding / Reconhecimento e visibilidade' },
  { value: 'local_clients', label: 'Atrair mais clientes locais/físicos' },
];

const TICKET_RANGES = [
  { value: 'baixo', label: 'Abaixo de R$ 50' },
  { value: 'medio', label: 'R$ 50 – R$ 150' },
  { value: 'alto', label: 'R$ 150 – R$ 500' },
  { value: 'premium', label: 'Acima de R$ 500' },
];

const INSTAGRAM_STANDINGS = [
  { value: 'fraco', label: 'Fraco (Sem presença/engajamento)' },
  { value: 'regular', label: 'Regular (Postagens frequentes, pouca conversão)' },
  { value: 'forte', label: 'Forte (Boa audiência, buscando escala)' },
  { value: 'inexistente', label: 'Inexistente (Estamos começando do zero)' },
];

// ─── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ currentStep, totalSteps }: { currentStep: number; totalSteps: number; isInfluencer: boolean }) {
  const activeColor = 'border-orange-500 text-[#d96b27] bg-orange-50/50';
  const doneBg = 'bg-[#d96b27] border-[#d96b27]';
  const doneLine = 'bg-[#d96b27]';

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
                : 'bg-zinc-50 border-zinc-205 text-zinc-400'}
            `}>
              {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
            </div>
            {i < totalSteps - 1 && (
              <div className={`flex-1 h-px max-w-[40px] transition-all duration-500 ${isDone ? doneLine : 'bg-zinc-150'}`} />
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
  const [salesGoal, setSalesGoal] = useState('');
  const [averageTicket, setAverageTicket] = useState('');
  const [instagramPositioning, setInstagramPositioning] = useState('');

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
          salesGoal,
          averageTicket,
          instagramPositioning,
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

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:bg-white focus:ring-1 focus:ring-orange-500/20 transition-all shadow-sm";
  const selectClass = "w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm text-zinc-900 focus:outline-none focus:border-orange-500/50 focus:bg-white transition-all appearance-none font-bold";
  const labelClass = "block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1";

  const glowBorder = "from-orange-500/25 via-amber-500/10 to-transparent";

  const buttonAccent = "bg-[#d96b27] hover:bg-[#c65e21] text-white shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20";

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
      <div className="text-center">
        <Logo size="lg" href="/" className="justify-center" variant="dark" />
        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500">
          Onboarding Experience
        </p>
      </div>

      <div className="relative">
        {/* Glow border */}
        <div className="absolute -inset-px rounded-[2.5rem] bg-gradient-to-b from-orange-500/25 via-amber-500/10 to-transparent pointer-events-none" />
        
        <div 
          className="relative bg-white border border-zinc-200/80 shadow-xl shadow-zinc-150/50 rounded-[2.5rem] p-8 md:p-10 space-y-8 overflow-hidden"
          style={{ backdropFilter: 'blur(40px)' }}
        >
          {/* Inner dynamic glows */}
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-500/5 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-600/3 blur-[60px] pointer-events-none" />

          {/* Inner top gradient accent */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

          {/* Header */}
          <div className="space-y-4">
            <Stepper currentStep={step} totalSteps={3} isInfluencer={isInfluencer} />

            {step === 1 && (
              <>
                <div className="flex gap-1 p-1 bg-zinc-50 border border-zinc-200 rounded-2xl mb-4 w-max mx-auto relative z-10">
                  <button
                    type="button"
                    onClick={() => setUserType('influencer')}
                    className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${isInfluencer ? buttonAccent : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Influenciador
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('company')}
                    className={`px-6 py-2.5 text-[10px] font-black rounded-xl tracking-wider uppercase transition-all ${!isInfluencer ? buttonAccent : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Empresa
                  </button>
                </div>
                <div className="text-center space-y-1 relative z-10">
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">Criar sua conta</h1>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Passo 1 de 3 — Credenciais</p>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="text-center space-y-1 relative z-10">
                <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">
                  {isInfluencer ? 'Estratégia de Carreira' : 'Perfil Estratégico'}
                </h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  Passo 2 de 3 — {isInfluencer ? 'Construindo seu alicerce' : 'Personalizando sua experiência'}
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-1 relative z-10">
                <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">Potencializando Alcance</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Passo 3 de 3 — Conecte-se</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl text-[9px] text-center font-black uppercase tracking-widest animate-in shake relative z-10">
              {error}
            </div>
          )}

          {/* Form Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6 relative z-10">
              {isInfluencer && socialUrls && (
                <div className="space-y-4">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-100"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Cadastrar via Rede Social</span>
                    <div className="flex-grow border-t border-zinc-100"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (socialUrls.instagram) window.location.href = socialUrls.instagram;
                      }}
                      className="p-5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase tracking-wider hover:bg-zinc-100/50 hover:border-orange-500/30 transition-all text-zinc-500 hover:text-zinc-800 shadow-sm group"
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
                      className="p-5 bg-zinc-50/50 border border-zinc-200/80 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[10px] uppercase tracking-wider hover:bg-zinc-100/50 hover:border-orange-500/30 transition-all text-zinc-500 hover:text-zinc-800 shadow-sm group"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800 group-hover:scale-110 transition-transform">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                      </svg>
                      TikTok
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-100"></div>
                    <span className="flex-shrink mx-4 text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">ou via e-mail</span>
                    <div className="flex-grow border-t border-zinc-100"></div>
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
                className="w-full h-16 bg-[#d96b27] hover:bg-[#c65e21] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all active:scale-95"
              >
                {isLoading ? 'CONFIGURANDO...' : 'PRÓXIMO PASSO'}
              </button>
            </form>
          )}

          {/* Step 2 Influencer */}
          {step === 2 && isInfluencer && (
            <form onSubmit={handleStep2Submit} className="space-y-6 relative z-10">
              <div className="p-6 bg-orange-50 border border-orange-200/30 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#d96b27] flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#d96b27] animate-pulse" />
                   Estratégia AI
                 </p>
                 <p className="text-xs font-bold text-zinc-700 leading-relaxed italic">"Incrível! O mercado busca autenticidade. Qual seu nicho dominante e qual seu grande objetivo hoje?"</p>
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
                    <option value="">Selecione...</option>
                    {INFLUENCER_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
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
                          className={`p-5 rounded-2xl border text-left transition-all ${goal === g.value ? 'bg-[#d96b27] text-white border-transparent shadow-lg shadow-orange-500/10' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'}`}
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
                className="w-full h-16 bg-[#d96b27] hover:bg-[#c65e21] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all active:scale-95"
              >
                {isLoading ? 'GERANDO PERFIL...' : 'FINALIZAR ESTRATÉGIA'}
              </button>
            </form>
          )}

          {/* Step 2 Company */}
          {step === 2 && !isInfluencer && (
            <form onSubmit={handleStep2Submit} className="space-y-6 relative z-10">
              <div className="p-6 bg-orange-50 border border-orange-200/30 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#d96b27] flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#d96b27] animate-pulse" />
                   Perfil da Empresa
                 </p>
                 <p className="text-xs font-bold text-zinc-700 leading-relaxed italic">"Boas-vindas! Personalize a busca por criadores de conteúdo definindo o perfil da sua empresa."</p>
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
                      <option value="">Selecione...</option>
                      {COMPANY_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
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
                      <option value="">Selecione...</option>
                      {EMPLOYEE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Orçamento de Campanha Planejado</label>
                  <div className="relative">
                    <select
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="">Selecione...</option>
                      {BUDGET_RANGES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Meta de Vendas/Marketing Principal</label>
                  <div className="relative">
                    <select
                      value={salesGoal}
                      onChange={(e) => setSalesGoal(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="">Selecione...</option>
                      {SALES_GOALS.map(sg => <option key={sg.value} value={sg.value}>{sg.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Ticket Médio do Produto Principal</label>
                  <div className="relative">
                    <select
                      value={averageTicket}
                      onChange={(e) => setAverageTicket(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="">Selecione...</option>
                      {TICKET_RANGES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>Posicionamento Instagram Atual</label>
                  <div className="relative">
                    <select
                      value={instagramPositioning}
                      onChange={(e) => setInstagramPositioning(e.target.value)}
                      required
                      className={selectClass}
                    >
                      <option value="">Selecione...</option>
                      {INSTAGRAM_STANDINGS.map(is => <option key={is.value} value={is.value}>{is.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!step2CompanyValid || isLoading}
                className="w-full h-16 bg-[#d96b27] hover:bg-[#c65e21] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all active:scale-95"
              >
                {isLoading ? 'GERANDO PERFIL...' : 'FINALIZAR CADASTRO'}
              </button>
            </form>
          )}

          {/* Step 3 Social Connection */}
          {step === 3 && (
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-orange-50 border border-orange-200/30 rounded-3xl space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#d96b27]">Validação de Alcance</p>
                 <p className="text-xs font-bold text-zinc-700 leading-relaxed italic">Conecte suas redes para validar seu InfluScore. Dados reais aceleram fechamentos.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 {['Instagram', 'TikTok', 'YouTube'].map((plat) => (
                   <button 
                    key={plat}
                    className="flex items-center justify-between p-6 bg-zinc-50 border border-zinc-200 rounded-2xl hover:bg-zinc-100 hover:border-orange-500/30 transition-all group"
                   >
                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">{plat}</span>
                     <span className="text-[9px] font-black uppercase text-zinc-400 group-hover:text-[#d96b27] transition-colors">Conectar →</span>
                   </button>
                 ))}
              </div>

              <button
                onClick={() => router.push('/dashboard/influencer')}
                className="w-full h-16 bg-[#d96b27] hover:bg-[#c65e21] text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all active:scale-95"
              >
                ACESSAR STUDIO
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-100 text-center relative z-10">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Já possui conta?{' '}
              <Link href="/auth/login" className="text-[#d96b27] hover:text-[#c65e21] transition-colors font-black">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
