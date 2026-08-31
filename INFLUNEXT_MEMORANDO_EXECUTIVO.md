# INFLUNEXT™ — EXECUTIVE MEMORANDUM & INVESTOR PITCH DECK
**Relatório Executivo de Arquitetura, Modelo de Negócios, Segurança e Governança**
*Documento Estratégico para Sócios, Acionistas & Investidores*
*Versão 2.4 — 2026*

---

## 1. RESUMO EXECUTIVO (EXECUTIVE SUMMARY)

### 1.1 O que é a InfluNext?
A **InfluNext** é a infraestrutura definitiva de tecnologia e governança financeira para o mercado de **Marketing de Influência na América Latina**. A plataforma atua como uma ponte de alta confiança conectando marcas corporativas a criadores de conteúdo (influenciadores), combinando **auditoria criptográfica de métricas**, **inteligência artificial generativa de ponta a ponta** e **custódia financeira blindada (SafePay Escrow)**.

```
       ┌─────────────────┐            ┌─────────────────┐
       │     EMPRESAS    │            │  CRIADORES / IF │
       │  (Marcas / Ag.) │            │ (Micro ao Mega) │
       └────────┬────────┘            └────────┬────────┘
                │                              │
                ▼                              ▼
    ┌──────────────────────────────────────────────────────┐
    │                 INFLUNEXT ECOSYSTEM                  │
    │  ──────────────────────────────────────────────────  │
    │  ✦ SafePay Escrow (Custódia 15% Free / 7% Pro)       │
    │  ✦ Minutas Jurídicas com Assinatura Digital SHA-256  │
    │  ✦ Auditoria de Métricas (Instagram & TikTok API)    │
    │  ✦ Vector AI (Branding) & Vincenzo AI (ROI)          │
    │  ✦ Mídia Kit Público Auditado (/p/[handle])          │
    └──────────────────────────────────────────────────────┘
```

### 1.2 O Problema de Mercado (A Dor)
O marketing de influência no Brasil movimenta bilhões de reais anualmente, porém sofre de 4 gargalos estruturais graves:
1. **Insegurança Financeira & Calotes**: Marcas pagam adiantado e influenciadores não entregam; ou criadores produzem o conteúdo e não recebem o cachê acordado.
2. **Métricas Falsas & Bots**: Falta de comprovação independente sobre visualizações reais, retenção de público e engajamento qualificado.
3. **Ausência de Formalização Jurídica**: Mais de 80% das parcerias no Brasil são feitas via WhatsApp ou direct do Instagram, sem contratos válidos, sem cláusulas de exclusividade de segmento e sem compliance com o CONAR.
4. **Falta de Padronização de Briefings & Roteiros**: Entregáveis confusos que não geram conversão em vendas para a marca.

### 1.3 A Solução InfluNext
A InfluNext resolve integralmente essa fricção por meio de uma plataforma centralizada e automatizada:
- **SafePay Escrow**: O dinheiro da campanha fica retido em conta de custódia protegida. O influenciador só recebe após a empresa revisar e aprovar o material entregue. Se houver descumprimento, a mediação é acionada e o reembolso é garantido.
- **Minuta Jurídica com Validade Digital**: Geração automática de contrato com 7 cláusulas de blindagem legal (cessão de imagem, exclusividade, foro de São Paulo e carimbo criptográfico SHA-256).
- **Métricas Auditadas na Origem**: Integração direta via API Oficial (Instagram API with Instagram Login e TikTok API) com geração de hash de integridade imutável.
- **Ecossistema de IA Especializada**: **Vector AI** (orientação de branding e briefings corporativos) e **InfluIA** (roteirista magnético de 60 segundos para criadores).

---

## 2. ARQUITETURA TECNOLÓGICA & INFRAESTRUTURA

O software foi construído seguindo os mais rigorosos padrões da engenharia de software moderna, priorizando **escalabilidade**, **baixa latência**, **modularidade** e **segurança de dados**.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                    │
│   React 19 • Turbopack • Tailwind / Vanilla CSS • SSR & PWA │
│   Design System: White / Slate / Laranja InfluNext          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST / JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js API)                    │
│   Express • TypeScript • Zod Validation • Security Guards   │
│   Camada de Controladores, Serviços e Middlewares           │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
               ▼               ▼               ▼
     ┌──────────────────┐┌───────────┐┌──────────────────────┐
     │   BANCO DADOS    ││  BULLMQ   ││  APIs EXTERNAS & IA  │
     │   Prisma ORM     ││  + REDIS  ││  ✦ Mercado Pago / Pix│
     │ SQLite / Postgres││Notificações││  ✦ Instagram Graph   │
     │  Multi-tenant    ││   & Push  ││  ✦ Google Gemini 1.5 │
     └──────────────────┘└───────────┘└──────────────────────┘
```

### 2.1 Stack Tecnológica
- **Camada de Apresentação (Frontend)**:
  - Framework: **Next.js 16.2** com motor **Turbopack** e **React 19**.
  - Estilização: **Design System Proprietário InfluNext** (White / Slate / Laranja InfluNext com iluminação ambiental suave *Ambient Light Glow*).
  - Recursos: Renderização Híbrida (SSR para Mídia Kits públicos com SEO / Static para Painéis corporativos), Progressive Web App (PWA) e compatibilidade total Desktop/Mobile.
- **Camada de Aplicação (Backend)**:
  - Linguagem & Runtime: **Node.js** com **TypeScript**.
  - Framework: **Express.js** estruturado em arquitetura limpa em camadas (Controllers, Services, Middlewares e Queue Workers).
  - Validação de Esquemas: **Zod** em 100% das requisições de entrada, blindando contra payloads maliciosos.
- **Camada de Persistência & Dados**:
  - ORM: **Prisma ORM** com tipagem estrita de modelos e migrações declarativas.
  - Banco de Dados: Arquitetura compatível com **PostgreSQL** e **SQLite** para deploy em alta disponibilidade.
- **Processamento Assíncrono & Filas**:
  - **BullMQ + Redis**: Fila assíncrona desacoplada para envio de notificações, auditoria de métricas e e-mails transacionais.

---

## 3. SEGURANÇA, COMPLIANCE & BLINDAGEM JURÍDICA

A InfluNext foi projetada com camadas concêntricas de proteção para garantir a integridade das transações corporativas e conformidade legal:

### 3.1 Blindagem Criptográfica & Integridade
- **Hash de Auditoria SHA-256**: Cada snapshot de métricas coletado das redes sociais e cada minuta jurídica aceita recebe um hash criptográfico único, impossibilitando qualquer adulteração de números ou termos.
- **Proteção Anti-IDOR & Role-Based Access Control (RBAC)**: Autorização estrita baseada em papéis (`ADMIN`, `COMPANY`, `INFLUENCER`), impedindo que um usuário acesse contratos ou dados de terceiros.
- **Anti-Disintermediação (Sanitizer Middleware)**: Filtros automáticos que identificam e higienizam tentativas de troca indevida de dados de contato antes do depósito de custódia no SafePay.
- **Rate Limiting & Hardening**: Middlewares dedicados (`authRateLimiter`, `publicRateLimiter`, `helmet`) contra ataques de força bruta, DDoS e injeções de código.
- **Autenticação Segura & 2FA**: JSON Web Tokens (JWT) com expiração controlada e suporte nativo a autenticação em dois fatores (TOTP RFC 6238).

### 3.2 Conformidade Legal Brasileira
- **Código de Defesa do Consumidor & Código Civil**: Termos de custódia financeira em conformidade com as regras de prestação de serviços e mediação de garantias.
- **Diretrizes do CONAR**: Sistema exige e padroniza a obrigatoriedade da hashtag `#publi` e identificação transparente de conteúdos comerciais.
- **Marco Civil da Internet (Lei nº 12.965/14) & Medida Provisória nº 2.200-2/2001**: Validade plena da assinatura eletrônica via consent log com carimbo de data, IP e hash de consentimento.

---

## 4. MODELO DE NEGÓCIOS & UNIT ECONOMICS

O modelo de receita da InfluNext é sustentado por **dois motores complementares de faturamento** (Híbrido Take Rate + SaaS):

```
                     ┌────────────────────────────────┐
                     │    FATURAMENTO DA INFLUNEXT    │
                     └───────┬────────────────┬───────┘
                             │                │
             ┌───────────────▼──┐          ┌──▼────────────────┐
             │    MOTOR 1       │          │    MOTOR 2        │
             │ TAKE RATE (GMV)  │          │  SAAS RECORRENTE  │
             │ (Taxas SafePay)  │          │   (Planos MRR)    │
             └──────────────────┘          └───────────────────┘
```

### 4.1 Tabela de Comissionamento e Planos:

| Perfil do Usuário | Plano Gratuito (Free Tier) | Assinante Oficial (Plano Mensal) | Benefícios da Assinatura |
| :--- | :---: | :---: | :--- |
| **🎬 Criadores (Influenciadores)** | **15% de taxa** sobre o contrato | **7% de taxa reduzida** (R$ 59,90/mês) | Mídia Kit Auditado SHA-256, Roteirista 60s ilimitado, prioridade no Radar de Talentos e Rate Cards oficiais. |
| **🏢 Empresas (Marcas / Agências)** | **15% de taxa SafePay** (máx. 3 contratos ativos) | **7% de taxa reduzida** (R$ 120,00/mês) | Contratos ilimitados, Vector AI Studio completo, simulador avançado de ROI e suporte prioritário em 24h. |

### 4.2 Alavancagem & Incentivo de Upgrade
- **Gatilho de Economia Real para Marcas**: Uma empresa com verba de R$ 10.000 em publis economiza **R$ 800** em taxas ao assinar o plano corporativo de R$ 120/mês. Isso gera uma taxa de conversão orgânica massiva para os planos recorrentes.
- **SLA & Penalidades por Atraso (Late Delivery)**: Influenciadores que atrasam entregas sem justificativa sofrem dedução automática de **5% ao dia** (até o teto de 50%), valor que é revertido como crédito para a empresa contratante.

---

## 5. MOTORES DE INTELIGÊNCIA ARTIFICIAL (AI SUITE)

A InfluNext não utiliza IA como mero adorno visual; o sistema integra modelos neurais avançados (**Google Gemini Flash 1.5/2.0**) diretamente nos gargalos de decisão de negócios:

1. **🏢 Vector AI (Diretor de Marketing, Branding & Growth)**:
   - Auxilia marcas a definirem seu tom de voz, persona de clientes e mix ideal de criadores (micro, meso e macro).
   - Gera briefings executivos de alta conversão estruturados em 3 blocos: *Ganchos de 3s*, *Diretrizes da Marca (Do's & Don'ts)* e *Chamadas para Ação (CTAs)*.
2. **📈 Vincenzo AI (Business & ROI Advisor)**:
   - Analisa o histórico de contratações corporativas e prevê o retorno sobre o investimento (ROI preditivo), calculando custo por mil visualizações (CPM) e estimativa de impressões.
3. **🎬 InfluIA (Co-Pilot de Conteúdo & Carreira do Creator)**:
   - Estrutura roteiros dinâmicos de 60 segundos com ganchos magnéticos para Reels e TikTok, orientando o criador a precificar seus serviços com base em dados reais de audiência.

---

## 6. AS 3 EXPERIÊNCIAS DO PRODUTO (USER JOURNEY)

### 6.1 Experiência do Criador (`/dashboard/influencer`)
- **Painel de Carreira**: Visualização de saldo em custódia SafePay, esteira de entregas e botão de saque instantâneo via Pix.
- **Mídia Kit Auditado (`/p/[handle]`)**: Página pública de alta conversão com selo criptográfico SHA-256, gráficos de retenção e Rate Cards oficiais.
- **Central de Roteiros**: Gerador de ideias e ganchos adaptados ao nicho do influenciador.

### 6.2 Experiência da Empresa (`/dashboard/company`)
- **Radar de Criadores de Alta Performance**: Busca filtrada por nicho, influScore e taxa de engajamento comprovada.
- **Wizard de Contratação Formal (`/dashboard/company/new-contract`)**: Emissão de propostas em 3 etapas com seleção SPOT vs RETAINER, cálculo transparente de custódia SafePay e minuta jurídica pronta para assinatura.
- **Vector AI Studio (`/dashboard/workspace`)**: Ferramentas corporativas de simulação financeira e criação de briefings estratégicos.

### 6.3 Painel de Controle do Fundador & Admin (`/dashboard/admin`)
- **Cockpit Financeiro**: Exibição separada do **Lucro da Empresa (Taxas SafePay vs Mensalidades MRR)** e **Montante Total Negociado (GMV)**.
- **Base de Usuários**: Contagem em tempo real de criadores auditados e marcas parceiras.
- **Fila Operacional de Chamados**: Central de suporte e resolução de disputas com ações em 1 clique (`Em Andamento` / `Resolvido`).
- **Gestão de Parceiros VIP**: Liberação instantânea de acesso Pro para parceiros estratégicos.

---

## 7. SISTEMA DE REPUTAÇÃO: INFLUSCORE REAL

Diferente de plataformas convencionais onde os números são estáticos ou artificiais, o **InfluScore** da InfluNext é um algoritmo dinâmico de 0 a 1000 pontos:
- **Evolução por Desempenho Real**: O score só aumenta após a conclusão bem-sucedida de contratos, entrega pontual e **avaliação 5 estrelas atribuída pela marca**.
- **Penalização Rigorosa**: Atrasos injustificados e disputas procedentes reduzem o score automaticamente, garantindo que o topo do Radar de Talentos seja ocupado exclusivamente pelos criadores mais profissionais do mercado.

---

## 8. CONCLUSÃO & PRÓXIMOS PASSOS (ROADMAP)

A InfluNext encerra seu ciclo de consolidação técnica com **100% de seus módulos funcionais, testados e implantados**:
- ✅ Backend Express + Prisma com compilação sem erros (`tsc --noEmit` 0 erros).
- ✅ Frontend Next.js 16 compilando todas as 32 rotas com 100% de sucesso.
- ✅ Repositório Git sincronizado na branch `main` e pronto para escala.

A InfluNext está posicionada para liderar a profissionalização e intermediação do marketing de influência no Brasil e no mercado internacional.

---
*InfluNext™ — SafePay Escrow & Influencer Intelligence Platform*  
*Confidencial • Todos os direitos reservados • 2026*
