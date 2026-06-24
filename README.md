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

## 🤖 Inteligência Artificial (IA)
A documentação completa contendo as personas (Vincenzo, Valentina e Vektor), as regras de negócio de IA (como a proteção de Escrow, anti-repetição e contas Dark) e a infraestrutura de banco de dados/rotas pode ser acessada em:
- [Guia de Arquitetura e Engenharia de IA](file:///d:/Influnext/docs/AI_SYSTEMS_GUIDE.md)

## 📦 Como rodar
1. Clone o repositório.
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env` (baseado no `.env.example`).
4. Rode o banco: `npx prisma generate`
5. Inicie o servidor: `npm run dev`