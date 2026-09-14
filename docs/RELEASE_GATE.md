# Release Gate de Backend

O workflow [Backend CI](../.github/workflows/backend-ci.yml) é a base mínima de
gate para o backend/runtime. Ele não faz deploy, não usa GitHub Secrets e não
acessa banco, Redis ou provider externo. PostgreSQL e Redis existem apenas como
services efêmeros do job.

## Checks que bloqueiam avanço

O job `backend` precisa passar para que um SHA possa ser candidato a staging:

1. instalação travada com `npm ci`;
2. `prisma validate`;
3. `prisma generate`;
4. typecheck do backend;
5. testes unitários com filtro seguro de paths;
6. integração PostgreSQL com migrations versionadas;
7. integração HTTP/lifecycle;
8. integração Redis/BullMQ;
9. integração de application workers;
10. integração de scheduler.

Falha em qualquer check bloqueia o avanço daquele SHA. A configuração de
proteção de branch e de required checks continua uma tarefa operacional futura;
este repositório apenas define o workflow e o nome de job que essa proteção deve
exigir.

## Limites do CI atual

- O CI não executa deploy, migration em produção, `prisma db push` ou seed de
  dados reais.
- Migrations são aplicadas somente no PostgreSQL efêmero do job por runners
  versionados e controlados.
- Redis é efêmero e exclusivo do job.
- Providers de pagamento, redes sociais, IA, e-mail e push não recebem
  credenciais reais; os testes usam mocks ou caminhos simulados.
- O frontend não entra neste gate enquanto os 14 erros conhecidos de typecheck
  não forem tratados por passo próprio.
- O problema de glob/path do Jest no Windows permanece documentado; o workflow
  usa o filtro seguro para os unitários e runners próprios para integrações.

## O que o CI não substitui

CI verde não autoriza produção. Antes de qualquer rollout continuam obrigatórios:

- staging provisionado e aprovado com a checklist de staging;
- banco de produção identificado;
- backup e restore validados;
- Redis de produção operacional;
- manifests de deploy alinhados para API, worker e scheduler separados;
- uma única réplica de scheduler imposta pelo deploy;
- smoke tests, rollback, owners e janela de mudança aprovados no Launch Gate.

Consulte [STAGING_ENVIRONMENT_CHECKLIST.md](STAGING_ENVIRONMENT_CHECKLIST.md) e
[PRODUCTION_ROLLOUT_PLAN.md](PRODUCTION_ROLLOUT_PLAN.md) antes de propor um
deploy.
