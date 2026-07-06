import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ordersDatabaseEntities } from '../database/typeorm.config';
import { FuelOrderRepository } from './repositories';

const ordersRepositories = [FuelOrderRepository];

@Module({
    imports: [TypeOrmModule.forFeature(ordersDatabaseEntities)],
    providers: ordersRepositories,
    exports: [TypeOrmModule, ...ordersRepositories],
})
export class OrdersPersistenceModule {}
