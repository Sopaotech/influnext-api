# 🚀 Influnext — Roadmap de Evolução Técnica & Produto (2026)

Este documento registra a visão estratégica oficial, os pilares de produto e o plano de implementação em fases para elevar o **Influnext** ao posto de plataforma líder de marketing de influência na América Latina.

---

## 💎 Pilares do "Toque Especial" (As 3 Alavancas de Mercado)

### 1️⃣ Contratação Direta no Mídia Kit Público (Instant Escrow Checkout)
- **Objetivo**: Permitir que marcas contratem influenciadores diretamente pela URL pública ([/p/[handle]](file:///a:/influnext-api-main/influnext-api-main/web/src/app/p/%5Bhandle%5D/page.tsx)), reduzindo o atrito de venda a zero.
- **Funcionamento**:
  1. A marca navega no perfil público do criador e escolhe um pacote de Rate Card.
  2. Clica em *"Contratar Instantaneamente"*.
  3. Preenche apenas e-mail, título da campanha e briefing básico em um modal rápido.
  4. O sistema gera a sessão de Checkout em Escrow (Stripe/Pix).
  5. O contrato é criado automaticamente e o influenciador é notificado para aceitar.

### 2️⃣ Selo Criptográfico de Autenticidade (SHA-256 Verified Badge)
- **Objetivo**: Garantir 100% de confiança para as marcas e eliminar fraudes com prints falsos no Photoshop.
- **Funcionamento**:
  1. Cada snapshot de métricas coletado das redes sociais (Instagram/TikTok API) gera um hash `SHA-256` auditado.
  2. O perfil público exibe o selo **"Métricas Auditadas via API Oficial (SHA-256 Verified)"**.
  3. A marca pode clicar no selo para visualizar o histórico de auditoria imutável.

### 3️⃣ Relatório Automático de ROI da Campanha por Inteligência Artificial
- **Objetivo**: Demonstrar o Retorno Sobre Investimento (ROI) e Custo Por Mil (CPM) real para as marcas após a conclusão do trabalho.
- **Funcionamento**:
  1. O influenciador envia o link do post entregue.
  2. O worker de background analisa o desempenho frente ao nicho e gera um relatório em PDF/Web assinado pela IA de Inteligência de Marketing.
  3. A marca recebe o relatório e tem 1-clique para recontratar o influenciador.

---

## 🛠️ Refinamentos de Engenharia & Infraestrutura

1. **Stripe Server-to-Server Webhook Handler (`/v1/webhooks/stripe`)**:
   - Processamento de notificações assíncronas do gateway de pagamento para ativação passiva de contratos de Escrow.
2. **Índices de Alta Performance no PostgreSQL (Prisma ORM)**:
   - Indexação composta por `(niche, scoreClass, influScore)` garantindo busca de marketplace sub-30ms para até 100.000 criadores.

---

## 📅 Cronograma de Execução por Fases

| Fase | Funcionalidades | Escopo de Arquitetura |
| :--- | :--- | :--- |
| **Fase 1 (Atual)** | Instant Escrow Checkout no Mídia Kit + Selo SHA-256 | `public.controller.ts`, `InstagramOnboardingModal`, `/p/[handle]` |
| **Fase 2** | Stripe Webhook Handler Server-to-Server | `payment.controller.ts`, `webhook.routes.ts` |
| **Fase 3** | Relatório de ROI da Campanha por IA | `marketing-intelligence.service.ts`, `contract.controller.ts` |
