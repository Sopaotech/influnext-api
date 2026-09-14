# Desenho de alinhamento dos manifests de deploy

Este documento define o desenho futuro dos manifests de deploy para a separação
de runtime da InfluNext. Ele não autoriza deploy, provisionamento, migration ou
alteração de qualquer ambiente externo.

## Decisões preservadas

- A produção não deve receber esta branch antes do Launch Gate.
- O CI remoto aprovado valida backend e runtime, mas não substitui staging nem
  um ensaio de rollout.
- API, worker e scheduler são processos independentes; o scheduler deve ter
  exatamente uma instância.
- Migrations são uma ação controlada antes do runtime. Elas não podem rodar no
  startup da API, do worker ou do scheduler. `prisma db push` é proibido em
  ambientes compartilhados.
- `prisma/dev.db` continua rastreado como dívida técnica e não pode entrar em
  imagens, staging ou produção.
- `prisma/setup-provider.js` é legado e não deve voltar aos comandos de build
  ou runtime.
- A identidade, o backup e a capacidade de restore do banco e Redis de
  produção permanecem desconhecidos.

## Estado atual dos manifests

| Artefato | Estado atual | Divergência ou risco |
| --- | --- | --- |
| `Dockerfile` | Imagem Node 22 única; gera Prisma no build; inicia `npm start` por padrão. | Compatível com imagem única, mas não seleciona serviço de deploy nem executa migration controlada. |
| `docker-compose.yml` | Local: API, worker, scheduler, PostgreSQL 17 e Redis 8 separados. | Referência correta apenas para desenvolvimento local; não é manifesto de produção. |
| `.dockerignore` | Exclui `.env`, bancos SQLite e `prisma/dev.db`. | Alinhado; deve continuar protegendo o contexto de build. |
| `railway.toml` | Um único serviço Nixpacks com `npm start` e `/health`. | Não declara worker, scheduler singleton, migration job ou readiness. |
| `render.yaml` | Um web service com PostgreSQL e `npm start`. | Não declara Redis, worker, scheduler, migration controlada nem variáveis necessárias ao runtime atual. |
| `vercel.json` na raiz | Declara Next.js e `.next` no repositório da API. | Legado/contraditório: backend Express não produz `.next`. |
| `web/vercel.json` | Configura somente Next.js em `web`. | Candidato a frontend; não pode hospedar worker ou scheduler. |
| Scripts do root | Possui `start`, `start:worker` e `start:scheduler`. | A topologia está pronta no código, mas não está representada pelos manifests externos. |

O `Dockerfile` não executa migration no build ou startup. O Compose local mantém
PostgreSQL e Redis sem portas publicadas e usa `/health` para liveness da API.
`/ready` já existe para validar configuração, PostgreSQL e Redis.

## Topologia alvo

### API service

- Comando: `npm start`.
- Responsabilidade: somente HTTP.
- Sondas: `GET /health` para liveness e `GET /ready` para readiness.
- Escala: horizontal somente após validar sessões, Redis e limites operacionais.
- Variáveis mínimas: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` e
  `ALLOWED_ORIGINS` ou `FRONTEND_URL`.
- Variáveis condicionais: domínio de cookie, chaves de criptografia e
  `SOCIAL_TOKEN_*` quando as rotas sociais estiverem habilitadas; credenciais de
  providers somente para features autorizadas.

### Worker service

- Comando: `npm run start:worker`.
- Responsabilidade: consumir BullMQ; hoje inclui notification, cleanup, token
  renewal e post analyzer.
- Rede: sem porta HTTP ou domínio público.
- Dependências: `DATABASE_URL` e `REDIS_URL`; `NODE_ENV`; chaves sociais e
  variáveis de provider somente quando os consumers correspondentes estiverem
  habilitados.
- Escala: separada da API, condicionada à idempotência e ao tipo de job. Não
  registra schedules.

### Scheduler service

- Comando: `npm run start:scheduler`.
- Responsabilidade: registrar `daily-cleanup` e `daily-token-renewal` no Redis.
- Rede: sem porta HTTP ou domínio público.
- Dependências atuais: `REDIS_URL` e `NODE_ENV`; não requer PostgreSQL enquanto
  não consultar dados diretamente.
- Escala: exatamente uma réplica. O manifest e o processo operacional precisam
  impedir duplicação durante escala e rollout.
- Não processa jobs.

### Migration job

- Comando conceitual: `prisma migrate deploy` usando a imagem aprovada.
- Execução: manual/controlada, uma única vez por rollout que contenha migration.
- Dependências: `DATABASE_URL` e `DIRECT_URL` quando a política de migrator
  exigir conexão direta.
- Ordem: após backup e restore verificados; antes de API, worker e scheduler.
- Não reutiliza startup de runtime nem roda `db push`.

## Notas por plataforma

### Railway

O estado registrado no audit 2B indica que o projeto `captivating-determination`
em `production` executava somente `influnext-api`, com uma réplica, a partir de
um `main` anterior. Worker e scheduler separados estavam ausentes; Redis era
desconhecido ou mal configurado, e banco, backup e restore não foram validados.

No Launch Gate, representar a topologia como três serviços independentes do
mesmo SHA e da mesma imagem ou build aprovado:

1. API com `npm start`, domínio público e healthcheck `/health`; usar `/ready`
   como verificação operacional antes de tráfego.
2. Worker com `npm run start:worker`, sem domínio público e com PostgreSQL e
   Redis configurados.
3. Scheduler com `npm run start:scheduler`, sem domínio público e escala fixada
   em uma réplica.
4. Migration como operação pontual controlada, nunca como quarto serviço
   persistente por padrão.

Não habilitar autodeploy ou alterar escala antes de confirmar o banco
autoritativo, Redis funcional, backups/restore, variáveis por processo e
estratégia de rollback. A configuração de readiness deve ser reavaliada na
plataforma: `/health` é apropriado para a sonda de processo; `/ready` não deve
ser confundido com liveness.

### Render

`render.yaml` descreve apenas um web service e um PostgreSQL, usando
`npm run start`. O alias `/api/health` agora existe, mas o manifesto ainda não
declara Redis nem separa consumers e scheduler.

Uma futura adaptação precisa confirmar as capacidades e o modelo de cobrança
vigentes antes de escolher serviços web, background workers e/ou agendamento.
Ela deve criar API, worker e scheduler separados, limitar o scheduler a uma
instância e manter migrations como ação explícita. Não presumir que o manifest
atual represente o deploy ativo.

### Vercel

O Vercel da raiz é incompatível com a API Express: aponta para um build Next.js
e `.next`. O arquivo em `web/` é o único candidato para o frontend Next.js.

Vercel não deve executar o backend, consumers BullMQ ou scheduler. Um futuro
alinhamento do frontend deve decidir `NEXT_PUBLIC_API_URL`, origens CORS e
domínios de cookie depois de staging; o typecheck do frontend permanece fora do
gate atual por causa de erros conhecidos.

### Docker

Manter uma imagem única para API, worker e scheduler, escolhendo o comando por
serviço. A imagem não deve copiar `dev.db`, executar migrations automaticamente
ou receber segredos no build. O Compose local permanece como referência de
topologia e não como instrução de produção.

## Ordem futura de implementação

1. Identificar o ambiente de staging e confirmar banco/Redis exclusivamente de
   staging, sem usar dados ou credenciais de produção.
2. Criar manifests de staging para API, worker e scheduler, com os comandos e
   as variáveis desta topologia.
3. Definir o mecanismo controlado de migration e validá-lo em um restore de
   staging.
4. Validar uma única réplica de scheduler, filas e repeatable jobs.
5. Executar o checklist de staging, smoke tests e rollback rehearsal.
6. Somente no Launch Gate, repetir os gates de identidade, backup/restore,
   variáveis, rollback e aprovação para produção.

## Checklist para a implementação futura

- [ ] Confirmar se Railway, Render ou outro alvo será o único destino backend.
- [ ] Remover ou marcar como legado manifests que não forem destino aprovado.
- [ ] Configurar API, worker e scheduler do mesmo SHA aprovado.
- [ ] Proibir domínio público em worker e scheduler.
- [ ] Fixar scheduler em uma réplica e definir proteção contra duplicação no
      rollout.
- [ ] Configurar `/health` como liveness da API e validar `/ready` antes do
      tráfego.
- [ ] Declarar todas as variáveis por processo sem reutilizar segredos de
      produção em staging.
- [ ] Executar `prisma migrate deploy` somente em job/manual controlado, após
      backup e restore testados.
- [ ] Manter `db push` fora de ambientes compartilhados.
- [ ] Validar CI, staging rehearsal e plano de rollback antes de qualquer
      produção.

## O que não fazer

- Não fazer deploy desta branch diretamente em produção.
- Não tratar o CI aprovado como substituto de staging, backup ou restore.
- Não iniciar worker ou scheduler pela API para compatibilidade de deploy.
- Não usar Vercel para jobs persistentes.
- Não executar migrations no startup ou `db push` em staging/produção.
- Não importar `prisma/dev.db` nem incluir bancos SQLite em artefatos Docker.
- Não provisionar ou alterar serviços pagos antes do Launch Gate.
