import { app } from './app';

export { app };

let runtimeHandlersRegistered = false;

function registerRuntimeProcessHandlers(): void {
  if (runtimeHandlersRegistered) return;
  runtimeHandlersRegistered = true;

  process.on('unhandledRejection', (reason: any) => {
    if (reason?.message?.includes('ECONNREFUSED') && reason?.message?.includes('6379')) return;
    console.error('❌ REJEIÇÃO:', reason);
  });

  process.on('uncaughtException', (error: any) => {
    if (error?.message?.includes('ECONNREFUSED') && error?.message?.includes('6379')) return;
    console.error('❌ EXCEÇÃO:', error);
  });
}

/**
 * Temporary compatibility path: direct HTTP startup still owns workers and
 * schedules until their dedicated runtime entrypoints are introduced.
 */
function startLegacyBackgroundRuntime(): void {
  console.log('🔄 Inicializando workers e crons de background em paralelo...');
  void Promise.all([
    import('./workers/notification.worker').then(module => module.startNotificationWorker()),
    import('./workers/cleanup.worker').then(module => module.startCleanupWorker()),
    import('./workers/token-renewal.worker'),
    import('./workers/post-analyzer.worker'),
    import('./queues/scheduler').then(module => module.registerApplicationSchedules()),
  ]).then(() => {
    console.log('✅ Workers e crons de background ativos.');
  }).catch((workerError: any) => {
    console.warn('⚠️ Falha ao inicializar workers em background (Redis offline?):', workerError.message || workerError);
  });
}

export async function startHttpServer() {
  const port = Number(process.env.PORT) || 4000;
  registerRuntimeProcessHandlers();

  try {
    console.log('🔍 Verificando conexão com o banco de dados...');
    const { prisma } = await import('./lib/prisma');
    await prisma.$connect();
    console.log('✅ Banco de dados conectado!');

    startLegacyBackgroundRuntime();

    return app.listen(port, () => {
      console.log(`🚀 INFLUNEXT ONLINE: Port ${port}`);
      console.log('🌍 URL da API: https://api.influnext.com.br');
    });
  } catch (error: any) {
    console.error('❌ FALHA CRÍTICA NO STARTUP:', error);
    // Preserve the legacy HTTP availability behavior while readiness remains future work.
    return app.listen(port, () => {
      console.log(`⚠️ Servidor subiu com ERROS (Port ${port}). Verifique os logs.`);
    });
  }
}

// Compatibility alias for callers that used the previous runtime name.
export const startServer = startHttpServer;

if (require.main === module) {
  void startHttpServer();
}
