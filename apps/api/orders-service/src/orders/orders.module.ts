import { Module } from '@nestjs/common';
import { FuelOrdersController } from './controllers/fuel-orders.controller';
import { OrdersJwtAuthGuard } from './guards/orders-jwt-auth.guard';
import { OrdersPermissionsGuard } from './guards/orders-permissions.guard';
import { OrdersPersistenceModule } from './orders-persistence.module';
import { CreateFuelOrderService } from './services/create-fuel-order.service';
import { GetFuelOrderService } from './services/get-fuel-order.service';
import { ListFuelOrdersService } from './services/list-fuel-orders.service';
import { UpdateFuelOrderStatusService } from './services/update-fuel-order-status.service';

const fuelOrderEndpointServices = [CreateFuelOrderService, ListFuelOrdersService, GetFuelOrderService, UpdateFuelOrderStatusService];

@Module({
    imports: [OrdersPersistenceModule],
    controllers: [FuelOrdersController],
    providers: [...fuelOrderEndpointServices, OrdersJwtAuthGuard, OrdersPermissionsGuard],
    exports: [OrdersPersistenceModule, ...fuelOrderEndpointServices],
})
export class OrdersModule {}
