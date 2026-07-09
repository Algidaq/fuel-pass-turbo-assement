/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
//
import 'dotenv/config';
//
import { createPinoHttpMiddleware, PinoAppLogger } from '@fuel-pass/node-commons';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Server } from 'node:http';
import { DataSource } from 'typeorm';
import { AppModule } from './app/app.module';
import { envs } from './configs/config';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(PinoAppLogger);

    app.setGlobalPrefix(envs.app.globalPrefix);
    app.enableCors(envs.app.cors);
    app.useLogger(app.get(PinoAppLogger));
    app.use(createPinoHttpMiddleware({ logger: logger.pino }));
    const server = (await app.listen(envs.app.port)) as Server;
    const dataSource = app.get(DataSource);

    Logger.log(`🚀 Application is running on: http://localhost:${envs.app.port}/${envs.app.globalPrefix}`);

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

                if (dataSource.isInitialized) {
                    await dataSource.destroy();
                    logger.info('Database connection closed');
                }
            } catch (error) {
                logger.error('SIGTERM shutdown failed', { error });
            }
        })();
    });
}

bootstrap().then(Logger.log.bind(Logger)).catch(Logger.error.bind(Logger));
