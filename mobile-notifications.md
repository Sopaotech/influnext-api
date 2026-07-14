# Plano do Projeto: Sistema de Notificações Push Mobile

Visão geral do plano de implementação, tarefas, dependências e listas de verificação.

## Critérios de Sucesso

1. O usuário pode registrar o token push FCM do dispositivo móvel através de um endpoint seguro `/v1/auth/fcm-token`.
2. Quando um pagamento Stripe é concluído (Checkout Session ou PaymentIntent), uma tarefa de notificação é colocada na fila.
3. O trabalhador de background processa a tarefa e dispara uma notificação push para o token FCM do usuário.
4. Se as credenciais do Firebase não estiverem configuradas, as notificações push são simuladas nos logs.
5. O aplicativo Flutter inicializa o Firebase, solicita permissões e sincroniza automaticamente o token FCM quando o usuário faz login no WebView.

## Stack de Tecnologia

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, BullMQ, Redis.
- **Provedor de Push**: Firebase Admin SDK (com fallback de simulação).
- **Mobile**: Flutter, Dart, `firebase_core`, `firebase_messaging`, `flutter_local_notifications`.

## Estrutura de Arquivos

```plaintext
prisma/
└── schema.prisma                    # Atualização do modelo User para adicionar fcmToken
src/
├── controllers/
│   ├── auth.controller.ts           # Adicionar controller updateFcmToken
│   └── payment.controller.ts        # Disparar notificação no payment_intent.succeeded
├── routes/
│   └── auth.routes.ts               # Rota POST /auth/fcm-token
├── services/
│   └── push-notification.service.ts # Serviço de push notifications via firebase-admin
└── workers/
    └── notification.worker.ts       # Execução do envio de push no worker
mobile/
├── pubspec.yaml                     # Adicionar firebase_core, firebase_messaging, flutter_local_notifications
└── lib/
    ├── main.dart                    # Inicializar NotificationService
    ├── screens/
    │   └── pwa_webview_screen.dart  # Capturar cookie de sessão e sincronizar token FCM
    └── services/
        └── notification_service.dart # Gerenciador do serviço de push
```

## Divisão de Tarefas

### Fase 1: Banco de Dados & Fundação (P0)

#### Tarefa 1.1: Extensão do Schema do Banco de Dados
- **Agente**: `database-architect`
- **Habilidades**: `database-design`, `prisma-expert`
- **Prioridade**: Alta
- **Dependências**: Nenhuma
- **Entrada**: `prisma/schema.prisma`
- **Saída**: Schema atualizado com o campo `fcmToken String?` no modelo `User`.
- **Verificação**: Executar `npx prisma validate`.

#### Tarefa 1.2: Migração do Banco de Dados
- **Agente**: `devops-engineer`
- **Habilidades**: `deployment-procedures`
- **Prioridade**: Alta
- **Dependências**: Tarefa 1.1
- **Entrada**: Alteração no schema
- **Saída**: Banco de dados PostgreSQL local atualizado.
- **Verificação**: Executar `npx prisma db push`.

### Fase 2: Implementação Backend (P1)

#### Tarefa 2.1: Integração do Firebase Admin SDK
- **Agente**: `backend-specialist`
- **Habilidades**: `nodejs-best-practices`
- **Prioridade**: Média
- **Dependências**: Tarefa 1.2
- **Entrada**: Nenhuma
- **Saída**: Criado o arquivo `src/services/push-notification.service.ts`.
- **Verificação**: Compilação TypeScript (`npm run build`).

#### Tarefa 2.2: Endpoint de Registro de Token FCM
- **Agente**: `backend-specialist`
- **Habilidades**: `api-patterns`
- **Prioridade**: Alta
- **Dependências**: Tarefa 2.1
- **Entrada**: `src/controllers/auth.controller.ts`, `src/routes/auth.routes.ts`
- **Saída**: Endpoint `/v1/auth/fcm-token` disponível.
- **Verificação**: Requisição de teste autenticada no endpoint `/v1/auth/fcm-token`.

#### Tarefa 2.3: Execução da Fila de Notificações
- **Agente**: `backend-specialist`
- **Habilidades**: `nodejs-best-practices`
- **Prioridade**: Alta
- **Dependências**: Tarefa 2.2
- **Entrada**: `src/workers/notification.worker.ts`
- **Saída**: Chamada do `sendPushNotification` no processador da fila.
- **Verificação**: Criar um job mockado e verificar logs do servidor.

#### Tarefa 2.4: Gatilhos de Notificação no PaymentIntent
- **Agente**: `backend-specialist`
- **Habilidades**: `api-patterns`
- **Prioridade**: Média
- **Dependências**: Tarefa 2.3
- **Entrada**: `src/controllers/payment.controller.ts`
- **Saída**: Gatilho de notificação configurado no webhook do `payment_intent.succeeded`.
- **Verificação**: Simulação do webhook Stripe.

### Fase 3: Implementação Mobile (Flutter) (P2)

#### Tarefa 3.1: Adicionar Dependências
- **Agente**: `mobile-developer`
- **Habilidades**: `mobile-design`
- **Prioridade**: Alta
- **Dependências**: Nenhuma
- **Entrada**: `mobile/pubspec.yaml`
- **Saída**: pubspec atualizado.
- **Verificação**: `flutter pub get` (quando ambiente disponível).

#### Tarefa 3.2: Serviço de Notificações Mobile
- **Agente**: `mobile-developer`
- **Habilidades**: `mobile-design`
- **Prioridade**: Alta
- **Dependências**: Tarefa 3.1
- **Entrada**: `mobile/lib/services/notification_service.dart`
- **Saída**: Lógica de inicialização do Firebase e envio do token FCM para a API.
- **Verificação**: Compilação sem erros.

#### Tarefa 3.3: Ponte de Sessão do WebView
- **Agente**: `mobile-developer`
- **Habilidades**: `mobile-design`
- **Prioridade**: Alta
- **Dependências**: Tarefa 3.2
- **Entrada**: `mobile/lib/screens/pwa_webview_screen.dart`
- **Saída**: Captura dos cookies de login ao terminar de carregar páginas e sincronização do token.
- **Verificação**: Fluxo de carregamento do WebView.

#### Tarefa 3.4: Inicialização na Main
- **Agente**: `mobile-developer`
- **Habilidades**: `mobile-design`
- **Prioridade**: Alta
- **Dependências**: Tarefa 3.3
- **Entrada**: `mobile/lib/main.dart`
- **Saída**: Serviço ativado na inicialização do app.
- **Verificação**: Compilação do app Flutter.

## Fase X: Validação Final

- [x] Verificação de lints/tipos: `npx tsc --noEmit` compilou sem erros.
