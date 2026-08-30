'use client';

import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Lock, 
  User, 
  Building2
} from 'lucide-react';

export interface ContractLegalData {
  id: string;
  title: string;
  budget: number;
  netAmount?: number | null;
  platformFee?: number | null;
  escrowStatus: string;
  contractType?: string;
  createdAt: string;
  briefing?: string | null;
  aiScript?: string | null;
  companySigned?: boolean;
  influencerSigned?: boolean;
  companyIp?: string | null;
  influencerIp?: string | null;
  signatureHash?: string | null;
  signedAt?: string | null;
  exclusivityDays?: number | null;
  usageRightsDays?: number | null;
  allowPaidMedia?: boolean | null;
  company?: {
    companyName: string;
    taxId?: string | null;
    city?: string | null;
    state?: string | null;
    user?: { email?: string };
  };
  influencer?: {
    handle: string;
    niche?: string | null;
    city?: string | null;
    state?: string | null;
    user?: { email?: string };
  };
  deliverables?: {
    id?: string;
    type: string;
    deadline?: string;
    dueDate?: string;
    status?: string;
    title?: string;
  }[];
}

interface ContractLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractLegalData;
  onSign?: () => Promise<void>;
  isSigning?: boolean;
  canSign?: boolean;
}

export function ContractLegalModal({
  isOpen,
  onClose,
  contract,
  onSign,
  isSigning = false,
  canSign = false
}: ContractLegalModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(contract.createdAt || Date.now()).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const signedDate = contract.signedAt 
    ? new Date(contract.signedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  const exclusivityText = contract.exclusivityDays && contract.exclusivityDays > 0
    ? `Exclusividade setorial obrigatória pelo período de ${contract.exclusivityDays} dias a contar da assinatura.`
    : 'Sem cláusula de exclusividade setorial (livre atuação).';

  const usageRightsText = `${contract.usageRightsDays || 30} dias de licenciamento de uso de imagem e voz para a Contratante a partir da data de publicação.`;

  const paidMediaText = contract.allowPaidMedia
    ? 'Autorizado o uso do conteúdo para anúncios patrocinados (Tráfego Pago / Dark Post / Meta Ads).'
    : 'Uso estritamente orgânico nos perfis oficiais (vedada a criação de anúncios pagos com o criador sem aditivo contratual).';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden my-auto text-zinc-100">
        
        {/* Modal Top Header (Actions) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 sticky top-0 z-20 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-outfit text-sm font-bold text-white flex items-center gap-2">
                Minuta Jurídica Oficial InfluNext
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Válido Juridicamente
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">ID: {contract.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors shadow-sm"
              title="Imprimir / Salvar PDF"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Legal Printable Document */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-zinc-950 font-sans leading-relaxed text-zinc-300 print:p-0 print:bg-white print:text-black">
          
          {/* Document Printable Container */}
          <div ref={printRef} className="space-y-8 max-w-3xl mx-auto">
            
            {/* Header Documento Timbrado */}
            <div className="text-center pb-8 border-b border-zinc-800 print:border-zinc-300 space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-black text-orange-500 tracking-[0.25em] uppercase">
                <ShieldCheck className="w-4 h-4" /> InfluNext SafePay Escrow
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white print:text-black tracking-tight uppercase">
                Instrumento Particular de Prestação de Serviços de Publicidade Digital, Licenciamento de Imagem e Custódia Escrow
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Celebrado em conformidade com o Código Civil Brasileiro (Lei nº 10.406/02), Marco Civil da Internet (Lei nº 12.965/14) e Legislação de Assinatura Eletrônica (MP 2.200-2/01 e Lei nº 14.063/20).
              </p>
            </div>

            {/* Selo Criptográfico & Status */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 print:bg-zinc-100 print:border-zinc-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" /> Hash Criptográfico de Auditoria (SHA-256)
                </span>
                <p className="font-mono text-[11px] text-orange-400/90 break-all font-bold">
                  {contract.signatureHash || 'Geração automática na assinatura final'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Status Contratual</span>
                <span className="inline-block mt-0.5 text-xs font-bold px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {contract.escrowStatus}
                </span>
              </div>
            </div>

            {/* Qualificação das Partes */}
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-orange-400 border-b border-zinc-800 pb-2">
                1. Qualificação das Partes Contratantes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Contratante (Empresa) */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-[10px]">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" /> Contratante (Marca / Empresa)
                  </div>
                  <p className="font-bold text-white text-sm">{contract.company?.companyName || 'Empresa Contratante'}</p>
                  <p className="text-zinc-400">CNPJ: <span className="font-mono text-zinc-300">{contract.company?.taxId || 'Cadastrado na plataforma'}</span></p>
                  <p className="text-zinc-400">Localidade: <span className="text-zinc-300">{contract.company?.city ? `${contract.company.city}/${contract.company.state}` : 'Brasil'}</span></p>
                  <p className="text-zinc-400">E-mail: <span className="text-zinc-300">{contract.company?.user?.email || 'Verificado'}</span></p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                    {contract.companySigned ? `✓ Assinado digitalmente (IP: ${contract.companyIp || 'Registrado'})` : 'Pendente de assinatura'}
                  </p>
                </div>

                {/* Contratado (Influenciador) */}
                <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-[10px]">
                    <User className="w-3.5 h-3.5 text-orange-400" /> Contratado (Criador de Conteúdo)
                  </div>
                  <p className="font-bold text-white text-sm">@{contract.influencer?.handle || 'Influenciador'}</p>
                  <p className="text-zinc-400">Nicho / Segmento: <span className="text-zinc-300">{contract.influencer?.niche || 'Geral'}</span></p>
                  <p className="text-zinc-400">Localidade: <span className="text-zinc-300">{contract.influencer?.city ? `${contract.influencer.city}/${contract.influencer.state}` : 'Brasil'}</span></p>
                  <p className="text-zinc-400">E-mail: <span className="text-zinc-300">{contract.influencer?.user?.email || 'Verificado'}</span></p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                    {contract.influencerSigned ? `✓ Assinado digitalmente (IP: ${contract.influencerIp || 'Registrado'})` : 'Pendente de aceite do Creator'}
                  </p>
                </div>
              </div>
            </div>

            {/* As 7 Cláusulas Oficiais */}
            <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
              <h2 className="text-sm font-black uppercase tracking-wider text-orange-400 border-b border-zinc-800 pb-2">
                2. Cláusulas e Condições Gerais
              </h2>

              {/* Cláusula 1 */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Cláusula 1ª — Do Objeto e Escopo dos Entregáveis
                </h4>
                <p>
                  O presente contrato tem por objeto a prestação de serviços de publicidade digital e influência pelo <strong>CONTRATADO</strong> em favor da <strong>CONTRATANTE</strong> para a campanha denominada <strong>"{contract.title}"</strong>, compreendendo a criação, gravação e veiculação dos entregáveis formalizados no Anexo I deste instrumento.
                </p>
                {contract.briefing && (
                  <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 mt-2 italic text-[11px]">
                    <strong>Briefing e Diretrizes Acordadas:</strong> {contract.briefing}
                  </div>
                )}
              </div>

              {/* Cláusula 2 */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Cláusula 2ª — Da Cessão e Licenciamento de Imagem, Nome e Voz
                </h4>
                <p>
                  O <strong>CONTRATADO</strong> concede à <strong>CONTRATANTE</strong> a licença não exclusiva para uso de sua imagem, voz e conteúdo gerado exclusivamente no âmbito desta campanha, com as seguintes condições acordadas:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li><strong>Prazo de Veiculação:</strong> {usageRightsText}</li>
                  <li><strong>Modalidade de Distribuição:</strong> {paidMediaText}</li>
                  <li><strong>Território:</strong> Território nacional e mundial via internet.</li>
                </ul>
              </div>

              {/* Cláusula 3 */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Cláusula 3ª — Da Conformidade Publicitária, CONAR e Legislação Digital
                </h4>
                <p>
                  As partes comprometem-se a cumprir rigorosamente o Código de Autorregulamentação Publicitária do <strong>CONAR</strong>, o Código de Defesa do Consumidor (Lei 8.078/90) e o Marco Civil da Internet (Lei 12.965/14). O <strong>CONTRATADO</strong> obriga-se a sinalizar publicamente a publicidade por meio das tags oficiais (ex.: <em>#publi, #parceria ou indicação de parceria paga nativa</em>), abstendo-se de fazer alegações enganosas sobre produtos ou serviços.
                </p>
              </div>

              {/* Cláusula 4 */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Cláusula 4ª — Da Exclusividade Setorial e Não-Concorrência
                </h4>
                <p>
                  {exclusivityText} Durante eventual vigência de exclusividade, o <strong>CONTRATADO</strong> não veiculará anúncios de concorrentes diretos que atuem no mesmo segmento comercial da <strong>CONTRATANTE</strong>.
                </p>
              </div>

              {/* Cláusula 5 */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Cláusula 5ª — Dos Prazos, Ajustes de Prévia (Drafts) e Qualidade
                </h4>
                <p>
                  O <strong>CONTRATADO</strong> deverá submeter os conteúdos para aprovação ou publicar conforme os prazos estipulados no Anexo I. A <strong>CONTRATANTE</strong> possui o direito de solicitar até 2 (duas) rodadas de ajustes pontuais para adequação ao briefing, devendo responder em até 48 (quarenta e oito) horas úteis, sob pena de aprovação tácita da entrega.
                </p>
              </div>

              {/* Cláusula 6 */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Cláusula 6ª — Do Pagamento, Custódia SafePay Escrow e Regra de Auto-Release
                </h4>
                <p>
                  Pela prestação dos serviços, a <strong>CONTRATANTE</strong> deposita o valor bruto de <strong>R$ {Number(contract.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> sob custódia integral da plataforma InfluNext SafePay. Os recursos permanecem bloqueados até a entrega satisfatória dos itens acordados.
                </p>
                <p className="text-zinc-400 mt-1">
                  <strong>Regra de Liberação Automática (Auto-Release):</strong> Uma vez enviado o link comprobatório pelo influenciador, a marca tem até 5 (cinco) dias úteis para homologar a entrega ou solicitar mediação. Transcorrido o prazo sem manifestação justificada, o valor líquido será transferido automaticamente ao criador.
                </p>
              </div>

              {/* Cláusula 7 */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Cláusula 7ª — Da Mediação Arbitral e Validade da Assinatura Eletrônica
                </h4>
                <p>
                  Em caso de divergência ou controvérsia insuperável, as partes submeterão o litígio ao Centro de Suporte e Disputas SafePay da InfluNext para mediação vinculante. Ambas as partes reconhecem a plena validade, higidez jurídica e eficácia executiva do presente documento firmado eletronicamente por meio da plataforma InfluNext, com registro de hashes SHA-256 e IPs de autenticação (conforme art. 10, § 2º da MP 2.200-2/01 e Lei 14.063/20).
                </p>
              </div>
            </div>

            {/* Anexo I: Entregáveis */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-400">
                Anexo I — Relação de Entregáveis e Prazos Finais
              </h3>

              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900 text-zinc-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Item / Entregável</th>
                      <th className="p-3">Formato</th>
                      <th className="p-3">Prazo Limite</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {contract.deliverables && contract.deliverables.length > 0 ? (
                      contract.deliverables.map((d, idx) => (
                        <tr key={d.id || idx} className="hover:bg-zinc-900/30">
                          <td className="p-3 font-medium text-white">{d.title || `Entregável #${idx + 1}`}</td>
                          <td className="p-3 text-zinc-400 font-mono">{d.type}</td>
                          <td className="p-3 text-zinc-300">
                            {d.deadline || d.dueDate ? new Date(d.deadline || d.dueDate || '').toLocaleDateString('pt-BR') : 'A definir'}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-400">{d.status || 'PENDENTE'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-zinc-500 italic">Entregáveis especificados no briefing principal.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quadro de Assinaturas e Consent Log */}
            <div className="pt-8 border-t-2 border-zinc-800 print:border-black space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs">
                {/* Assinatura Contratante */}
                <div className="space-y-2 p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
                  <div className="h-10 flex items-center justify-center">
                    {contract.companySigned ? (
                      <span className="font-serif italic text-base text-orange-400 font-bold">
                        {contract.company?.companyName}
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">Pendente</span>
                    )}
                  </div>
                  <div className="border-t border-zinc-700 pt-2">
                    <p className="font-bold text-white">{contract.company?.companyName || 'Contratante'}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {contract.companySigned ? `IP: ${contract.companyIp || 'Registrado'} • ${formattedDate}` : 'Aguardando formalização'}
                    </p>
                  </div>
                </div>

                {/* Assinatura Contratado */}
                <div className="space-y-2 p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20">
                  <div className="h-10 flex items-center justify-center">
                    {contract.influencerSigned ? (
                      <span className="font-serif italic text-base text-emerald-400 font-bold">
                        @{contract.influencer?.handle}
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">Aguardando aceite</span>
                    )}
                  </div>
                  <div className="border-t border-zinc-700 pt-2">
                    <p className="font-bold text-white">@{contract.influencer?.handle || 'Contratado'}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {contract.influencerSigned ? `IP: ${contract.influencerIp || 'Registrado'} • ${signedDate || formattedDate}` : 'Pendente de Assinatura'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registro Legal de Custódia */}
              <div className="text-center text-[10px] text-zinc-500 space-y-1">
                <p>Documento autenticado pela infraestrutura criptográfica InfluNext SafePay.</p>
                <p className="font-mono">Carimbo de Integridade: SHA256:{contract.signatureHash?.slice(0, 32)}...</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Protegido por custódia SafePay Escrow
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors w-full sm:w-auto"
            >
              Fechar
            </button>

            {canSign && onSign && (
              <button
                onClick={onSign}
                disabled={isSigning}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {isSigning ? (
                  'Registrando Assinatura SHA-256...'
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Assinar e Aceitar Contrato
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
