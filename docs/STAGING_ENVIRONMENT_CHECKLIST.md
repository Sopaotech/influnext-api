# Checklist de Ambiente de Staging

Esta checklist prepara um ensaio controlado da arquitetura InfluNext com API,
worker e scheduler separados. Ela é um plano de verificação: não provisiona
serviços, não faz deploy e não autoriza acesso a produção.

Use [LOCAL_RUNTIME_RUNBOOK.md](LOCAL_RUNTIME_RUNBOOK.md) para a topologia
local. Só inicie um ensaio de staging quando cada item aplicável abaixo tiver
uma evidência registrada sem incluir segredos ou dados pessoais.

## Objetivo

Staging existe para ensaiar um rollout da arquitetura separada antes de
produção: validar dependências, migrations controladas, filas, schedules,
readiness e rollback. É um ambiente descartável, isolado e com dados sintéticos.

## Não objetivos

- Não é produção e não deve receber tráfego real.
- Não use dados pessoais, tokens sociais, contratos ou credenciais reais.
- Não provisione serviços pagos, nem altere provedores, sem decisão explícita
  de Launch Gate.
- Não aplique migrations em produção como parte deste ensaio.
- Não habilite pagamentos, redes sociais, IA, e-mail, push ou outro provider
  real sem autorização específica.

## Topologia obrigatória

Antes do ensaio, confirme a existência de recursos isolados para:

| Componente | Responsabilidade | Critério |
| --- | --- | --- |
| API | HTTP, `/health` e `/ready`; não processa filas nem registra schedules. | Uma ou mais réplicas conforme o ensaio. |
| Worker | Processa filas BullMQ. | Sem porta HTTP pública. |
| Scheduler | Registra os jobs recorrentes. | Exatamente uma réplica. |
| PostgreSQL | Persistência exclusiva de staging. | Não é produção e possui backup verificável. |
| Redis | BullMQ e repeatable jobs exclusivos de staging. | Não é Redis de produção. |
| Migration job | Aplica somente migrations versionadas e aprovadas. | Executado como ação separada. |

Não reutilize banco, Redis, namespaces de fila, volumes ou variáveis de
produção. Não copie `prisma/dev.db` para staging.

## Comandos de runtime esperados

| Processo | Comando | Não deve fazer |
| --- | --- | --- |
| API | `npm start` | Iniciar worker, scheduler ou migration. |
| Worker | `npm run start:worker` | Abrir HTTP ou registrar schedules. |
| Scheduler | `npm run start:scheduler` | Abrir HTTP ou processar jobs. |
| Migration job | `prisma migrate deploy` | Ser iniciado como parte de API, worker ou scheduler. |

O comando de migration deve ser invocado por um job/processo controlado, com
logs sanitizados e uma aprovação explícita. Não inclua migrations em startup,
hooks de deploy implícitos ou healthchecks.

## Matriz de ambiente

Registre somente presença, dono e rotação de cada variável; nunca inclua valor
ou URL completa em tickets, logs ou esta checklist.

### API

| Variável | Obrigatoriedade para ensaio |
| --- | --- |
| `DATABASE_URL` | Obrigatória |
| `REDIS_URL` | Obrigatória |
| `JWT_SECRET` | Obrigatória |
| `ALLOWED_ORIGINS` ou `FRONTEND_URL` | Pelo menos uma obrigatória |
| `SESSION_COOKIE_DOMAIN` / `NEXT_PUBLIC_COOKIE_DOMAIN` | Quando cookies cross-domain forem exercitados |
| `ENCRYPTION_KEY` | Quando recursos que dependem de 2FA forem habilitados |
| `SOCIAL_TOKEN_ACTIVE_KEY_ID` | Quando rotas sociais escreverem tokens |
| `SOCIAL_TOKEN_KEY_<ID>` | Quando rotas sociais escreverem ou lerem tokens criptografados |

### Worker

| Variável | Obrigatoriedade para ensaio |
| --- | --- |
| `DATABASE_URL` | Obrigatória |
| `REDIS_URL` | Obrigatória |
| `NODE_ENV` | Obrigatória e definida para staging |
| `SOCIAL_TOKEN_*` | Quando token renewal estiver habilitado |
| Variáveis de provider | Somente para cada worker explicitamente autorizado |

Providers não autorizados devem ficar desabilitados, simulados ou apontar para
ambientes sandbox aprovados.

### Scheduler

| Variável | Obrigatoriedade para ensaio |
| --- | --- |
| `REDIS_URL` | Obrigatória |
| `NODE_ENV` | Obrigatória e definida para staging |
| `DATABASE_URL` | Não exigida pela implementação atual; reavaliar se o scheduler passar a consultar dados |

### Migration job

| Variável | Obrigatoriedade para ensaio |
| --- | --- |
| `DATABASE_URL` ou `DIRECT_URL` | Conforme a política Prisma aprovada |
| `DIRECT_URL` | Quando a conexão direta do migrator for necessária |

O migration job usa uma identidade de migrator controlada quando aplicável. A
identidade de runtime da aplicação não deve ser usada como migrator por padrão.

## Checklist de banco de dados

- [ ] O banco foi identificado como staging, com owner e ambiente confirmados.
- [ ] A conexão usada pelo runtime aponta apenas para staging.
- [ ] A estratégia de backup foi verificada antes da primeira migration.
- [ ] Um restore foi testado ou há evidência operacional equivalente aprovada.
- [ ] O backup, retenção e timestamp da última execução foram registrados sem
      connection strings.
- [ ] Somente migrations versionadas em `prisma/migrations` serão aplicadas.
- [ ] O job `prisma migrate deploy` foi planejado como etapa explícita, antes
      dos processos de runtime.
- [ ] `_prisma_migrations` será conferida após a aplicação das migrations.
- [ ] `prisma db push` não será usado.
- [ ] Não haverá importação de `prisma/dev.db`.
- [ ] Não haverá cópia de dados reais sem política de dados, minimização e
      autorização separadas.

## Checklist de Redis e BullMQ

- [ ] Redis foi identificado como recurso exclusivo de staging.
- [ ] Um `PING` controlado responde com sucesso.
- [ ] Worker e scheduler usam o Redis de staging, nunca o de produção.
- [ ] Uma fila BullMQ pode ser criada, processada e limpa com dados sintéticos.
- [ ] Prefixos e repeatable jobs de testes são removidos ao término do ensaio.
- [ ] Nenhum payload de job, token ou dado pessoal é registrado em logs.
- [ ] O comportamento quando Redis fica indisponível foi verificado: `/ready`
      deve retornar `503` para a API.

## Checklist de singleton do scheduler

- [ ] O serviço scheduler tem exatamente uma réplica.
- [ ] API e worker não registram schedules.
- [ ] O scheduler registra `daily-cleanup` uma vez.
- [ ] O scheduler registra `daily-token-renewal` uma vez.
- [ ] Reexecutar o scheduler não cria repetição inesperada dos jobs.
- [ ] A timezone dos crons foi decidida e documentada antes de usar schedules
      com efeito de negócio. A implementação atual não define essa decisão.

## Checklist de health e readiness

- [ ] `GET /health` retorna `200` enquanto o processo HTTP estiver vivo.
- [ ] `GET /api/health` retorna `200` como alias de liveness.
- [ ] `GET /ready` retorna `200` somente quando configuração, PostgreSQL e
      Redis estiverem saudáveis.
- [ ] `GET /ready` retorna `503` quando uma dessas dependências falhar.
- [ ] Os payloads não expõem URLs, senhas, chaves, tokens, dados pessoais ou
      stack traces.
- [ ] Monitoramento futuro usa `/health` para liveness e `/ready` para
      readiness; `/health` não substitui readiness.

## Smoke tests do ensaio

Execute somente com contas e dados sintéticos, e com providers externos
desabilitados ou mockados:

- [ ] Signup e login funcionam para papéis permitidos.
- [ ] Sessão é entregue por cookie `HttpOnly`, sem token no JSON.
- [ ] `GET /v1/auth/me` exige sessão e responde para usuário autenticado.
- [ ] Ownership de Task bloqueia usuário não dono sem vazar dados.
- [ ] Ownership de Contract respeita participante e papel.
- [ ] Autorização de pagamento bloqueia antes de qualquer provider externo.
- [ ] Worker de notification e cleanup processa jobs sintéticos e limpa filas.
- [ ] Token renewal usa somente mock ou sandbox explicitamente autorizado; logs
      não expõem tokens.
- [ ] Post analyzer usa somente caminho de staging seguro; não chama IA real
      sem autorização.
- [ ] Scheduler registra jobs e não os processa diretamente.
- [ ] Não ocorreu chamada para pagamentos, redes sociais, IA, e-mail ou push
      real sem autorização explícita.

## Checklist de rollback e abortamento

- [ ] O SHA anterior à tentativa foi anotado.
- [ ] Critérios de abortamento foram definidos: readiness falha, schedules
      duplicados, job inesperado, provider chamado sem autorização ou falha de
      migration.
- [ ] Rollback de aplicação foi planejado separadamente do rollback de banco.
- [ ] Nenhuma migration aplicada será removida ou revertida sem um plano
      revisado de migration/restore.
- [ ] Worker e scheduler podem retornar ao SHA anterior de forma independente
      da API.
- [ ] Flags/configurações que habilitam recursos podem ser desativadas de forma
      controlada quando existirem.
- [ ] O procedimento de restore e seus responsáveis estão definidos antes de
      uma migration irreversível.

## Bloqueadores do Launch Gate

Os seguintes itens impedem rollout de produção até serem resolvidos ou aceitos
explicitamente no Launch Gate:

- Produção conhecida ainda executa `main` anterior.
- Banco de produção é desconhecido.
- Redis de produção é desconhecido ou está mal configurado.
- Backups e restore de produção não foram validados.
- CI permanece ausente.
- Manifests de deploy ainda não estão alinhados à topologia separada.
- O singleton do scheduler não é imposto em deploy.
- O typecheck do frontend possui 14 erros conhecidos.
- Campos financeiros `Float` ainda precisam de revisão.
- `prisma/dev.db` continua rastreado no Git.
- `prisma/setup-provider.js` continua legado.
- O glob genérico do Jest no Windows ainda não separa integrações com
  confiabilidade.

## Resultado do ensaio

Não promova staging para produção automaticamente. Ao fim do ensaio, registre
o SHA, as evidências de cada checklist, resultados de smoke tests, estado de
migrations, estado de filas e decisão explícita de seguir, corrigir ou abortar.
