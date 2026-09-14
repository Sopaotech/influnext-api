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
 * Starts the HTTP runtime only. Background workers and recurring schedules
 * must be started by their dedicated process entrypoints.
 */
export async function startHttpServer() {
  const port = Number(process.env.PORT) || 4000;
  registerRuntimeProcessHandlers();

  try {
    console.log('🔍 Verificando conexão com o banco de dados...');
    const { prisma } = await import('./lib/prisma');
    await prisma.$connect();
    console.log('✅ Banco de dados conectado!');

    return app.listen(port, () => {
      console.log(`🚀 INFLUNEXT ONLINE: Port ${port}`);
      console.log('🌍 URL da API: https://api.influnext.com.br');
    });
  } catch (error: any) {
    console.error('❌ FALHA CRÍTICA NO STARTUP:', error);
    // Preserve legacy HTTP availability while /ready reports unavailable dependencies.
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
