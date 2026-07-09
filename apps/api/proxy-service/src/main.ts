//
import 'dotenv/config';
import { envs } from './configs/config';
import { logger } from './logger/logger';
import { createServer } from './server/server';

const application = createServer(envs.app);

const server = application.listen(envs.app.port, (): void => {
    logger.info('Proxy service started', {
        data: {
            port: envs.app.port,
            services: envs.app.services.map((service): string => service.namespace),
        },
    });
});

process.on('uncaughtException', (error): void => {
    logger.error('Uncaught exception', { error });
});

process.on('unhandledRejection', (reason, promise): void => {
    logger.error('Unhandled promise rejection', {
        error: { reason, promise },
    });
});
process.on('SIGTERM', (): void => {
    void (async (): Promise<void> => {
        try {
            logger.info('SIGTERM received, shutting down');

            await new Promise<void>((resolve, reject): void => {
                server.close((error?: Error): void => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
            logger.info('HTTP server closed');
        } catch (error) {
            logger.error('SIGTERM shutdown failed', { error });
        }
    })();
});
