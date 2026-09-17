# Mapa de UI para frescor e confiança dos dados Instagram

Este documento define como os consumidores frontend devem interpretar os
contratos de Instagram já expostos pelo backend. Ele é uma decisão de produto e
UI: não altera runtime, não autoriza chamadas a providers e não substitui uma
implementação futura dos componentes.

## Fonte de verdade e limites

O payload a ser interpretado é composto por:

- `instagramFreshness`: fonte principal para frescor, disponibilidade, ação e
  mensagem segura para a interface.
- `instagramMetricCollection`: proveniência, janela de coleta, tamanho da
  amostra e cobertura parcial.
- `instagramSync`: estado operacional complementar. Não deve ser usado para
  expor erro interno, lease ou resposta de provider.
- `metricsHistory`: snapshot disponível para exibição, somente quando
  `instagramFreshness.isVerifiedSnapshot` for verdadeiro.

`verifiedMetrics` é compatibilidade legada. Novos consumidores devem decidir
se um dado é verificável por `isVerifiedSnapshot`, e não pelo campo legado.
`syncWarning` também é legado: novos componentes devem usar `syncMessageKey`
para escolher cópias locais e seguras.

Os campos sempre presentes em `instagramFreshness` são `status`,
`isVerifiedSnapshot`, `isStale`, `staleAfterHours`, `metricsSource`,
`syncAction` e `syncMessageKey`. As datas, `collectionWindowDays` e
`sampleSize` podem ser nulos. Ausência de snapshot nunca pode ser convertida em
uma métrica factual, em zero ou em um número demonstrativo.

## Superfícies a adaptar futuramente

| Superfície | Arquivo principal | Estado atual | Mudança futura necessária |
| --- | --- | --- | --- |
| Dashboard do creator | `web/src/app/dashboard/influencer/page.tsx` | Busca o dashboard, mas não tipa nem interpreta os contratos Instagram. | Adicionar tipos e um bloco de estado/frescor antes dos KPIs. |
| Mídia kit do creator | `web/src/app/dashboard/mediakit/page.tsx` | Exibe fallbacks demonstrativos de seguidores, engajamento, alcance e visualizações; também afirma métricas em tempo real e auditoria. | Remover fallbacks factuais e condicionar toda linguagem de verificação ao snapshot. |
| Perfil público | `web/src/app/p/[handle]/PublicProfileView.tsx` | Usa `verifiedMetrics` e fallback numérico; mantém um banner de autenticação forte. | Consumir frescor, proveniência e parcialidade; condicionar selo e banner ao snapshot verificável. |
| Settings / integrações | `web/src/app/dashboard/settings/page.tsx` | Trata conta OAuth conectada como sincronizada/ativa. | Distinguir conexão, primeira coleta, sync, retry e reconexão. |
| Dashboard da empresa | `web/src/app/dashboard/company/page.tsx` | Usa dados resumidos e fallbacks para o creator. | Receber e interpretar frescor antes de comparar ou mostrar KPI. |
| Marketplace / busca | `web/src/app/dashboard/marketplace/page.tsx` | Usa `verifiedMetrics` e valores de reserva. | Não comparar nem preencher métricas indisponíveis; incluir proveniência e frescor em endpoint futuro. |
| Novo contrato | `web/src/app/dashboard/company/new-contract/page.tsx` | Possui creators demonstrativos marcados como verificados. | Não usar dados demonstrativos ou selo de auditoria em fluxos reais. |
| Tipos HTTP | `web/src/lib/api.ts` | Tipos ainda não incluem os contratos novos. | Criar tipos compartilhados antes do primeiro consumidor visual. |

## Mapa global de estados

| Status | Badge | Exibição de KPIs | Creator | Perfil público e empresa |
| --- | --- | --- | --- | --- |
| `fresh` | `Atualizado recentemente` | Mostrar quando há snapshot verificável. | Sem CTA; mostrar data e, se aplicável, escopo/amostra. | Mostrar selo discreto e data. |
| `stale` | `Dados desatualizados` | Mostrar como histórico real, nunca como dado atual. | Aviso e última atualização. | Aviso obrigatório e data visível. |
| `pending` | `Coleta pendente` | Sem snapshot: não mostrar KPI factual. Com snapshot: mostrar histórico com aviso. | “Instagram conectado. Estamos buscando seus dados.” | Estado indisponível ou histórico com aviso, sem CTA. |
| `syncing` | `Sincronizando` | Manter snapshot anterior apenas com aviso. Sem snapshot: placeholder. | “Estamos sincronizando seu Instagram.” Sem ação repetida. | Informação passiva, sem bloquear a página. |
| `retry_scheduled` | `Nova tentativa agendada` | Com snapshot: histórico com aviso. Sem snapshot: indisponível. | Informar a nova tentativa; não incentivar repetição. | Sem erro técnico ou CTA. |
| `reconnect_required` | `Reconexão necessária` | Não apresentar como métrica atual. | CTA para reconectar Instagram. | “Métricas indisponíveis no momento”, sem causa técnica. |
| `unavailable` | `Dados indisponíveis` | Ocultar KPI ou usar placeholder sem valor. | Sem conexão: CTA conectar. Conectado sem snapshot: informar aguardo/indisponibilidade. | Não exibir métrica verificada ou número de reserva. |

`NO_RECENT_MEDIA` não é um status de frescor separado. A interface deve
interpretar `syncMessageKey = instagram.no_recent_media`: com snapshot anterior,
mostrar o dado histórico com a observação; sem snapshot, explicar que ainda não
há mídias recentes suficientes.

## Mapa de ações de sync

| `syncAction` | Dashboard do creator | Perfil público / empresa | Botão |
| --- | --- | --- | --- |
| `none` | Apenas frescor, proveniência e data. | Apenas informação. | Não mostrar. |
| `wait` | Exibir progresso não bloqueante e impedir disparos repetidos. | Estado passivo. | Oculto ou desabilitado. |
| `retry_later` | Informar retry agendado e, se disponível, data prevista. | Estado passivo. | Oculto ou desabilitado. |
| `reconnect` | Direcionar para a integração Instagram. | Exibir indisponibilidade sem CTA. | Apenas creator: `Reconectar Instagram`. |
| `connect` | Direcionar para a conexão Instagram. | Exibir indisponibilidade sem CTA. | Apenas creator: `Conectar Instagram`. |

## Banco inicial de cópias

### Dashboard do creator

- Instagram conectado. Estamos buscando seus dados.
- Dados atualizados há {timeAgo}.
- Seus dados estão desatualizados. Última atualização: {date}.
- Estamos sincronizando seu Instagram.
- Nova tentativa automática agendada.
- Reconecte seu Instagram para atualizar suas métricas.
- Ainda não encontramos mídias recentes suficientes.
- Algumas métricas podem estar incompletas.

### Perfil público e mídia kit

- Dados verificados pela InfluNext.
- Última atualização: {date}.
- Dados históricos — podem não refletir o momento atual.
- Métricas indisponíveis no momento.
- Amostra de mídias dos últimos 30 dias.
- Cobertura parcial de métricas.

### Visão da empresa

- Métricas verificadas recentemente.
- Métricas históricas.
- Dados indisponíveis para comparação.
- Cobertura parcial de métricas.

### Settings e integrações

- Conectado, aguardando primeira sincronização.
- Sincronizado recentemente.
- Reconexão necessária.
- Nova tentativa agendada.
- Sem mídias recentes suficientes.

As cópias devem ser escolhidas por `syncMessageKey`, sem mostrar erros brutos,
respostas de provider ou detalhes de token.

## Política de exibição de dados

1. Seguidores, alcance, engajamento e visualizações só podem usar valores do
   snapshot quando `isVerifiedSnapshot` for verdadeiro.
2. Sem snapshot, ocultar o card ou usar um placeholder sem número. `0` não é
   substituto para dado ausente.
3. Em `stale`, mostrar o último snapshot junto da data. O selo de verificação
   pode permanecer, mas deve ser acompanhado do aviso de dado histórico.
4. Quando `instagramMetricCollection.isPartial` for verdadeiro, mostrar
   “Cobertura parcial de métricas” ao lado ou abaixo dos KPIs afetados.
5. Mostrar `sampleSize` e a janela de coleta quando disponíveis. A frase
   “Amostra de mídias dos últimos 30 dias” só pode ser usada quando
   `collectionWindowDays = 30`.
6. `reachLast30Days` não deve ser apresentado como alcance total da conta. A
   interface deve usar a definição e a abrangência fornecidas pela proveniência.
7. Creator ou empresa não devem ser comparados, classificados ou penalizados
   por dados `unavailable`, pendentes ou parciais sem uma indicação explícita.
8. Valores demonstrativos, textos de “tempo real” e selos de auditoria devem
   sair das telas antes de elas passarem a representar dados reais.

## Política de badges de confiança

- `Verificado pela InfluNext`: somente se `isVerifiedSnapshot = true`.
- `Atualizado recentemente`: somente se `status = fresh`.
- `Dados históricos`: somente se `status = stale`.
- `Cobertura parcial`: somente se `instagramMetricCollection.isPartial = true`.
- Linguagem SHA-256 ou de auditoria forte: somente para snapshot real
  verificável; nunca como ornamento permanente.
- Uma conta OAuth conectada não é, por si só, uma conta com métricas
  verificadas.

## Sequência de implementação recomendada

Recomendação: **STEP 3B-O — Frontend Instagram Freshness Type Contract**.

Primeiro, adicionar tipos frontend para `instagramFreshness`, `instagramSync` e
`instagramMetricCollection` em `web/src/lib/api.ts`, sem reestruturar telas. Em
seguida, implementar o consumo no dashboard do creator e, antes de expor dados
comerciais, remover os fallbacks demonstrativos do mídia kit e perfil público.

## Limites desta decisão

- Este mapa não altera componentes, endpoints ou campos legados.
- O contrato ainda não está disponível na busca/marketplace e no dashboard da
  empresa; esses endpoints precisarão de uma fatia própria antes de qualquer
  ranking baseado em frescor.
- A atual fonte de histórico confiável começa no snapshot coletado pela
  InfluNext; a UI não pode prometer dados desde a criação da conta Instagram.
