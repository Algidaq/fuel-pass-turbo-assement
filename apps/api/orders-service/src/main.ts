import { createPinoHttpMiddleware, PinoAppLogger } from '@fuel-pass/node-commons';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { envs } from './configs/config';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(PinoAppLogger);

    app.setGlobalPrefix(envs.app.globalPrefix);
    app.enableCors(envs.app.cors);
    app.useLogger(app.get(PinoAppLogger));
    app.use(createPinoHttpMiddleware({ logger: logger.pino }));
    await app.listen(envs.app.port);

    Logger.log(`🚀 Application is running on: http://localhost:${envs.app.port}/${envs.app.globalPrefix}`);
}

bootstrap().then(Logger.log.bind(Logger)).catch(Logger.error.bind(Logger));
