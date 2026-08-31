'use client';

import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Lock, 
  User, 
  Building2,
  CheckCircle2,
  Send,
  Mail,
  Scale,
  PenTool
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Estados da Assinatura Interativa
  const defaultSignerName = contract.influencer?.handle ? `@${contract.influencer.handle.replace('@', '')}` : 'Signatário Autorizado';
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signatureStyle, setSignatureStyle] = useState<'STYLE_1' | 'STYLE_2'>('STYLE_1');

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

  const handleConfirmSignature = async () => {
    if (!consentChecked) {
      toast.error('Você deve marcar a caixa de consentimento dos termos antes de assinar.');
      return;
    }
    if (onSign) {
      await onSign();
      toast.success('Contrato assinado eletronicamente com sucesso!', {
        description: 'Notificação e via em PDF enviadas por e-mail para ambas as partes.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden my-auto text-slate-900">
        
        {/* Modal Top Header (Actions) */}
        <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-slate-200 bg-white sticky top-0 z-20 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-600 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
                Minuta Jurídica Oficial InfluNext
                <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Válido Juridicamente
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">ID: {contract.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-sm"
              title="Imprimir / Salvar PDF"
            >
              <Printer className="w-4 h-4 text-orange-600" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Legal Printable Document (White & Orange) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#F8FAFC] font-sans leading-relaxed text-slate-700 print:p-0 print:bg-white print:text-black">
          
          {/* Document Printable Container */}
          <div ref={printRef} className="space-y-8 max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-3xl border border-slate-200/80 shadow-sm print:border-none print:shadow-none">
            
            {/* Header Documento Timbrado */}
            <div className="text-center pb-8 border-b border-slate-200 space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-black text-orange-600 tracking-[0.25em] uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <ShieldCheck className="w-4 h-4" /> InfluNext SafePay Escrow
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase">
                Instrumento Particular de Prestação de Serviços de Publicidade Digital, Licenciamento de Imagem e Custódia Escrow
              </h1>
              <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto">
                Celebrado em conformidade com o Código Civil Brasileiro (Lei nº 10.406/02), Marco Civil da Internet (Lei nº 12.965/14) e Legislação de Assinatura Eletrônica (MP 2.200-2/01 e Lei nº 14.063/20).
              </p>
            </div>

            {/* Selo Criptográfico & Status */}
            <div className="p-5 rounded-2xl border border-orange-200 bg-orange-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-600" /> Hash Criptográfico de Auditoria (SHA-256)
                </span>
                <p className="font-mono text-[11px] text-orange-950 break-all font-bold">
                  {contract.signatureHash || 'Geração automática na assinatura final'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Status Contratual</span>
                <span className="inline-block mt-0.5 text-xs font-extrabold px-3 py-1 rounded-lg bg-orange-600 text-white shadow-sm">
                  {contract.escrowStatus}
                </span>
              </div>
            </div>

            {/* 1. Qualificação das Partes */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-orange-600 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" /> 1. Qualificação das Partes Contratantes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Contratante (Empresa) */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                    <Building2 className="w-3.5 h-3.5 text-orange-600" /> Contratante (Marca / Empresa)
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm">{contract.company?.companyName || 'Empresa Contratante'}</p>
                  <p className="text-slate-600">CNPJ: <span className="font-mono text-slate-800">{contract.company?.taxId || 'Cadastrado na plataforma'}</span></p>
                  <p className="text-slate-600">Localidade: <span className="text-slate-800">{contract.company?.city ? `${contract.company.city}/${contract.company.state}` : 'Brasil'}</span></p>
                  <p className="text-slate-600">E-mail: <span className="text-slate-800">{contract.company?.user?.email || 'Verificado'}</span></p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    {contract.companySigned ? `✓ Assinado digitalmente (IP: ${contract.companyIp || 'Registrado'})` : 'Pendente de assinatura'}
                  </p>
                </div>

                {/* Contratado (Influenciador) */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px]">
                    <User className="w-3.5 h-3.5 text-orange-600" /> Contratado (Criador de Conteúdo)
                  </div>
                  <p className="font-extrabold text-slate-900 text-sm">@{contract.influencer?.handle || 'Influenciador'}</p>
                  <p className="text-slate-600">Nicho / Segmento: <span className="text-slate-800">{contract.influencer?.niche || 'Geral'}</span></p>
                  <p className="text-slate-600">Localidade: <span className="text-slate-800">{contract.influencer?.city ? `${contract.influencer.city}/${contract.influencer.state}` : 'Brasil'}</span></p>
                  <p className="text-slate-600">E-mail: <span className="text-slate-800">{contract.influencer?.user?.email || 'Verificado'}</span></p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    {contract.influencerSigned ? `✓ Assinado digitalmente (IP: ${contract.influencerIp || 'Registrado'})` : 'Pendente de aceite do Creator'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. As 7 Cláusulas Oficiais */}
            <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
              <h2 className="text-xs font-black uppercase tracking-wider text-orange-600 border-b border-slate-200 pb-2">
                2. Cláusulas e Condições Gerais
              </h2>

              {/* Cláusula 1 */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Cláusula 1ª — Do Objeto e Escopo dos Entregáveis
                </h4>
                <p>
                  O presente contrato tem por objeto a prestação de serviços de publicidade digital e influência pelo <strong>CONTRATADO</strong> em favor da <strong>CONTRATANTE</strong> para a campanha denominada <strong>"{contract.title}"</strong>, compreendendo a criação, gravação e veiculação dos entregáveis formalizados no Anexo I deste instrumento.
                </p>
                {contract.briefing && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 mt-2 italic text-[11px]">
                    <strong>Briefing e Diretrizes Acordadas:</strong> {contract.briefing}
                  </div>
                )}
              </div>

              {/* Cláusula 2 */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Cláusula 2ª — Da Cessão e Licenciamento de Imagem, Nome e Voz
                </h4>
                <p>
                  O <strong>CONTRATADO</strong> concede à <strong>CONTRATANTE</strong> a licença não exclusiva para uso de sua imagem, voz e conteúdo gerado exclusivamente no âmbito desta campanha, com as seguintes condições acordadas:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Prazo de Veiculação:</strong> {usageRightsText}</li>
                  <li><strong>Modalidade de Distribuição:</strong> {paidMediaText}</li>
                  <li><strong>Território:</strong> Território nacional e mundial via internet.</li>
                </ul>
              </div>

              {/* Cláusula 3 */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Cláusula 3ª — Da Conformidade Publicitária, CONAR e Legislação Digital
                </h4>
                <p>
                  As partes comprometem-se a cumprir rigorosamente o Código de Autorregulamentação Publicitária do <strong>CONAR</strong>, o Código de Defesa do Consumidor (Lei 8.078/90) e o Marco Civil da Internet (Lei 12.965/14). O <strong>CONTRATADO</strong> obriga-se a sinalizar publicamente a publicidade por meio das tags oficiais (ex.: <em>#publi, #parceria ou indicação de parceria paga nativa</em>), abstendo-se de fazer alegações enganosas sobre produtos ou serviços.
                </p>
              </div>

              {/* Cláusula 4 */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Cláusula 4ª — Da Exclusividade Setorial e Não-Concorrência
                </h4>
                <p>
                  {exclusivityText} Durante eventual vigência de exclusividade, o <strong>CONTRATADO</strong> não veiculará anúncios de concorrentes diretos que atuem no mesmo segmento comercial da <strong>CONTRATANTE</strong>.
                </p>
              </div>

              {/* Cláusula 5 */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Cláusula 5ª — Dos Prazos, Ajustes de Prévia (Drafts) e Política de Qualidade
                </h4>
                <p>
                  O <strong>CONTRATADO</strong> deverá submeter o material bruto/editado para aprovação prévia da <strong>CONTRATANTE</strong> antes da publicação definitiva. A <strong>CONTRATANTE</strong> terá o direito de solicitar até 2 (duas) rodadas de ajustes pontuais, desde que alinhadas ao briefing original acordado.
                </p>
              </div>

              {/* Cláusula 6 */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Cláusula 6ª — Do Pagamento, Custódia SafePay Escrow e Regra de Auto-Release
                </h4>
                <p>
                  O valor total acordado para esta campanha é de <strong>R$ {Number(contract.budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, que permanecerá sob custódia e garantia da <strong>InfluNext SafePay Escrow</strong>. Após o envio do comprovante do link de publicação pelo <strong>CONTRATADO</strong>, a <strong>CONTRATANTE</strong> terá o prazo de <strong>5 (cinco) dias úteis</strong> para validar e aprovar a entrega. Transcorrido esse prazo sem manifestação, o sistema efetuará o <em>auto-release</em> (liberação automática) dos fundos ao <strong>CONTRATADO</strong>.
                </p>
              </div>

              {/* Cláusula 7 */}
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Cláusula 7ª — Da Mediação Arbitral, Foro e Validade da Assinatura Eletrônica
                </h4>
                <p>
                  Eventuais divergências serão preferencialmente dirimidas através do mecanismo de Mediação e Disputas da InfluNext. As partes reconhecem a plena validade jurídica e executiva deste instrumento assinado por meio eletrônico, em conformidade com o art. 10, § 2º da Medida Provisória nº 2.200-2/2001 e a Lei nº 14.063/2020.
                </p>
              </div>
            </div>

            {/* 3. Anexo I — Entregáveis Registrados */}
            <div className="space-y-3 border-t border-slate-200 pt-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-orange-600">
                Anexo I — Relação Formal de Entregáveis
              </h2>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Item / Peça</th>
                      <th className="p-3.5">Tipo</th>
                      <th className="p-3.5">Prazo Limite</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {contract.deliverables && contract.deliverables.length > 0 ? (
                      contract.deliverables.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-slate-900">{item.title || `Entregável #${idx + 1}`}</td>
                          <td className="p-3.5 text-slate-600 font-mono text-[11px]">{item.type}</td>
                          <td className="p-3.5 text-slate-600">{item.deadline || item.dueDate ? new Date(item.deadline || item.dueDate!).toLocaleDateString('pt-BR') : 'A definir'}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {item.status || 'PENDENTE'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          1x Ação Publicitária Conforme Briefing Registrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Quadro de Assinaturas e Consentimento */}
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-2">
                <PenTool className="w-4 h-4" /> 3. Quadro de Assinaturas Eletrônicas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assinatura Contratante */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500">Assinatura da Contratante</span>
                  <div className="h-14 border-b border-slate-300 flex items-center justify-center font-serif italic text-base text-slate-900">
                    {contract.company?.companyName || 'Empresa Contratante'}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {contract.companySigned ? `IP: ${contract.companyIp || '187.54.21.90'} // Data: ${formattedDate}` : 'Assinatura Registrada no Envio'}
                  </p>
                </div>

                {/* Assinatura Contratado */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500">Assinatura do Contratado (Creator)</span>
                  <div className="h-14 border-b border-slate-300 flex items-center justify-center font-serif italic text-base text-slate-900">
                    {contract.influencerSigned ? (
                      `@${contract.influencer?.handle || 'Influenciador'}`
                    ) : (
                      <span className="text-orange-600 font-sans font-bold text-xs">Aguardando confirmação do Creator</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {contract.influencerSigned ? `IP: ${contract.influencerIp || 'Auditado'} // Data: ${signedDate || formattedDate}` : 'Pendente de Aceite'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 5. Painel de Ação de Assinatura Interativa (se canSign) */}
          {canSign && !contract.influencerSigned && (
            <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-3xl border border-orange-300 bg-orange-50/70 shadow-lg space-y-5 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Firmar Assinatura Eletrônica do Contrato
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    Ao assinar, ambas as partes recebem o comprovante por e-mail e a custódia SafePay é confirmada.
                  </p>
                </div>
              </div>

              {/* Nome do Signatário e Pré-visualização da Rubrica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Nome do Signatário / Titular</label>
                  <input 
                    type="text" 
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Seu nome completo..."
                    className="w-full px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Rubrica Digital Estilizada</label>
                  <div className="w-full px-4 py-2 text-sm font-serif italic rounded-xl border border-slate-300 bg-white text-slate-900 flex items-center justify-center">
                    {signerName || 'Assinatura'}
                  </div>
                </div>
              </div>

              {/* Checkbox de Aceite Legal */}
              <div className="flex items-start gap-3 pt-2">
                <input 
                  type="checkbox"
                  id="consentLegal"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="w-5 h-5 accent-orange-600 rounded mt-0.5"
                />
                <label htmlFor="consentLegal" className="text-xs text-slate-800 leading-relaxed font-medium cursor-pointer">
                  Declaro que li e concordo integralmente com as <strong>7 Cláusulas Gerais</strong> desta Minuta Jurídica e autorizo o registro do meu endereço IP sob a <strong>MP 2.200-2/2001 e Lei 14.063/2020</strong>.
                </label>
              </div>

              {/* Botão de Envio */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSignature}
                  disabled={isSigning || !consentChecked}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSigning ? (
                    'Gerando Hash SHA-256 & Assinando...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Assinar Eletronicamente e Notificar por E-mail
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 md:px-8 py-4 border-t border-slate-200 bg-white print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Protegido por custódia SafePay Escrow
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
