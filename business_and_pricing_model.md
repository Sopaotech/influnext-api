# 📊 InfluNext - Relatório Estratégico de Negócios & Modelo de Precificação Simplificado (2 Planos)

Este documento apresenta a lógica de faturamento, a modelagem financeira e a estratégia de atração de investimentos baseada em um modelo simplificado de **dois planos** (Free e Pago) para ambos os lados do marketplace (Criadores e Marcas).

---

## 💼 1. O Modelo de Negócios Híbrido (SaaS + Take-Rate)

A InfluNext opera em um modelo bilateral (Marketplace de dois lados). Portanto, nossa receita é gerada de duas formas complementares:
1.  **Assinatura Recorrente (SaaS)**: Paga mensalmente pelos criadores (para liberar recursos de IA e diminuir taxas) e pelas marcas (para gerenciar campanhas ilimitadas com taxa de Escrow zero).
2.  **Taxa de Transação (Take-Rate)**: Comissão retida sobre o valor de cada campanha intermediada em Escrow (paga pela marca no depósito e/ou deduzida do criador no saque).

---

## 🎨 2. Modelos de Planos para Criadores (Creators)

Consolidamos os planos de criadores em apenas **duas opções** para reduzir o atrito na tomada de decisão (Choice Paralysis) e acelerar a conversão para planos pagos.

### Tabela de Planos (Creators)

| Recurso | InfluNext Free (Starter) | InfluNext Premium (Pro Creator) |
| :--- | :--- | :--- |
| **Mensalidade** | **R$ 0,00** | **R$ 100,00 / mês** |
| **Taxa Transacional (Comissão)** | **15%** por campanha finalizada | **5%** por campanha (taxa mínima) |
| **Mentor de IA (Vincenzo)** | Limitado (Dicas básicas) | **Ilimitado + Gerador de Roteiros Avançado** |
| **Conexões Sociais** | 1 conta conectada (Instagram) | **Contas ilimitadas** (Insta, TikTok, YouTube) |
| **Limites de Contrato** | 1 contrato ativo por vez | **Contratos ativos ilimitados** |
| **Visibilidade** | Perfil Padrão | Selo "Verificado PRO" + Destaque na Busca |

### 🧠 A Matemática do Upgrade (Fórmula de ROI do Creator)
O plano Premium de **R$ 100,00/mês** torna-se financeiramente vantajoso a partir de **R$ 1.000,00** de faturamento mensal em campanhas:
*   **No plano Free (15%):** R$ 1.000,00 em jobs retém **R$ 150,00** em taxas.
*   **No plano Premium (R$ 100,00/mês + 5%):** R$ 1.000,00 em jobs retém **R$ 50,00** de taxa + **R$ 100,00** de assinatura = **R$ 150,00** no total.
*   **A partir de R$ 1.001,00:** O criador economiza taxas a cada nova campanha concluída, além de desfrutar de ferramentas exclusivas de IA e conexões sociais ilimitadas.

---

## 🏢 3. Modelos de Planos para Marcas (Brands / Empresas)

Para as marcas, o valor está na automação, segurança (Escrow) e inteligência de dados (análise de métricas, sugestão inteligente de influenciadores e painel de gestão).

### Tabela de Planos (Brands)

| Recurso | Starter Corporativo (Free) | Agency / Co-Working (Premium) |
| :--- | :--- | :--- |
| **Mensalidade** | **R$ 0,00** | **R$ 299,00 / mês** |
| **Taxa de Intermediação Escrow**| **5%** adicionados no checkout | **0%** (Isento de taxas sobre o orçamento) |
| **Limite de Contratos Ativos** | **Máximo de 3 contratos ativos** | **Ilimitado** |
| **Gestão de Equipe (Co-working)** | Apenas 1 usuário admin | Multi-usuários e gerenciamento em lote |
| **Métricas & IA** | Briefing básico | **Matching inteligente de creators, relatórios detalhados de ROI e IA de performance** |
| **Faturamento Fiscais** | Faturamento individualizado | Exportação fiscal consolidada e NF unificada |

### 📈 ROI para Marcas e Agências
O plano Agency de **R$ 299,00/mês** torna-se o caminho óbvio para qualquer agência local ou marca recorrente:
*   Se o orçamento mensal de campanhas de uma marca for superior a **R$ 6.000,00**:
    *   No plano **Free**, os 5% de taxa operacional de Escrow totalizam **R$ 300,00**.
    *   No plano **Agency**, a taxa de Escrow é **R$ 0,00**, gastando apenas a assinatura mensal de **R$ 299,00**.
*   **Valuation SaaS:** O plano corporativo gera receita recorrente previsível (MRR), métrica essencial para atrair investimentos de Venture Capital (VC). A retenção de marcas e agências com dados analíticos pesados gera custos de mudança elevados, aumentando o LTV (Lifetime Value) da plataforma.

---

## 🛠️ 4. O Que Foi Implementado na Plataforma (Passo a Passo)

Nas últimas etapas, preparamos toda a espinha dorsal técnica para suportar este ecossistema de cobrança e regras:
1.  **Sincronização de Assinaturas (Webhooks da Stripe):** Ajustamos os controladores de pagamentos para atualizar o status e nível de assinatura (`subscriptionTier` de `FREE` para `PRO` ou `MASTER`) na conclusão de pagamentos Stripe e reverter ao Free em caso de cancelamento.
2.  **Limite de Contratos no Backend:** Adicionamos a validação de limite de contratos simultâneos no backend para marcas gratuitas (bloqueando a partir do 4º contrato ativo).
3.  **Lógica da Taxa do Escrow (Payment Intents & Checkouts):** O backend calcula dinamicamente se adiciona 5% de comissão de Escrow no checkout com base no plano ativo da marca.
4.  **Estorno Transparente com Desconto de Taxas (Stripe Refund API):** O processo de cancelamento e estorno busca o PaymentIntent na Stripe e reembolsa exatamente **96% do valor pago** pela marca, garantindo retenção da taxa transacional de 4% da operadora de cartão/Pix para proteger a plataforma de perdas.
5.  **Interface Gráfica Atualizada:** Criamos páginas comparativas de planos no dashboard e resumo de fatura no Checkout.

---

## 🚀 5. Análise do Especialista & Pontos de Melhora

Analisando a estrutura do projeto sob a ótica de produto (Product Growth) e engenharia de software (Architecture), propomos os seguintes **pontos de melhoria prioritários** para alavancar a plataforma e otimizar o valuation para investidores:

### 💡 1. Gatilhos de Conversão Dinâmica no Checkout (Upsell Psicológico)
*   **Ideia:** Toda vez que uma marca no plano Free iniciar um pagamento de Escrow no checkout, devemos mostrar um aviso dinâmico na tela informando a economia imediata caso fizesse o upgrade.
*   *Exemplo Visual:* *"Você está pagando R$ 150,00 de taxa de processamento de Escrow nesta campanha. Assine o plano Agency por R$ 299,00/mês e tenha taxas de Escrow 100% ZERADAS em todas as suas contratações!"*
*   **Impacto:** Converte o custo transacional (que a marca já considera uma perda inevitável) em valor de assinatura SaaS recorrente (aumento imediato de MRR).

### 💳 2. Stripe Customer Portal Autônomo (Self-Service SaaS)
*   **Ideia:** Atualmente, o cancelamento ou alteração de planos depende de automações e suporte manual. Integrar o **Stripe Customer Portal** direto na tela de configurações (`/dashboard/settings` e `/dashboard/subscription`) permitirá que o usuário gerencie cartões, baixe notas fiscais e altere planos com 1 clique de forma autônoma.
*   **Impacto:** Reduz custos de suporte e fricção de cancelamento/upgrade, métrica chave (Churn) para valuation de SaaS.

### 🧱 3. Pagamento de Escrow por Marcos (Milestone Payments)
*   **Ideia:** Marcas corporativas hesitam em depositar 100% do cachê de uma vez em Escrow para campanhas de longo prazo. Permitir dividir o Escrow do contrato em marcos (ex: 30% na entrega do roteiro da campanha, 70% na postagem final) reduz o risco percebido da marca e atrai campanhas de valores muito maiores.
*   **Impacto:** Aumenta o GMV (Gross Merchandise Value) transacionado pela plataforma, gerando mais taxas e credibilidade corporativa.

### 👁️ 4. Validação Inteligente de Postagens (AI Video Auditing)
*   **Ideia:** O maior gargalo operacional do Escrow é a liberação do dinheiro, que depende de validação manual. A IA Vincenzo pode usar visão computacional/APIs de plataformas para verificar automaticamente se o link postado pelo Creator contém os entregáveis (ex: logo da marca na tela por 3 segundos, hashtag correta na legenda, áudio correto).
*   **Impacto:** Reduz o tempo de retenção do dinheiro (`UNDER_REVIEW` ➔ `RELEASED`), gerando feedbacks positivos imediatos tanto para Creators (que recebem mais rápido) quanto para Marcas (que têm a postagem validada sem esforço manual).

---

## ❓ 6. Perguntas Estratégicas para o Fundador (Socratic Gate)

> [!IMPORTANT]
> Para avançarmos na simplificação das regras de código, responda às seguintes perguntas:
> 1.  **Taxa de Transação do Creator Premium:** Definimos que o Creator Premium pagará uma taxa reduzida de **5%** (igual ao antigo plano Master) ou **10%** (igual ao antigo plano Pro)? *(Manter 5% incentiva o upgrade rápido e simplifica o ROI).*
> 2.  **Validade dos R$ 100,00 e R$ 299,00:** Os preços propostos de R$ 100,00/mês para Criadores e R$ 299,00/mês para Marcas estão 100% aprovados para realizarmos a migração de todas as instâncias do código, interfaces e sementes do banco?
