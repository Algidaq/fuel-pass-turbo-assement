import { ApiResponseInterceptor, CoreMiddlewareModule } from '@fuel-pass/node-commons';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { configs } from '../configs/config';
import { getTypeOrmModuleOptions } from '../configs/typeorm.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                'apps/api/auth/.env',
                process.env['NODE_ENV'] === 'production' ? 'apps/api/auth/auth-service-prod.env' : 'apps/api/auth/auth-service-dev.env',
                '.env',
            ],
            load: [(): { auth: ReturnType<typeof configs.auth> } => ({ auth: configs.auth() })],
        }),
        TypeOrmModule.forRootAsync({
            useFactory: getTypeOrmModuleOptions,
        }),
        AuthModule,
        CoreMiddlewareModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: ApiResponseInterceptor,
        },
    ],
})
export class AppModule {}
