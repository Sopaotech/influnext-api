# Runbook de Runtime Local

Este é o guia operacional para executar a API InfluNext localmente depois da
separação de runtime. Ele descreve somente recursos locais; não use credenciais,
URLs ou serviços de produção neste fluxo.

## Topologia

`docker-compose.yml` inicia cinco serviços sob o projeto local `influnext-local`:

| Serviço | Responsabilidade | Porta publicada |
| --- | --- | --- |
| `api` | Recebe requisições HTTP e responde health/readiness. Não inicia workers nem schedules. | `127.0.0.1:4000` |
| `worker` | Processa filas BullMQ: notificações, cleanup, renovação de tokens e análise de posts. | Nenhuma |
| `scheduler` | Registra os jobs recorrentes de cleanup e renovação de tokens. Não processa jobs. | Nenhuma |
| `postgres` | Banco PostgreSQL local do Compose. | Nenhuma |
| `redis` | Redis local para BullMQ e schedules. | Nenhuma |

O scheduler deve ter exatamente uma réplica. Executar mais de um scheduler pode
duplicar a responsabilidade de registrar jobs recorrentes.

## Pré-requisitos e limites

- Docker Engine com Docker Compose Plugin.
- Node.js compatível com o projeto para comandos fora do container.
- Arquivo `.env` local, ignorado pelo Git, somente com valores locais quando
  necessário. Não copie valores de produção.
- O Compose usa sua própria rede e volume local. Ele não usa os containers
  manuais de teste publicados em `127.0.0.1:5433` e `127.0.0.1:6380`.
- `prisma/dev.db` é legado, ainda rastreado pelo Git e não participa do Compose.

## Subir e observar o ambiente

Na raiz do repositório:

```powershell
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f scheduler
```

O Compose nunca executa migrations durante build ou startup. A mesma imagem é
usada pelos três processos, com comandos diferentes:

```text
api       -> npm start
worker    -> npm run start:worker
scheduler -> npm run start:scheduler
```

Para parar o ambiente sem remover dados locais:

```powershell
docker compose down
```

Para remover também o volume PostgreSQL criado por este Compose:

```powershell
docker compose down -v
```

`down -v` apaga os dados do PostgreSQL **local deste projeto Compose**. Não use
esse comando contra ambientes compartilhados ou produção.

## Health e readiness

Depois de `docker compose up -d`, use PowerShell:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4000/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4000/ready
```

- `GET /health` é liveness: confirma que o processo HTTP está vivo. Não consulta
  PostgreSQL nem Redis.
- `GET /api/health` é um alias de liveness para compatibilidade.
- `GET /ready` é readiness: valida a configuração crítica, um `SELECT 1` no
  PostgreSQL e um `PING` no Redis. Falhas retornam `503` com status sanitizado,
  nunca URLs, tokens, chaves, senhas ou stack traces.
- `GET /v1/health` permanece por compatibilidade. Use `/health` para liveness e
  `/ready` para readiness em novas integrações.

Uma resposta positiva de `/health` não prova que banco ou Redis estejam prontos.

## Política de migrations

- O histórico canônico está em `prisma/migrations`.
- `prisma migrate deploy` é uma ação manual, controlada e executada antes do
  runtime quando houver migration aprovada.
- API, worker e scheduler nunca aplicam migrations no startup.
- Não use `prisma db push` em banco compartilhado, staging ou produção.
- Nunca use `prisma/dev.db` como fonte de dados autoritativa ou como banco do
  Compose.

Para uma migration local aprovada, execute o comando Prisma explicitamente com
variáveis locais já revisadas. Não o adicione a comandos de startup:

```powershell
docker compose run --rm api node node_modules/prisma/build/index.js migrate deploy
```

## Testes locais seguros

Os testes de integração possuem runners versionados que bloqueiam URLs não
locais. Eles exigem PostgreSQL de teste em `127.0.0.1:5433` com nome de banco
contendo `test`, e Redis de teste em `127.0.0.1:6380` quando aplicável.
As URLs de teste são fornecidas somente pelo `.env` local através de
`TEST_DATABASE_URL`, `TEST_DIRECT_URL` e, quando houver Redis,
`REDIS_TEST_URL`.

```powershell
# Unitários no Windows: padrão que exclui integrações de forma confiável.
node node_modules/jest/bin/jest.js --runInBand --silent --testPathIgnorePatterns='tests[\\/]integration'

# Runners de integração; não apontar variáveis de teste para serviços externos.
npm run test:integration
npm run test:integration:http
npm run test:integration:redis
npm run test:integration:workers
npm run test:integration:scheduler
```

Se `npm` não estiver disponível no PATH do Windows, os equivalentes diretos são:

```powershell
node scripts/run-postgres-integration-tests.js
node scripts/run-postgres-http-integration-tests.js
node scripts/run-redis-bullmq-integration-tests.js
node scripts/run-application-worker-integration-tests.js
node scripts/run-scheduler-integration-tests.js
```

O comando genérico `npm test`/`npm run test:unit` ainda pode tratar caminhos com
barra invertida incorretamente no Windows e tentar executar suítes de integração
sem seus harnesses. Use o comando unitário acima e os runners específicos até
que esse problema cross-platform seja resolvido.

Validações locais de Prisma e TypeScript:

```powershell
node node_modules/prisma/build/index.js validate
node node_modules/prisma/build/index.js generate
node node_modules/typescript/bin/tsc --noEmit
```

## Aviso de deploy

Este runbook não autoriza deploy. A branch de segurança ainda não está em
produção; a produção conhecida permanece em um `main` anterior. Antes de qualquer
rollout será necessário, no mínimo:

1. identificar e validar banco, backups e Redis de produção;
2. configurar variáveis revisadas sem registrar valores no Git;
3. provisionar API, worker e scheduler como serviços separados;
4. manter uma única réplica de scheduler;
5. executar rehearsal em staging e smoke tests;
6. definir CI e ordem controlada de migrations/deploy.

Railway, Render, Vercel e manifests de deploy não foram alterados por este
runbook.

## Documentação histórica que exige revisão futura

- `docs/DEVELOPER_ONBOARDING_GUIDE.md` ainda recomenda `prisma db push` e
  descreve o runtime como combinado.
- `README.md` ainda apresenta um fluxo local antigo baseado em seed e `npm run
  dev`.
- `render.yaml`, `railway.toml` e `vercel.json` não refletem a topologia local
  API/worker/scheduler nem um rollout de produção aprovado.
- CI, staging rehearsal, revisão de `dev.db` no histórico Git, configuração de
  Redis de produção e campos financeiros `Float` seguem pendentes.
