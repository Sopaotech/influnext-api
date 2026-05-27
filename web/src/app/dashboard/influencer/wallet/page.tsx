"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, ShieldCheck, Zap, CheckCircle2, RefreshCw, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface BalanceData {
  availableBalance: number;
  completedContracts: number;
  currency: string;
}

export default function WalletPage() {
  const [cpf, setCpf] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [success, setSuccess] = useState(false);
  const [confirmedSecurity, setConfirmedSecurity] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData>({
    availableBalance: 0,
    completedContracts: 0,
    currency: 'BRL'
  });

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const res = await api.get('/influencers/balance');
      setBalanceData(res.data);
    } catch {
      setBalanceData({ availableBalance: 0, completedContracts: 0, currency: 'BRL' });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmedSecurity) {
      toast.error('Confirme que leu os termos de segurança antes de prosseguir.');
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error('CPF inválido. Preencha os 11 dígitos corretamente.');
      return;
    }

    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error('Digite um valor válido para o saque.');
      return;
    }

    if (val > balanceData.availableBalance) {
      toast.error('Saldo insuficiente para este saque.');
      return;
    }

    setIsProcessing(true);
    try {
      await api.post('/influencers/withdraw', {
        cpf: cpfDigits,
        amount: val
      });

      setSuccess(true);
      toast.success('PIX processado com sucesso!', {
        description: 'Seu saldo será liberado em até 1 hora útil.'
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao processar saque. Tente novamente.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 shadow-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 text-center">
          PIX Realizado!
        </h1>
        <p className="text-slate-500 text-center max-w-md mb-3">
          O valor foi enviado para processamento. Em até 1 hora útil, o crédito aparecerá na sua conta bancária vinculada ao CPF.
        </p>
        <p className="text-xs text-slate-400 mb-8 font-medium">
          ✦ Proteção Anti-Fraude Ativa — Somente CPF cadastrado
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => { setSuccess(false); setCpf(''); setAmount(''); setConfirmedSecurity(false); fetchBalance(); }}
            className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-slate-50 transition-colors"
          >
            Novo Saque
          </button>
          <Link
            href="/dashboard/influencer"
            className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-600 transition-colors shadow-lg text-center"
          >
            Voltar ao Escritório
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = confirmedSecurity && balanceData.availableBalance > 0 && !isProcessing;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/dashboard/influencer" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <header className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">
          Sua <span className="text-emerald-500">Carteira</span>
        </h1>
        <p className="text-slate-500 font-medium">Saque rápido, seguro e sem taxas ocultas.</p>
      </header>

      <div className="bg-white/40 border border-white/50 p-6 md:p-8 rounded-[2rem] shadow-xl" style={{ backdropFilter: 'blur(20px)' }}>

        {/* Balance Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 text-white p-6 md:p-8 rounded-[1.5rem] mb-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/30 transition-colors" />
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Saldo Liberado</span>
            {isLoadingBalance ? (
              <div className="h-10 w-40 bg-slate-800 animate-pulse rounded-xl" />
            ) : (
              <span className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceData.availableBalance)}
              </span>
            )}
            {!isLoadingBalance && balanceData.completedContracts > 0 && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                {balanceData.completedContracts} contrato{balanceData.completedContracts !== 1 ? 's' : ''} concluído{balanceData.completedContracts !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchBalance}
              disabled={isLoadingBalance}
              className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </button>
            <Wallet className="w-10 h-10 text-emerald-500/50 hidden sm:block" />
          </div>
        </div>

        {/* Formulário de Saque */}
        <form onSubmit={handleWithdraw} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Valor do Saque (R$)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 500.00"
                  className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                  min={1}
                  max={balanceData.availableBalance}
                  step="0.01"
                />
                {balanceData.availableBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(balanceData.availableBalance.toFixed(2))}
                    className="absolute right-3 top-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Chave PIX (Apenas o seu CPF)</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>
          </div>

          {/* Checkbox de Confirmação de Segurança */}
          <label
            className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 select-none ${
              confirmedSecurity
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
            }`}
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={confirmedSecurity}
                onChange={(e) => setConfirmedSecurity(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                confirmedSecurity
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-amber-400'
              }`}>
                {confirmedSecurity && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                Segurança Anti-Fraude
              </span>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Confirmo que li e entendi: o saque PIX é realizado <strong className="text-slate-700">exclusivamente</strong> para a conta bancária vinculada ao meu CPF cadastrado. Transferências para contas de terceiros são <strong className="text-slate-700">automaticamente bloqueadas</strong> pelo sistema de proteção InfluNext.
              </p>
            </div>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full h-14 rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-xl ${
              !canSubmit
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[1.02] active:scale-100'
            }`}
          >
            {isProcessing ? (
              <span className="animate-pulse flex items-center gap-2">Processando <Zap className="w-4 h-4" /></span>
            ) : !confirmedSecurity ? (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Confirme os termos para continuar
              </span>
            ) : (
              <span className="flex items-center gap-2">Confirmar Saque PIX <Zap className="w-4 h-4 fill-current" /></span>
            )}
          </button>

          {balanceData.availableBalance <= 0 && !isLoadingBalance && (
            <p className="text-center text-xs text-slate-400 font-medium">
              Seu saldo disponível será liberado após a conclusão de contratos.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
