# Influnext API

API desenvolvida para a plataforma Influnext, focada em gestão inteligente de influenciadores e métricas de desempenho.

## 🚀 Tecnologias
- **Node.js** & **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **Zod** (Validação de dados)
- **Express**

## 🏗️ Arquitetura
O projeto segue uma estrutura de camadas para garantir escalabilidade e manutenção simples:
- `src/controllers`: Lógica de entrada (Requests/Responses).
- `src/services`: Regras de negócio.
- `src/routes`: Definição de endpoints.
- `src/schemas`: Validações com Zod.

## 📦 Como rodar
1. Clone o repositório.
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env` (baseado no `.env.example`).
4. Rode o banco: `npx prisma generate`
5. Inicie o servidor: `npm run dev`