import { DataSource } from 'typeorm';
import { ordersDatabaseEntities } from '../../../src/configs/typeorm.config';
import { seedOrdersData } from '../../../src/database/seed';
import { FuelOrderEntity, FuelOrderStatus, FuelOrderStatusHistoryEntity } from '../../../src/orders/entities';

describe('orders seed data with SQLite', () => {
    let dataSource: DataSource;

    beforeEach(async () => {
        dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            entities: ordersDatabaseEntities,
            synchronize: true,
            dropSchema: true,
        }).initialize();
    });

    afterEach(async () => {
        if (dataSource?.isInitialized === true) {
            await dataSource.destroy();
        }
    });

    it('seeds orders data through TypeORM repositories idempotently', async () => {
        await seedOrdersData(dataSource);
        await seedOrdersData(dataSource);

        await expect(dataSource.getRepository(FuelOrderEntity).count()).resolves.toBe(3);
        await expect(dataSource.getRepository(FuelOrderStatusHistoryEntity).count()).resolves.toBe(6);

        const completedOrder = await dataSource
            .getRepository(FuelOrderEntity)
            .findOneByOrFail({ id: '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6' });

        expect(completedOrder).toMatchObject({
            airportIcaoCode: 'OMSJ',
            status: FuelOrderStatus.COMPLETED,
        });
        expect(Number(completedOrder.requestedFuelVolume)).toBe(3200);

        await expect(
            dataSource.getRepository(FuelOrderStatusHistoryEntity).countBy({
                fuelOrderId: '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
            })
        ).resolves.toBe(3);
    });
});
