import { api } from '@/lib/api';
import Link from 'next/link';

async function getAdminStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/stats`, {
      headers: { 'Cache-Control': 'no-store' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: 'Criadores', value: stats?.influencers ?? '—', icon: '👤', color: 'purple' },
    { label: 'Empresas', value: stats?.companies ?? '—', icon: '🏢', color: 'blue' },
    { label: 'Contratos Ativos', value: stats?.activeContracts ?? '—', icon: '📄', color: 'emerald' },
    { label: 'Volume em Escrow', value: stats?.escrowVolume ? `R$ ${stats.escrowVolume.toLocaleString('pt-BR')}` : '—', icon: '🛡️', color: 'pink' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              INFLUNEX<span className="text-purple-400 -rotate-12 inline-block">↗</span>
            </Link>
            <h1 className="text-3xl font-black mt-2">Painel Administrativo</h1>
            <p className="text-zinc-500 text-sm">Visão geral do ecossistema em tempo real.</p>
          </div>
          <div className="text-xs text-zinc-600 border border-white/5 bg-white/[0.02] px-3 py-2 rounded-lg">
            🟢 Sistema online
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-2">
              <div className="text-2xl">{c.icon}</div>
              <p className="text-3xl font-black">{c.value}</p>
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Status */}
        {!stats && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm p-4 rounded-xl">
            ⚠️ Não foi possível carregar os dados do backend. Verifique se a API está online e a variável{' '}
            <code className="font-mono">NEXT_PUBLIC_API_URL</code> está configurada.
          </div>
        )}

        {/* Links rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: '/dashboard/influencer', label: 'Ver Dashboard Criador', icon: '👤' },
            { href: '/dashboard/company', label: 'Ver Dashboard Empresa', icon: '🏢' },
            { href: '/auth/login', label: 'Página de Login', icon: '🔑' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] rounded-xl p-4 transition-colors text-sm font-semibold">
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
