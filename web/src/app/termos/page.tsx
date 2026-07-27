import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso | InfluNext',
  description: 'Leia os Termos de Uso da plataforma InfluNext. Entenda seus direitos e obrigações ao utilizar nosso serviço.',
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <header className="border-b border-slate-100 py-5 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[11px] font-black uppercase tracking-widest text-orange-600">
            ← InfluNext
          </Link>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documento Legal</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="space-y-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-600">Documento Oficial</span>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900">Termos de Uso</h1>
          <p className="text-sm text-slate-500">Última atualização: julho de 2026 · Versão 1.0</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">1. Aceitação dos Termos</h2>
            <p>Ao acessar ou utilizar a plataforma InfluNext ("Plataforma"), você concorda com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde, não utilize nossos serviços.</p>
            <p>Estes Termos constituem um contrato legalmente vinculante entre você e a <strong>InfluNext Tecnologia Ltda.</strong>, empresa com sede no Brasil.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">2. Descrição do Serviço</h2>
            <p>A InfluNext é uma plataforma digital que conecta <strong>criadores de conteúdo (influenciadores)</strong> a <strong>marcas e empresas</strong> para a realização de campanhas de marketing com pagamento seguro via sistema de custódia financeira (Escrow). Oferecemos ainda ferramentas de IA, relatórios de métricas auditadas e gestão de contratos digitais.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">3. Elegibilidade</h2>
            <p>Para usar a Plataforma, você deve ter no mínimo 18 anos, possuir capacidade civil plena para celebrar contratos, fornecer informações verdadeiras no cadastro e manter a segurança de suas credenciais de acesso.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">4. Contas e Responsabilidades</h2>
            <p>Você é responsável por todas as atividades realizadas em sua conta. Em caso de uso não autorizado, notifique imediatamente a InfluNext pelo canal de suporte. A InfluNext reserva-se o direito de suspender ou encerrar contas que violem estes Termos.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">5. Planos, Preços e Pagamentos</h2>
            <p>A Plataforma opera em modelo <strong>SaaS + Take-Rate</strong>: Plano Criador R$ 59,90/mês, Plano Empresa R$ 120,00/mês e Taxa de Escrow de 7% sobre o valor de cada campanha liquidada. Assinaturas são renovadas automaticamente no ciclo mensal.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">6. Sistema de Escrow e Contratos</h2>
            <p>O sistema Escrow funciona como custódia financeira: a empresa deposita o valor da campanha na Plataforma, que o retém com segurança até que o influenciador entregue o conteúdo acordado e a empresa aprove a entrega. Em caso de disputa, a InfluNext atua como mediadora imparcial.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">7. Conduta do Usuário</h2>
            <p>É expressamente proibido: fraudar métricas ou seguidores; divulgar conteúdo ilegal ou ofensivo; utilizar a Plataforma para fins ilegais; tentar acessar dados de outros usuários sem autorização; realizar transações fora da Plataforma para burlar o sistema Escrow.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">8. Propriedade Intelectual</h2>
            <p>Todo o conteúdo da Plataforma (código, design, marca, logotipo) é propriedade exclusiva da InfluNext. O conteúdo criado pelo influenciador para uma campanha é de sua autoria, porém a licença de uso é definida no contrato específico com a empresa.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">9. Limitação de Responsabilidade</h2>
            <p>A InfluNext não se responsabiliza por: qualidade ou resultado das campanhas; inadimplência fora do sistema Escrow; ou danos indiretos, incidentais ou consequenciais decorrentes do uso da Plataforma.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">10. Rescisão</h2>
            <p>Qualquer usuário pode cancelar sua conta a qualquer momento através das configurações. Contratos com Escrow em andamento seguem o fluxo de mediação previsto nestes Termos. Cobranças já realizadas não são reembolsadas, salvo erro comprovado da Plataforma.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">11. Lei Aplicável e Foro</h2>
            <p>Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da Comarca de São Paulo, SP, para dirimir quaisquer controvérsias, com renúncia expressa a qualquer outro foro.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">12. Contato</h2>
            <p>Dúvidas sobre estes Termos? Fale conosco: <a href="mailto:legal@influnext.com.br" className="text-orange-600 font-bold hover:underline">legal@influnext.com.br</a></p>
          </section>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">© 2026 InfluNext Tecnologia Ltda.</p>
          <Link href="/privacidade" className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline">
            Politica de Privacidade →
          </Link>
        </div>
      </main>
    </div>
  );
}
