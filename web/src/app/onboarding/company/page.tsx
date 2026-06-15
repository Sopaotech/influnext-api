'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Building,
  Target,
  DollarSign,
  TrendingUp,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';

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
  { value: 'sales', label: 'Aumentar vendas de produtos/serviços' },
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

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // States do Onboarding da Empresa
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
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
    path: '/',
  };

  const handleCompleteOnboarding = async () => {
    if (!companyName || !segment || !employeeCount || !campaignBudget || !salesGoal || !averageTicket || !instagramPositioning) {
      toast.error('Preencha todas as perguntas estratégicas para prosseguir.');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/auth/complete-profile', {
        companyName,
        city,
        state,
        segment,
        employeeCount,
        campaignBudget,
        salesGoal,
        averageTicket,
        instagramPositioning
      });

      Cookies.set('influnext_onboarding', 'true', cookieOptions);
      toast.success('✦ Perfil Corporativo Configurado! Iniciando matching de influenciadores.');
      router.push('/dashboard/company');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar perfil corporativo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      
      {/* Glows de background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-xl relative space-y-6">
        
        {/* Logo */}
        <div className="text-center">
          <Logo size="lg" href="/" className="justify-center" variant="light" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
            InfluNext Empresas // Setup
          </p>
        </div>

        {/* Stepper */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-purple-500 shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute -inset-px rounded-[2.5rem] bg-gradient-to-b from-purple-500/20 via-pink-500/10 to-transparent pointer-events-none" />
          
          <div 
            className="relative bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 space-y-8 overflow-hidden"
            style={{ backdropFilter: 'blur(45px)' }}
          >
            {/* STEP 1: WELCOME BRAND */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                    <Building className="w-8 h-8 text-purple-500" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">
                    BEM-VINDO AO <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">INFLUNEXT EMPRESAS</span>
                  </h1>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                    Vamos configurar sua central de inteligência e o questionário estratégico para ativar o matching ideal com criadores de conteúdo e a IA Vektor.
                  </p>
                </div>
                
                <Button 
                  onClick={() => setStep(2)}
                  className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white w-full h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  CONFIGURAR CENTRAL <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            )}

            {/* STEP 2: CORPORATE IDENTITY */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Identidade_Corporativa</h2>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Preencha as informações básicas da marca</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Empresa</label>
                    <div className="relative">
                      <Input 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Minha Marca LTDA"
                        className="h-14 bg-zinc-900/50 border-zinc-800 rounded-xl focus:border-purple-500 transition-all text-sm font-bold pl-12"
                      />
                      <Building className="absolute left-4 top-4 w-5 h-5 text-zinc-700" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cidade</label>
                      <div className="relative">
                        <Input 
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="São Paulo"
                          className="h-14 bg-zinc-900/50 border-zinc-800 rounded-xl focus:border-purple-500 transition-all text-sm pl-12"
                        />
                        <MapPin className="absolute left-4 top-4.5 w-5 h-5 text-zinc-700" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Estado (UF)</label>
                      <Input 
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="SP"
                        maxLength={2}
                        className="h-14 bg-zinc-900/50 border-zinc-800 rounded-xl focus:border-purple-500 transition-all text-sm font-bold text-center uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Segmento Principal</label>
                    <select
                      value={segment}
                      onChange={(e) => setSegment(e.target.value)}
                      className="w-full h-14 bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {COMPANY_SEGMENTS.map(s => <option key={s} value={s} className="bg-[#0a0a10]">{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tamanho da Empresa</label>
                    <select
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      className="w-full h-14 bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {EMPLOYEE_RANGES.map(r => <option key={r.value} value={r.value} className="bg-[#0a0a10]">{r.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={() => setStep(1)} variant="outline" className="h-12 px-6 rounded-xl border-white/5 bg-white/[0.02] text-zinc-500 font-black tracking-wider uppercase text-[10px]">Voltar</Button>
                  <Button 
                    onClick={() => {
                      if (!companyName || !segment || !employeeCount) {
                        toast.error('Preencha as informações necessárias.');
                        return;
                      }
                      setStep(3);
                    }}
                    className="h-12 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-[10px] tracking-wider uppercase"
                  >
                    CONTINUAR
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: STRATEGIC QUESTIONNAIRE */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Setup_Estrategico</h2>
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Questionário estruturado para alinhamento da IA Vektor</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">1. Qual orçamento de campanha planejado?</label>
                    <select
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(e.target.value)}
                      className="w-full h-14 bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {BUDGET_RANGES.map(b => <option key={b.value} value={b.value} className="bg-[#0a0a10]">{b.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">2. Qual meta de vendas/branding principal?</label>
                    <select
                      value={salesGoal}
                      onChange={(e) => setSalesGoal(e.target.value)}
                      className="w-full h-14 bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {SALES_GOALS.map(sg => <option key={sg.value} value={sg.value} className="bg-[#0a0a10]">{sg.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">3. Qual o ticket médio do produto principal?</label>
                    <select
                      value={averageTicket}
                      onChange={(e) => setAverageTicket(e.target.value)}
                      className="w-full h-14 bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {TICKET_RANGES.map(t => <option key={t.value} value={t.value} className="bg-[#0a0a10]">{t.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">4. Posicionamento atual da sua marca no Instagram?</label>
                    <select
                      value={instagramPositioning}
                      onChange={(e) => setInstagramPositioning(e.target.value)}
                      className="w-full h-14 bg-[#0a0a0f] border border-white/[0.08] rounded-xl px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#0a0a10]">Selecione...</option>
                      {INSTAGRAM_STANDINGS.map(is => <option key={is.value} value={is.value} className="bg-[#0a0a10]">{is.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={() => setStep(2)} variant="outline" className="h-12 px-6 rounded-xl border-white/5 bg-white/[0.02] text-zinc-500 font-black tracking-wider uppercase text-[10px]">Voltar</Button>
                  <Button 
                    onClick={handleCompleteOnboarding}
                    disabled={isSaving}
                    className="h-12 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-[10px] tracking-wider uppercase disabled:opacity-50"
                  >
                    {isSaving ? 'CONFIGURANDO...' : 'ATIVAR VEKTOR & PERFIL'}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
