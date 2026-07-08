import {
    ApiResponseInterceptor,
    AppHttpErrorExceptionFilter,
    CoreMiddlewareModule,
    DEFAULT_CORE_MIDDLEWARE_MODULE_OPTIONS,
    getOsEnv,
} from '@fuel-pass/node-commons';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configs } from '../configs/config';
import { getTypeOrmModuleOptions } from '../configs/typeorm.config';
import { OrdersModule } from '../orders/orders.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                'apps/api/orders-service/.env',
                getOsEnv('NODE_ENV') === 'production'
                    ? 'apps/api/orders-service/orders-service-prod.env'
                    : 'apps/api/orders-service/orders-service-dev.env',
                '.env',
            ],
            load: [
                (): {
                    auth: ReturnType<typeof configs.auth>;
                    database: ReturnType<typeof configs.database>;
                } => ({ auth: configs.auth(), database: configs.database() }),
            ],
        }),
        TypeOrmModule.forRootAsync({
            useFactory: getTypeOrmModuleOptions,
        }),
        OrdersModule,
        CoreMiddlewareModule.forRoot({ ...DEFAULT_CORE_MIDDLEWARE_MODULE_OPTIONS, security: false }),
    ],
    controllers: [AppController],
    providers: [
        AppService,
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
