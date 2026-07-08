import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { ordersDatabaseEntities } from '../../../src/configs/typeorm.config';
import { FuelOrderEntity, FuelOrderStatus, FuelOrderStatusHistoryEntity, VolumeUnit } from '../../../src/orders/entities';
import { FuelOrderRepository } from '../../../src/orders/repositories';

describe('orders persistence with SQLite', () => {
    let dataSource: DataSource;
    let fuelOrderRepository: FuelOrderRepository;

    const deliveryWindowStartAt = new Date('2026-07-06T10:00:00.000Z');
    const deliveryWindowEndAt = new Date('2026-07-06T12:00:00.000Z');

    beforeEach(async () => {
        dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            entities: ordersDatabaseEntities,
            synchronize: true,
            dropSchema: true,
        }).initialize();

        fuelOrderRepository = new FuelOrderRepository(
            dataSource.getRepository(FuelOrderEntity),
            dataSource.getRepository(FuelOrderStatusHistoryEntity)
        );
    });

    afterEach(async () => {
        if (dataSource?.isInitialized === true) {
            await dataSource.destroy();
        }
    });

    it('creates a fuel order with default status and volume unit', async () => {
        const fuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
            submittedByUserId: randomUUID(),
        });

        expect(fuelOrder).toMatchObject({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            volumeUnit: VolumeUnit.LITERS,
            status: FuelOrderStatus.PENDING,
        });
        expect(fuelOrder.id).toEqual(expect.any(String));
        expect(fuelOrder.createdAt).toBeInstanceOf(Date);
        expect(fuelOrder.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects invalid airport ICAO codes at the database level', async () => {
        await expect(
            fuelOrderRepository.createFuelOrder({
                tailNumber: 'N123FP',
                airportIcaoCode: 'omdb',
                requestedFuelVolume: '1500.00',
                deliveryWindowStartAt,
                deliveryWindowEndAt,
            })
        ).rejects.toThrow();
    });

    it('rejects non-positive requested fuel volume at the database level', async () => {
        await expect(
            fuelOrderRepository.createFuelOrder({
                tailNumber: 'N123FP',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: '0.00',
                deliveryWindowStartAt,
                deliveryWindowEndAt,
            })
        ).rejects.toThrow();
    });

    it('lists orders filtered by airport ICAO code', async () => {
        await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });
        await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N456FP',
            airportIcaoCode: 'OMAA',
            requestedFuelVolume: '2000.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });

        const fuelOrders = await fuelOrderRepository.findMany({ airportIcaoCode: 'OMDB' });

        expect(fuelOrders).toHaveLength(1);
        expect(fuelOrders[0]).toMatchObject({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
        });
    });

    it('lists paginated orders filtered by status', async () => {
        const firstFuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });
        await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N456FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '2000.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });
        await fuelOrderRepository.updateStatus({
            fuelOrderId: firstFuelOrder.id,
            status: FuelOrderStatus.CONFIRMED,
        });

        const [fuelOrders, totalItems] = await fuelOrderRepository.findManyAndCount({
            airportIcaoCode: 'OMDB',
            status: FuelOrderStatus.PENDING,
            page: 1,
            pageSize: 1,
        });

        expect(totalItems).toBe(1);
        expect(fuelOrders).toHaveLength(1);
        expect(fuelOrders[0]).toMatchObject({
            tailNumber: 'N456FP',
            status: FuelOrderStatus.PENDING,
        });
    });

    it('lists orders filtered by submitting user', async () => {
        const submittedByUserId = randomUUID();
        await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
            submittedByUserId,
        });
        await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N456FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '2000.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
            submittedByUserId: randomUUID(),
        });

        const [fuelOrders, totalItems] = await fuelOrderRepository.findManyAndCount({
            submittedByUserId,
            page: 1,
            pageSize: 20,
        });

        expect(totalItems).toBe(1);
        expect(fuelOrders[0]).toMatchObject({
            tailNumber: 'N123FP',
            submittedByUserId,
        });
    });

    it('counts orders grouped by status with filters', async () => {
        const submittedByUserId = randomUUID();
        const pendingFuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
            submittedByUserId,
        });
        const confirmedFuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N456FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '2000.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
            submittedByUserId,
        });
        await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N789FP',
            airportIcaoCode: 'OMAA',
            requestedFuelVolume: '3000.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });
        await fuelOrderRepository.updateStatus({
            fuelOrderId: confirmedFuelOrder.id,
            status: FuelOrderStatus.CONFIRMED,
        });
        await fuelOrderRepository.updateStatus({
            fuelOrderId: pendingFuelOrder.id,
            status: FuelOrderStatus.COMPLETED,
        });

        const counts = await fuelOrderRepository.countByStatus({ airportIcaoCode: 'OMDB', submittedByUserId });

        expect(counts).toEqual({
            [FuelOrderStatus.PENDING]: 0,
            [FuelOrderStatus.CONFIRMED]: 1,
            [FuelOrderStatus.COMPLETED]: 1,
        });
    });

    it('inserts status history', async () => {
        const fuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });

        const history = await fuelOrderRepository.createStatusHistory({
            fuelOrderId: fuelOrder.id,
            fromStatus: null,
            toStatus: FuelOrderStatus.PENDING,
            changedByUserId: randomUUID(),
            note: 'Submitted',
        });

        expect(history).toMatchObject({
            fuelOrderId: fuelOrder.id,
            fromStatus: null,
            toStatus: FuelOrderStatus.PENDING,
            note: 'Submitted',
        });
        expect(history.changedAt).toBeInstanceOf(Date);
    });

    it('loads status history ordered by change time', async () => {
        const fuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });

        await fuelOrderRepository.createStatusHistory({
            fuelOrderId: fuelOrder.id,
            fromStatus: FuelOrderStatus.PENDING,
            toStatus: FuelOrderStatus.CONFIRMED,
            changedAt: new Date('2026-07-06T13:00:00.000Z'),
        });
        await fuelOrderRepository.createStatusHistory({
            fuelOrderId: fuelOrder.id,
            fromStatus: null,
            toStatus: FuelOrderStatus.PENDING,
            changedAt: new Date('2026-07-06T12:00:00.000Z'),
        });

        const fuelOrderWithHistory = await fuelOrderRepository.findByIdWithStatusHistoryOrThrow(fuelOrder.id);

        expect(fuelOrderWithHistory.statusHistory.map((history) => history.toStatus)).toEqual([
            FuelOrderStatus.PENDING,
            FuelOrderStatus.CONFIRMED,
        ]);
    });

    it('updates status and persists status history in a transaction', async () => {
        const userId = randomUUID();
        const fuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });

        await dataSource.transaction(async (manager): Promise<void> => {
            await fuelOrderRepository.updateStatus(
                {
                    fuelOrderId: fuelOrder.id,
                    status: FuelOrderStatus.CONFIRMED,
                    changedByUserId: userId,
                },
                manager
            );
            await fuelOrderRepository.createStatusHistory(
                {
                    fuelOrderId: fuelOrder.id,
                    fromStatus: FuelOrderStatus.PENDING,
                    toStatus: FuelOrderStatus.CONFIRMED,
                    changedByUserId: userId,
                },
                manager
            );
        });

        const updatedFuelOrder = await fuelOrderRepository.findById(fuelOrder.id);
        const history = await dataSource.getRepository(FuelOrderStatusHistoryEntity).findBy({ fuelOrderId: fuelOrder.id });

        expect(updatedFuelOrder).toMatchObject({
            status: FuelOrderStatus.CONFIRMED,
            lastStatusChangedByUserId: userId,
        });
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            fromStatus: FuelOrderStatus.PENDING,
            toStatus: FuelOrderStatus.CONFIRMED,
            changedByUserId: userId,
        });
    });

    it('updates status only when the current status still matches', async () => {
        const fuelOrder = await fuelOrderRepository.createFuelOrder({
            tailNumber: 'N123FP',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '1500.00',
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        });

        await expect(
            fuelOrderRepository.updateStatusIfCurrent({
                fuelOrderId: fuelOrder.id,
                currentStatus: FuelOrderStatus.CONFIRMED,
                status: FuelOrderStatus.COMPLETED,
            })
        ).resolves.toBe(false);

        await expect(
            fuelOrderRepository.updateStatusIfCurrent({
                fuelOrderId: fuelOrder.id,
                currentStatus: FuelOrderStatus.PENDING,
                status: FuelOrderStatus.CONFIRMED,
            })
        ).resolves.toBe(true);

        await expect(fuelOrderRepository.findById(fuelOrder.id)).resolves.toMatchObject({
            status: FuelOrderStatus.CONFIRMED,
        });
    });
});
