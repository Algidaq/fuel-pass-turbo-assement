import { CoreAuthModule, JwtIntrospectionAuthGuard, PermissionsGuard, type CoreAuthModuleOptions } from '@fuel-pass/node-commons';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getAuthRuntimeConfig } from '../configs/orders-auth.config';
import { FuelOrdersController } from './controllers/fuel-orders.controller';
import { OrdersPersistenceModule } from './orders-persistence.module';
import { CreateFuelOrderService } from './services/create-fuel-order.service';
import { GetFuelOrderService } from './services/get-fuel-order.service';
import { ListFuelOrdersService } from './services/list-fuel-orders.service';
import { UpdateFuelOrderStatusService } from './services/update-fuel-order-status.service';

const fuelOrderEndpointServices = [CreateFuelOrderService, ListFuelOrdersService, GetFuelOrderService, UpdateFuelOrderStatusService];

@Module({
    imports: [
        OrdersPersistenceModule,
        CoreAuthModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService): CoreAuthModuleOptions => ({
                internalAuthBaseUrl: configService.get<string>('auth.internalAuthBaseUrl') ?? getAuthRuntimeConfig().internalAuthBaseUrl,
                internalServiceApiKey:
                    configService.get<string>('auth.internalServiceApiKey') ?? getAuthRuntimeConfig().internalServiceApiKey,
                introspectionTimeoutMs:
                    configService.get<number>('auth.introspectionTimeoutMs') ?? getAuthRuntimeConfig().introspectionTimeoutMs,
            }),
        }),
    ],
    controllers: [FuelOrdersController],
    providers: [...fuelOrderEndpointServices, JwtIntrospectionAuthGuard, PermissionsGuard],
    exports: [OrdersPersistenceModule, ...fuelOrderEndpointServices],
})
export class OrdersModule {}
