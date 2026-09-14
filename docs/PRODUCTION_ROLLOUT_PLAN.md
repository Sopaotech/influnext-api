# Plano de Rollout de Produção

Este documento define o plano futuro para implantar a arquitetura InfluNext com
API, worker e scheduler separados. Não é autorização de deploy e não substitui
o Launch Gate. Produção continua bloqueada até que as pré-condições deste plano
tenham evidência revisada e aprovação explícita.

Use [LOCAL_RUNTIME_RUNBOOK.md](LOCAL_RUNTIME_RUNBOOK.md) para a execução local e
[STAGING_ENVIRONMENT_CHECKLIST.md](STAGING_ENVIRONMENT_CHECKLIST.md) para o
ensaio de staging. Não trate esses documentos como instruções para alterar a
produção automaticamente.

## Objetivo

Definir uma ordem reversível e observável para levar uma branch aprovada à
produção, com processos separados para HTTP, filas e schedules. O objetivo é
reduzir risco de incompatibilidade entre aplicação, banco, Redis, migrations e
provedores externos.

## Não objetivos

- Não executar deploy agora.
- Não provisionar serviços pagos agora.
- Não alterar produção, variáveis, escala, banco, Redis ou DNS neste passo.
- Não usar dados reais em testes de staging.
- Não aplicar migration em produção sem backup e restore validados.
- Não ativar pagamentos, redes sociais, IA, e-mail, push ou outro provider real
  sem autorização específica.

## Estado conhecido de produção

- A produção conhecida ainda executa um `main` anterior; a branch atual não
  está implantada.
- O banco de produção não está identificado e validado como fonte autoritativa.
- Redis de produção permanece desconhecido ou mal configurado.
- CI e um release gate verificável ainda não existem.
- Manifests de deploy ainda não estão alinhados à topologia API/worker/scheduler.
- O typecheck do frontend possui 14 erros conhecidos fora deste plano.

Essas condições bloqueiam qualquer rollout. Nenhuma inferência sobre banco,
backup, réplicas, dados ou configuração de produção deve substituir evidência
operacional atual.

## Pré-condições obrigatórias

Antes de abrir uma janela de produção, registrar evidência para todos os itens:

- [ ] CI verde para o SHA alvo, com checks definidos e revisáveis.
- [ ] Staging aprovado com a checklist de staging completa.
- [ ] Banco autoritativo de produção identificado, incluindo schema aplicado.
- [ ] Backup de produção concluído e capacidade de restore validada.
- [ ] Redis de produção operacional, identificado e isolado adequadamente.
- [ ] Variáveis completas e revisadas por processo, sem valores em logs ou Git.
- [ ] Migrations versionadas revisadas e plano de aplicação aprovado.
- [ ] Rollback de aplicação, banco, worker e scheduler definido.
- [ ] API, worker e scheduler provisionados como processos separados.
- [ ] Scheduler limitado a exatamente uma réplica.
- [ ] Smoke tests pós-deploy definidos, com responsáveis e critérios de êxito.
- [ ] Owners, janela de mudança, canal de incidentes e critério de abortamento
      definidos.

## Topologia alvo de produção

### API service

- Comando: `npm start`.
- Responsabilidade: receber HTTP e servir `/health` e `/ready`.
- Não inicia workers, scheduler ou migrations.
- Pode escalar horizontalmente depois de validar dependências e sessão.
- Depende de PostgreSQL, Redis e configuração de autenticação/origens.

### Worker service

- Comando: `npm run start:worker`.
- Responsabilidade: processar filas BullMQ.
- Escala independentemente da API conforme a carga e a idempotência dos jobs.
- Depende de PostgreSQL, Redis e somente dos providers necessários aos workers
  explicitamente habilitados.

### Scheduler service

- Comando: `npm run start:scheduler`.
- Responsabilidade: registrar jobs recorrentes.
- Não abre HTTP e não processa jobs.
- Deve ter **exatamente uma réplica**.
- Depende de Redis; reavaliar banco se a implementação futura passar a consultar
  dados para decidir schedules.

### Migration job

- Comando: `prisma migrate deploy`.
- Executado como ação manual/controlada antes do runtime.
- Nunca faz parte do startup de API, worker ou scheduler.
- Usa conexão/identidade de migrator aprovada quando a política exigir.

## Matriz de ambiente

Registre presença, owner e rotação; nunca documente valores, passwords, tokens
ou URLs completas em tickets, logs ou este plano.

### API

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Runtime PostgreSQL |
| `REDIS_URL` | Filas, estado Redis e readiness |
| `JWT_SECRET` | Assinatura/validação de sessão |
| `ALLOWED_ORIGINS` ou `FRONTEND_URL` | CORS e origem permitida |
| `SESSION_COOKIE_DOMAIN` / `NEXT_PUBLIC_COOKIE_DOMAIN` | Quando cookies cross-domain forem usados |
| `ENCRYPTION_KEY` | Recursos de 2FA quando habilitados |
| `SOCIAL_TOKEN_ACTIVE_KEY_ID` | Escrita de tokens sociais criptografados |
| `SOCIAL_TOKEN_KEY_<ID>` | Leitura/escrita de tokens sociais criptografados |
| Variáveis de provider | Somente para features explicitamente habilitadas |

### Worker

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Persistência e consultas de jobs |
| `REDIS_URL` | Consumo das filas BullMQ |
| `NODE_ENV` | Identificação explícita do ambiente |
| `SOCIAL_TOKEN_*` | Quando token renewal estiver habilitado |
| Variáveis de provider | Somente para workers explicitamente habilitados |

### Scheduler

| Variável | Uso |
| --- | --- |
| `REDIS_URL` | Registro de schedules BullMQ |
| `NODE_ENV` | Identificação explícita do ambiente |

### Migration job

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` e/ou `DIRECT_URL` | Conforme política Prisma aprovada |
| `DIRECT_URL` | Conexão direta de migrator quando necessária |

Não reutilize o usuário de runtime da aplicação como migrator se a política
exigir uma identidade de migrator separada.

## Ordem de rollout

1. Congelar mudanças de schema e registrar checkpoint/backup antes da janela.
2. Confirmar o SHA alvo, aprovação, release notes e SHA anterior para rollback.
3. Configurar e validar staging com valores exclusivamente de staging.
4. Aplicar migrations versionadas em staging de forma controlada.
5. Subir API de staging e validar `/health` e `/ready`.
6. Subir worker de staging, sem HTTP público.
7. Subir uma única instância de scheduler de staging.
8. Executar smoke tests de staging e validar filas/schedules.
9. Revisar logs, garantindo ausência de segredos e chamadas externas indevidas.
10. Aprovar formalmente a janela de produção ou interromper o plano.
11. Criar backup de produção e confirmar capacidade de restore antes de qualquer
    migration.
12. Aplicar migrations de produção como job controlado e registrar o resultado.
13. Subir API de produção no SHA aprovado.
14. Subir worker de produção no mesmo SHA aprovado.
15. Subir exatamente uma instância de scheduler no mesmo SHA aprovado.
16. Validar `/health` e `/ready` sem expor informações sensíveis.
17. Validar filas, repeatable jobs e registro único dos schedules.
18. Monitorar durante a janela acordada.
19. Manter rollback pronto até o término da observação.

Não avance para a próxima etapa se o critério da etapa atual não tiver evidência
ou se algum critério de abortamento ocorrer.

## Smoke tests pós-deploy

Executar com dados sintéticos quando possível e sem chamar providers externos
sem autorização:

- [ ] `/health` responde `200`.
- [ ] `/api/health` responde `200`.
- [ ] `/ready` responde `200` somente com configuração, PostgreSQL e Redis
      saudáveis.
- [ ] Signup/login seguem as permissões esperadas.
- [ ] Sessão usa cookie `HttpOnly`, sem token no JSON.
- [ ] `GET /v1/auth/me` funciona somente com sessão válida.
- [ ] Ownership de Task bloqueia acesso indevido sem vazar dados.
- [ ] Ownership de Contract respeita participante e papel.
- [ ] Autorização de pagamento bloqueia antes de provider externo quando não
      houver permissão.
- [ ] Caminhos de token social mantêm criptografia e não expõem tokens em HTTP
      ou logs.
- [ ] `daily-cleanup` e `daily-token-renewal` são registrados uma única vez.
- [ ] Notification, cleanup, token renewal e post analyzer usam apenas caminhos
      seguros/autorizados.
- [ ] Logs não contêm segredos, tokens, URLs com credenciais ou stack traces
      sensíveis.

## Rollback e abortamento

### Plano de rollback

- Retornar API, worker e scheduler ao SHA anterior aprovado de forma coordenada.
- Tratar rollback de banco separadamente: migrations não possuem rollback
  automático.
- Nunca apagar tabela ou coluna para reverter sem um plano de migration/restore
  revisado.
- Restaurar backup somente com decisão explícita, owner definido e comunicação
  de incidente.
- Desligar scheduler se houver schedules ou jobs duplicados.
- Pausar workers se filas estiverem produzindo efeitos incorretos.
- Usar feature flags/configurações para desabilitar recursos quando existirem.

### Critérios de abortamento

Abortar ou pausar o rollout quando houver:

- `/ready` retornando `503` de forma persistente;
- erro de Prisma, migration ou conexão de banco;
- Redis indisponível;
- crash loop de worker ou scheduler;
- scheduler duplicado ou jobs duplicados;
- login, cookie ou sessão quebrados;
- logs expondo segredo;
- provider externo chamado sem autorização;
- aumento sustentado de erros `5xx`.

## Monitoramento pós-rollout

Durante e após a janela, acompanhar de forma sanitizada:

- logs da API, worker e scheduler;
- profundidade de filas BullMQ e jobs failed/stalled;
- disponibilidade e latência de Redis;
- conectividade, carga e erros de PostgreSQL;
- `_prisma_migrations` após migration controlada;
- auth, sessão e respostas `4xx`/`5xx`;
- CPU e memória por processo;
- resultado de `/ready`.

Defina limites e owner para cada alerta antes de habilitar tráfego real.

## Bloqueadores atuais do Launch Gate

- CI está ausente.
- Staging ainda não foi provisionado nem testado.
- Banco de produção é desconhecido.
- Redis de produção é desconhecido ou mal configurado.
- Backups e restores de produção não foram validados.
- Manifests de deploy ainda não estão alinhados à topologia separada.
- O singleton do scheduler não é imposto em deploy.
- Produção ainda executa `main` anterior.
- O typecheck do frontend possui 14 erros conhecidos.
- `prisma/dev.db` continua rastreado no Git.
- `prisma/setup-provider.js` continua legado.
- Campos financeiros `Float` permanecem pendentes.
- O glob genérico do Jest no Windows ainda não separa integrações de forma
  confiável.
- Documentação histórica ainda cita `db push` e runtime combinado.

## Decisão final do Launch Gate

O Launch Gate precisa registrar o SHA escolhido, resultado de staging, estado
de backup/restore, estado de migrations, estado de Redis, owners, janela de
mudança e decisão explícita de prosseguir, corrigir ou abortar. Sem essa decisão,
este plano não autoriza deploy.
