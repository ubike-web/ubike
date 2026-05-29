import 'dotenv/config';
import http from 'http';
import { env } from './config/env';
import { createApp } from './config/app';
import { socketGateway } from './infrastructure/realtime/SocketGateway';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  socketGateway.init(server);

  server.listen(env.PORT, () => {
    console.log(`[u-bike API] Running on port ${env.PORT} (${env.NODE_ENV})`);
    console.log(`[u-bike API] Health: http://localhost:${env.PORT}/health`);
  });

  const shutdown = () => {
    console.log('[u-bike API] Shutting down...');
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch(err => {
  console.error('[u-bike API] Fatal startup error:', err);
  process.exit(1);
});
