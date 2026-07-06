import { ApiResponseInterceptor, CoreMiddlewareModule } from '@fuel-pass/node-commons';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
                'apps/api/orders/.env',
                process.env['NODE_ENV'] === 'production'
                    ? 'apps/api/orders/orders-service-prod.env'
                    : 'apps/api/orders/orders-service-dev.env',
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
