import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade | InfluNext',
  description: 'Saiba como a InfluNext coleta, usa e protege seus dados pessoais, em conformidade com a LGPD (Lei 13.709/2018).',
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <header className="border-b border-slate-100 py-5 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[11px] font-black uppercase tracking-widest text-orange-600">
            ← InfluNext
          </Link>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LGPD · Lei 13.709/2018</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-600">Documento Oficial</span>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Política de Privacidade</h1>
          <p className="text-sm text-slate-500">Última atualização: julho de 2026 · Em conformidade com a LGPD (Lei nº 13.709/2018)</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">1. Controlador dos Dados</h2>
            <p>O controlador responsável pelo tratamento dos seus dados pessoais é a <strong>InfluNext Tecnologia Ltda.</strong>, com e-mail de contato do DPO (Encarregado de Proteção de Dados): <a href="mailto:privacidade@influnext.com.br" className="text-orange-600 font-bold hover:underline">privacidade@influnext.com.br</a>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">2. Dados que Coletamos</h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de Cadastro:</strong> nome, e-mail, senha (criptografada), cidade, estado e foto de perfil;</li>
              <li><strong>Dados de Performance (Influenciadores):</strong> métricas de redes sociais coletadas com seu consentimento explícito via OAuth (seguidores, engajamento, alcance);</li>
              <li><strong>Dados Financeiros:</strong> informações de pagamento processadas diretamente pela Stripe (não armazenamos dados de cartão);</li>
              <li><strong>Dados de Uso:</strong> logs de acesso, páginas visitadas e interações com a Plataforma, para fins de segurança e melhoria do serviço;</li>
              <li><strong>Cookies:</strong> tokens de autenticação (JWT) e preferências de interface, armazenados em cookies seguros (HttpOnly).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">3. Finalidade do Tratamento</h2>
            <p>Seus dados são utilizados para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Criação e gestão da sua conta na Plataforma;</li>
              <li>Prestação dos serviços contratados (conexão entre marcas e influenciadores);</li>
              <li>Processamento de pagamentos e liberação de valores via Escrow;</li>
              <li>Geração de relatórios e métricas de performance auditadas;</li>
              <li>Funcionamento do assistente de IA (Vincenzo / Valentina);</li>
              <li>Comunicações transacionais (confirmações de contrato, notificações de pagamento);</li>
              <li>Cumprimento de obrigações legais e regulatórias;</li>
              <li>Prevenção de fraudes e garantia de segurança da Plataforma.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">4. Base Legal</h2>
            <p>O tratamento dos seus dados é fundamentado nas seguintes bases legais previstas na LGPD:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Consentimento:</strong> para coleta de métricas de redes sociais e comunicações de marketing;</li>
              <li><strong>Execução de Contrato:</strong> para prestação dos serviços da Plataforma;</li>
              <li><strong>Legítimo Interesse:</strong> para segurança, prevenção de fraudes e melhoria do serviço;</li>
              <li><strong>Obrigação Legal:</strong> para cumprimento de requisitos fiscais e regulatórios.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">5. Compartilhamento de Dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe:</strong> para processamento de pagamentos (sujeito à Política de Privacidade da Stripe);</li>
              <li><strong>Railway / Vercel:</strong> provedores de infraestrutura em nuvem onde a Plataforma está hospedada;</li>
              <li><strong>Google (Gemini AI):</strong> para processamento de conteúdo pelo assistente de IA (dados anonimizados quando possível);</li>
              <li><strong>Partes Contratuais:</strong> marcas e influenciadores compartilham dados necessários para execução dos contratos (portfólio, métricas, briefings).</li>
            </ul>
            <p>Não vendemos seus dados pessoais a terceiros.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">6. Retenção de Dados</h2>
            <p>Mantemos seus dados pelo período necessário para a prestação dos serviços e cumprimento de obrigações legais. Dados de contratos são retidos por 5 (cinco) anos após o encerramento, conforme exigência fiscal brasileira. Dados de conta são excluídos em até 30 dias após solicitação de exclusão.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">7. Seus Direitos (LGPD)</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados;</li>
              <li>Acessar seus dados pessoais;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
              <li>Portabilidade dos seus dados para outro fornecedor de serviço;</li>
              <li>Revogar seu consentimento a qualquer momento;</li>
              <li>Opor-se a tratamentos realizados com base em legítimo interesse.</li>
            </ul>
            <p>Para exercer seus direitos, envie solicitação para: <a href="mailto:privacidade@influnext.com.br" className="text-orange-600 font-bold hover:underline">privacidade@influnext.com.br</a>.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">8. Segurança dos Dados</h2>
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo: criptografia AES-256 para dados sensíveis, HTTPS/TLS para todas as comunicações, autenticação de dois fatores (2FA) disponível, tokens JWT com expiração automática e acesso restrito a dados por princípio de mínimo privilégio.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">9. Cookies</h2>
            <p>Utilizamos cookies estritamente necessários para: manter sua sessão autenticada (JWT HttpOnly) e armazenar preferências de interface. Não utilizamos cookies de rastreamento publicitário de terceiros.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">10. Menores de Idade</h2>
            <p>A Plataforma não é destinada a menores de 18 anos. Não coletamos conscientemente dados de menores. Se identificarmos tal situação, procederemos com a exclusão imediata dos dados.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">11. Alterações nesta Política</h2>
            <p>Esta Política pode ser atualizada periodicamente. Comunicaremos alterações relevantes por e-mail com antecedência mínima de 15 dias. A versão mais recente sempre estará disponível nesta página.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">12. Contato e DPO</h2>
            <p>Para dúvidas, solicitações ou reclamações sobre privacidade e proteção de dados:<br/>
            <a href="mailto:privacidade@influnext.com.br" className="text-orange-600 font-bold hover:underline">privacidade@influnext.com.br</a></p>
            <p>Você também pode encaminhar reclamações à Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold hover:underline">www.gov.br/anpd</a></p>
          </section>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">© 2026 InfluNext Tecnologia Ltda.</p>
          <Link href="/termos" className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline">
            ← Termos de Uso
          </Link>
        </div>
      </main>
    </div>
  );
}
