# InfluNext — Plataforma de Gestão de Influenciadores & IA

API e Web PWA desenvolvidas para a plataforma **InfluNext**, focada em gestão inteligente de criadores de conteúdo, métricas de desempenho e marketplace de campanhas com escrow integrado.

---

## 🚀 Stack Tecnológica

### Backend API
- **Node.js** & **TypeScript** — Runtime e linguagem principal
- **Express** — Framework de rotas e middlewares
- **Prisma ORM** + **PostgreSQL** — Banco de dados relacional
- **Zod** — Validação de schemas e payloads
- **BullMQ** + **Redis** — Filas de processamento assíncrono
- **Stripe API** — Pagamentos e custódia de escrow (Stripe Connect)
- **Google Gemini** + **OpenAI/OpenRouter** — Modelos de IA (Vincenzo/Valentina e Vektor)

### Frontend (Web PWA)
- **Next.js 16** (App Router) + **React 19** — Framework web
- **Tailwind CSS v4** + **shadcn/ui** — Sistema de design
- **@ducanh2912/next-pwa** — Progressive Web App (instalável no mobile sem loja de apps)

---

## 🏗️ Arquitetura

O projeto segue uma estrutura de camadas para garantir escalabilidade e manutenção simples:
- `src/controllers`: Lógica de entrada (Requests/Responses) com validação Zod.
- `src/services`: Regras de negócio, integrações de IA e chamadas a APIs externas.
- `src/routes`: Definição e agrupamento de endpoints Express.
- `web/src/app`: Páginas e rotas do Next.js (App Router).
- `web/src/components`: Componentes React reutilizáveis.

---

## 📱 Estratégia Mobile

> [!IMPORTANT]
> A partir de **julho de 2026**, a plataforma adotou o modelo **PWA-First** como estratégia única de entrega mobile.
> O desenvolvimento Flutter WebView foi suspenso temporariamente e o código nativo está preservado em `mobile-standby/` para referência futura.

O PWA do Next.js permite:
- Instalação direta pelo Safari/Chrome sem passar por lojas de aplicativos
- Cache offline dos recursos estáticos
- Experiência de app nativo sem build duplo

---

## 🔑 Integração Instagram (Creator API)

A plataforma usa o **Instagram API with Instagram Login** (Professional Account) para leitura somente de métricas de perfil e posts dos criadores. **Não é necessário vincular Páginas do Facebook.**

> **Pré-requisito:** O criador precisa ter a conta convertida para tipo **Criador de Conteúdo (Creator)** ou **Comercial** no app do Instagram. O onboarding da plataforma inclui um tutorial em 3 passos para essa conversão.

---

## 💳 Modelo de Monetização

| Plano | Mensalidade | Taxa de Escrow |
| :--- | :--- | :--- |
| Criador (Creator) | **R$ 59,90/mês** | — |
| Empresa (Company) | **R$ 120,00/mês** | **7%** sobre contratos liquidados |

---

## 🤖 Inteligência Artificial

Documentação completa das personas (Vincenzo, Valentina e Vektor), regras de negócio de IA (proteção de Escrow, anti-repetição e contas Dark) e infraestrutura de banco:
- [Guia de Arquitetura e Engenharia de IA](file:///a:/influnext-api-main/influnext-api-main/docs/AI_SYSTEMS_GUIDE.md)

---

## 📦 Como Rodar

### 1. API Backend
```bash
npm install
cp .env.production.example .env
# Configure DATABASE_URL, GEMINI_API_KEY, OPENAI_API_KEY, STRIPE_SECRET_KEY etc.
npx prisma generate
npm run seed
npm run dev
```

### 2. Frontend Web (PWA)
```bash
cd web
npm install
# Crie .env.local com: NEXT_PUBLIC_API_URL=http://localhost:4000/v1
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.