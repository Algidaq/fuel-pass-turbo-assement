import { ApiResponseInterceptor, AppHttpErrorExceptionFilter, CoreMiddlewareModule, PinoAppLoggerModule } from '@fuel-pass/node-commons';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { configs, envs } from '../configs/config';
import { getTypeOrmModuleOptions } from '../configs/typeorm.config';
import { AppController } from './app.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                'apps/api/auth-service/.env',
                process.env['NODE_ENV'] === 'production'
                    ? 'apps/api/auth-service/auth-service-prod.env'
                    : 'apps/api/auth-service/auth-service-dev.env',
                '.env',
            ],
            load: [(): { auth: ReturnType<typeof configs.auth> } => ({ auth: configs.auth() })],
        }),
        TypeOrmModule.forRootAsync({
            useFactory: getTypeOrmModuleOptions,
        }),
        AuthModule,
        CoreMiddlewareModule.forRoot(),
        PinoAppLoggerModule.forRoot({
            service: envs.app.namespace,
            level: envs.app.log.level,
            pretty: envs.app.log.pretty,
        }),
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: ApiResponseInterceptor,
        },
        {
            provide: APP_FILTER,
            useClass: AppHttpErrorExceptionFilter,
        },
    ],
})
export class AppModule {}
