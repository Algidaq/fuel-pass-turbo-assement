import { Module } from '@nestjs/common';
import { FuelOrdersController } from './controllers/fuel-orders.controller';
import { OrdersJwtAuthGuard } from './guards/orders-jwt-auth.guard';
import { OrdersPermissionsGuard } from './guards/orders-permissions.guard';
import { OrdersPersistenceModule } from './orders-persistence.module';
import { FuelOrdersService } from './services/fuel-orders.service';

@Module({
    imports: [OrdersPersistenceModule],
    controllers: [FuelOrdersController],
    providers: [FuelOrdersService, OrdersJwtAuthGuard, OrdersPermissionsGuard],
    exports: [OrdersPersistenceModule, FuelOrdersService],
})
export class OrdersModule {}
