'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getSocialAuthUrl, type SocialAuthProvider } from '@/lib/social-auth';
import { storeSessionMetadata } from '@/lib/auth-browser';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Check } from 'lucide-react';

const COMPANY_SEGMENTS = [
  'Moda & Vestuário', 'Tecnologia', 'Alimentação & Bebidas', 'Saúde & Bem-estar',
  'Beleza & Cosméticos', 'Viagem & Turismo', 'Educação', 'Finanças',
  'Games & Entretenimento', 'Casa & Decoração', 'Esportes', 'Automotivo', 'Outro',
];
const EMPLOYEE_RANGES = [
  ['1-10', '1 – 10 funcionários (Micro)'], ['11-50', '11 – 50 funcionários (Pequena)'],
  ['51-200', '51 – 200 funcionários (Média)'], ['200+', '200+ funcionários (Grande)'],
];
const BUDGET_RANGES = [
  ['até_2k', 'Até R$ 2.000 / mês'], ['2k_5k', 'R$ 2.000 – R$ 5.000 / mês'],
  ['5k_15k', 'R$ 5.000 – R$ 15.000 / mês'], ['15k+', 'Acima de R$ 15.000 / mês'],
];
const SALES_GOALS = [
  ['leads', 'Atrair leads qualificados'], ['sales', 'Aumentar vendas diretas de produtos/serviços'],
  ['awareness', 'Branding / Reconhecimento e visibilidade'], ['local_clients', 'Atrair mais clientes locais/físicos'],
];
const TICKET_RANGES = [
  ['baixo', 'Abaixo de R$ 50'], ['medio', 'R$ 50 – R$ 150'],
  ['alto', 'R$ 150 – R$ 500'], ['premium', 'Acima de R$ 500'],
];

function Stepper({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2" aria-label={`Etapa ${currentStep} de ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const number = index + 1;
        const complete = number < currentStep;
        return <React.Fragment key={number}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-black ${complete ? 'border-orange-600 bg-orange-600 text-white' : number === currentStep ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-zinc-200 text-zinc-400'}`}>
            {complete ? <Check className="h-3.5 w-3.5" /> : number}
          </div>
          {number < totalSteps && <div className={`h-px w-10 ${complete ? 'bg-orange-600' : 'bg-zinc-200'}`} />}
        </React.Fragment>;
      })}
    </div>
  );
}

export default function SignupClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userType, setUserType] = useState(searchParams.get('type') || 'influencer');
  const isInfluencer = userType === 'influencer';
  const totalSteps = isInfluencer ? 1 : 2;
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');
  const [segment, setSegment] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('');
  const [salesGoal, setSalesGoal] = useState('');
  const [averageTicket, setAverageTicket] = useState('');
  const [instagramPositioning, setInstagramPositioning] = useState('');

  const handleSocialRedirect = async (platform: SocialAuthProvider) => {
    setError('');
    setIsLoading(true);
    try {
      window.location.assign(await getSocialAuthUrl(platform));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login social indisponível. Use e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setIsLoading(true);
    try {
      const role = isInfluencer ? 'INFLUENCER' : 'COMPANY';
      await api.post('/auth/signup', { email, password, role });
      const loginRes = await api.post<{ user: { role: 'INFLUENCER' | 'COMPANY' | 'ADMIN'; onboardingCompleted: boolean } }>('/auth/login', { email, password });
      storeSessionMetadata(loginRes.data.user);
      if (loginRes.data.user.role === 'INFLUENCER') router.push('/onboarding');
      else setStep(2);
    } catch (err: unknown) {
      const response = err as { response?: { data?: { error?: string; errors?: Record<string, string[]> } }; message?: string };
      const validation = response.response?.data?.errors;
      setError(response.response?.data?.error || (validation ? Object.values(validation).flat().join(' | ') : response.message) || 'Não foi possível criar sua conta.');
    } finally { setIsLoading(false); }
  };

  const handleCompanyProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/complete-profile', {
        companyName, city: companyCity, state: companyState, segment, employeeCount,
        campaignBudget, salesGoal, averageTicket, instagramPositioning,
      });
      router.push('/dashboard/company');
    } catch (err: unknown) {
      const response = err as { response?: { data?: { error?: string; errors?: Record<string, string[]> } }; message?: string };
      const validation = response.response?.data?.errors;
      setError(response.response?.data?.error || (validation ? Object.values(validation).flat().join(' | ') : response.message) || 'Não foi possível configurar o perfil empresarial.');
    } finally { setIsLoading(false); }
  };

  const inputClass = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none';
  const labelClass = 'mb-1.5 block text-xs font-bold text-zinc-600';
  const selectClass = `${inputClass} font-medium`;
  const buttonClass = 'w-full rounded-xl bg-[#d96b27] px-5 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#c65e21] disabled:opacity-50';

  return <main className="mx-auto w-full max-w-xl px-4 py-8">
    <section className="space-y-7 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl md:p-9">
      <header className="space-y-5 border-b border-zinc-100 pb-6 text-center">
        <Logo size="lg" href="/" className="justify-center" variant="dark" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">Criar sua conta</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">{isInfluencer ? 'Conta de creator' : `Passo ${step} de ${totalSteps}`}</p>
        </div>
        <Stepper currentStep={step} totalSteps={totalSteps} />
        {step === 1 && <div className="mx-auto flex w-max rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          <button type="button" onClick={() => setUserType('influencer')} aria-pressed={isInfluencer} className={`rounded-lg px-4 py-2 text-xs font-bold ${isInfluencer ? 'bg-orange-600 text-white' : 'text-zinc-600'}`}>Creator</button>
          <button type="button" onClick={() => setUserType('company')} aria-pressed={!isInfluencer} className={`rounded-lg px-4 py-2 text-xs font-bold ${!isInfluencer ? 'bg-orange-600 text-white' : 'text-zinc-600'}`}>Empresa</button>
        </div>}
      </header>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {step === 1 && <form onSubmit={handleSignup} className="space-y-5">
        {isInfluencer && <>
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">Continuar com um provedor</p>
          <div className="grid grid-cols-3 gap-2">
            {(['instagram', 'google', 'tiktok'] as const).map(platform => <button key={platform} type="button" disabled={isLoading} onClick={() => handleSocialRedirect(platform)} className="rounded-xl border border-zinc-200 px-2 py-3 text-xs font-bold capitalize text-zinc-700 hover:border-orange-400 disabled:opacity-50">
              {platform === 'instagram' ? 'Continuar com Instagram' : platform === 'google' ? 'Google' : 'TikTok'}
            </button>)}
          </div>
          <p className="text-center text-xs text-zinc-400">ou crie sua conta com e-mail</p>
        </>}
        <div><label htmlFor="signup-email" className={labelClass}>E-mail profissional</label><input id="signup-email" type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className={inputClass} /></div>
        <div><label htmlFor="signup-password" className={labelClass}>Senha (mínimo 8 caracteres)</label><input id="signup-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className={inputClass} /></div>
        <div><label htmlFor="signup-confirm-password" className={labelClass}>Confirme a senha</label><input id="signup-confirm-password" type="password" required autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className={inputClass} /></div>
        <button type="submit" disabled={isLoading || password.length < 8 || password !== confirmPassword} className={buttonClass}>{isLoading ? 'Criando conta…' : isInfluencer ? 'Criar conta e continuar' : 'Próximo passo'}</button>
      </form>}

      {step === 2 && !isInfluencer && <form onSubmit={handleCompanyProfile} className="space-y-4">
        <h2 className="text-center text-lg font-bold text-zinc-800">Perfil da empresa</h2>
        <div><label htmlFor="company-name" className={labelClass}>Nome da empresa</label><input id="company-name" required minLength={2} value={companyName} onChange={event => setCompanyName(event.target.value)} className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="company-city" className={labelClass}>Cidade</label><input id="company-city" value={companyCity} onChange={event => setCompanyCity(event.target.value)} className={inputClass} /></div>
          <div><label htmlFor="company-state" className={labelClass}>Estado (UF)</label><input id="company-state" maxLength={2} value={companyState} onChange={event => setCompanyState(event.target.value)} className={inputClass} /></div>
        </div>
        <SelectField id="company-segment" label="Segmento" value={segment} onChange={setSegment} options={COMPANY_SEGMENTS.map(item => [item, item])} className={selectClass} required />
        <SelectField id="company-size" label="Tamanho da empresa" value={employeeCount} onChange={setEmployeeCount} options={EMPLOYEE_RANGES} className={selectClass} required />
        <SelectField id="company-budget" label="Orçamento de campanha" value={campaignBudget} onChange={setCampaignBudget} options={BUDGET_RANGES} className={selectClass} required />
        <SelectField id="company-goal" label="Meta de vendas/marketing" value={salesGoal} onChange={setSalesGoal} options={SALES_GOALS} className={selectClass} required />
        <SelectField id="company-ticket" label="Ticket médio" value={averageTicket} onChange={setAverageTicket} options={TICKET_RANGES} className={selectClass} required />
        <SelectField id="company-instagram-positioning" label="Posicionamento Instagram" value={instagramPositioning} onChange={setInstagramPositioning} options={[
          ['fraco', 'Fraco'], ['regular', 'Regular'], ['forte', 'Forte'], ['inexistente', 'Inexistente'],
        ]} className={selectClass} required />
        <button type="submit" disabled={isLoading} className={buttonClass}>{isLoading ? 'Salvando perfil…' : 'Finalizar cadastro empresarial'}</button>
      </form>}

      <footer className="space-y-3 border-t border-zinc-100 pt-5 text-center">
        <p className="text-xs text-zinc-500">Já possui conta? <Link href="/auth/login" className="font-bold text-orange-700">Fazer login</Link></p>
        <p className="text-[10px] text-zinc-400">Ao criar uma conta, você concorda com os <Link href="/termos" target="_blank" className="font-semibold text-orange-700">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" className="font-semibold text-orange-700">Política de Privacidade</Link>.</p>
      </footer>
    </section>
  </main>;
}

function SelectField({ id, label, value, onChange, options, className, required }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  options: string[][]; className: string; required?: boolean;
}) {
  return <div><label htmlFor={id} className="mb-1.5 block text-xs font-bold text-zinc-600">{label}</label><select id={id} required={required} value={value} onChange={event => onChange(event.target.value)} className={className}><option value="">Selecione…</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
}
