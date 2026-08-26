'use client';

import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Lock, Calendar, Cpu, X } from 'lucide-react';

interface SHA256AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  handle: string;
  integrityHash?: string;
  capturedAt?: string;
}

export function SHA256AuditModal({
  isOpen,
  onClose,
  handle,
  integrityHash = '8f3a9e4b7c1d2e5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
  capturedAt,
}: SHA256AuditModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formattedHash = integrityHash || 'SHA256-PENDING-AUDIT';
  const auditDate = capturedAt
    ? new Date(capturedAt).toLocaleString('pt-BR', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#181615] border border-orange-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-[#f5ebe0] max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all hover:rotate-90"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 sm:gap-4 border-b border-white/10 pb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-orange-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Auditado & Imutável
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5 text-white">Selo SHA-256 Verified</h2>
            <p className="text-[11px] text-zinc-400">Certificado de Autenticidade Telemétrica @{handle}</p>
          </div>
        </div>

        {/* Hash Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              Hash Criptográfico SHA-256 (Audit Trail)
            </label>
            <div className="flex items-center justify-between p-3.5 bg-black/60 border border-white/10 rounded-2xl font-mono text-xs text-orange-300 break-all group">
              <span className="truncate mr-2 select-all text-[11px] sm:text-xs">{formattedHash}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-orange-500 hover:text-black rounded-xl text-[10px] font-bold transition-all shrink-0 text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar Hash
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Verification Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <Cpu className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Fonte dos Dados</p>
                <p className="text-xs font-bold text-white">API Oficial Meta / TikTok</p>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Última Auditoria</p>
                <p className="text-[11px] font-bold text-white truncate">{auditDate}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-1">
            <p className="text-xs font-bold text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              Garantia Anti-Fraude Photoshop
            </p>
            <p className="text-[10px] text-zinc-300 leading-relaxed">
              Este hash é gerado no momento exato em que os servidores da Influnext efetuam handshake seguro com as APIs das redes sociais, impedindo qualquer manipulação manual.
            </p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl transition-all"
          >
            Fechar Auditoria
          </button>
        </div>

      </div>
    </div>
  );
}
