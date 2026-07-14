# 📊 InfluNext — Modelo de Negócios & Precificação (Modelo Híbrido Simplificado)

> **Versão aprovada em: julho de 2026 — Alexsandro Junior**
> 
> Este documento registra o modelo de negócios oficial do InfluNext após a revisão estratégica de produto. Os valores aqui definidos são a referência única para implementação de código, interfaces, seeds do banco de dados e comunicação comercial.

---

## 💼 1. O Modelo de Negócios Híbrido (SaaS + Take-Rate)

A InfluNext opera em um modelo bilateral (Marketplace de dois lados). A receita é gerada de duas fontes complementares e distintas:

1.  **Assinatura Recorrente (SaaS)**: Paga mensalmente pelos criadores e pelas empresas. Garante receita previsível (MRR) independente do volume de transações do período.
2.  **Taxa de Intermediação (Take-Rate de 7%)**: Comissão retida sobre o valor de cada campanha liquidada via Escrow. Escala diretamente com o crescimento do GMV (Volume Bruto de Transações) da plataforma.

A lógica de cada cobrança é comunicada de forma clara:
*   **Mensalidade** → paga o acesso à plataforma, às IAs especializadas (Vincenzo/Valentina e Vektor) e ao histórico de performance.
*   **Taxa de Escrow (7%)** → remunera especificamente a infraestrutura de custódia segura, mediação de disputas e auditoria de entregáveis.

---

## 👤 2. Plano para Criadores (Creators)

| Recurso | Gratuito (Free) | Creator Premium |
| :--- | :--- | :--- |
| **Mensalidade** | **R$ 0,00** | **R$ 59,90 / mês** |
| **Taxa de Escrow** | **7%** por contrato liquidado | **7%** por contrato liquidado |
| **Mentor de IA Vincenzo/Valentina** | Acesso limitado (dicas básicas) | **Acesso ilimitado + Gerador de Roteiros Avançado** |
| **Conexões de Conta** | 1 conta (Instagram) | **Múltiplas contas (Instagram + TikTok)** |
| **Contratos Ativos Simultaneamente** | 1 contrato | **Ilimitado** |
| **Portfólio e Visibilidade** | Perfil padrão | **Selo "Verificado PRO" + Destaque na Busca** |

### 🧠 A Matemática do Upgrade
O plano Premium de **R$ 59,90/mês** se paga rapidamente para criadores com faturamento mensal em campanhas:

*   Em ambos os planos, a taxa de Escrow é de **7%**.
*   A mensalidade do Premium de R$ 59,90 dá acesso ilimitado à IA estratégica Vincenzo/Valentina.
*   A partir de R$ 200,00/mês em roteiros e contratos, o criador já recupera o valor investido com a IA (2–3 contratos fechados com suporte estratégico valem mais do que a assinatura).

---

## 🏢 3. Plano para Empresas (Brands)

| Recurso | Gratuito (Free) | Company Premium |
| :--- | :--- | :--- |
| **Mensalidade** | **R$ 0,00** | **R$ 120,00 / mês** |
| **Taxa de Escrow** | **7%** adicionados no checkout | **7%** adicionados no checkout |
| **Contratos Ativos Simultâneos** | Máximo de 3 contratos | **Ilimitado** |
| **Relatórios de Marketing (Vektor)** | 1 análise por mês | **15 análises por mês** |
| **Briefing e Matching de Criadores (Vektor)** | Básico | **Matching inteligente com base em performance real** |
| **Gestão de Equipe (Co-working)** | 1 usuário admin | **Multi-usuários e gerenciamento em lote** |

---

## 📐 4. Estrutura da Taxa de Escrow

*   **Taxa unificada:** 7% sobre o valor do cachê contratado
*   **Cálculo:** `valor_total_pago = cachê + (cachê × 0.07)`
*   **Exemplo:** Cachê de R$ 1.000,00 → Empresa deposita R$ 1.070,00 → Criador recebe R$ 1.000,00 após aprovação.
*   **Custódia:** Gerenciada via **Stripe Connect Express** (custódia terceirizada). A InfluNext não retém valores em conta bancária própria, evitando necessidade de autorização do Banco Central.

---

## 📈 5. Projeção de Receita — Mês 12 (Cenários)

Projeção simplificada de receita mensal recorrente no mês 12, com taxa de escrow de 7% e ticket médio de R$ 1.000 por contrato:

| Cenário | Criadores / Empresas | Contratos/mês | Receita Mensal Projetada |
| :--- | :--- | :--- | :--- |
| **Conservador** | 150 criadores / 20 empresas | ~35 contratos | **≈ R$ 13.700/mês** |
| **Base** | 400 criadores / 60 empresas | ~100 contratos | **≈ R$ 38.200/mês** |
| **Otimista** | 800 criadores / 150 empresas | ~250 contratos | **≈ R$ 83.400/mês** |

*As projeções assumem uma curva de adoção dependente de execução de GTM (DM outreach manual nos primeiros 100 criadores). Estas cifras servem para orientar prioridades de investimento, não substituem o modelo financeiro de 5 anos.*

---

## 🛠️ 6. Implementação Técnica do Modelo

*   **Stripe Checkout (Contratos de Escrow):** `payment.controller.ts` → `createContractCheckoutSession` e `createPaymentIntent` calculam automaticamente `budget × 1.07`.
*   **Stripe Webhooks:** O evento `checkout.session.completed` (mode: `payment`) marca o contrato como `IN_PROGRESS` e notifica o criador para iniciar a produção.
*   **Relatórios de Marketing:** `marketing-intelligence.controller.ts` → `TIER_CREDITS` define os limites mensais de análises por tier de assinatura ativa.
*   **Reembolsos:** Em caso de cancelamento antes da entrega, o estorno é de 100% do valor depositado. A taxa de processamento Stripe (≈4%) é absorvida pela plataforma como custo operacional.
