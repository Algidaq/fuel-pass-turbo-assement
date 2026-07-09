import type { DataSource, Repository } from 'typeorm';
import { FuelOrderEntity, FuelOrderStatus, FuelOrderStatusHistoryEntity, VolumeUnit } from '../orders/entities';
import dataSource from './data-source';

const seedFuelOrders = [
    {
        id: '8f4f3314-8971-4bfe-a8b4-7ec9cbd66f1f',
        tailNumber: 'N123FP',
        airportIcaoCode: 'OMDB',
        requestedFuelVolume: '1500.00',
        volumeUnit: VolumeUnit.LITERS,
        deliveryWindowStartAt: new Date('2026-07-07T10:00:00.000Z'),
        deliveryWindowEndAt: new Date('2026-07-07T12:00:00.000Z'),
        status: FuelOrderStatus.PENDING,
        submittedByUserId: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
        lastStatusChangedByUserId: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
    },
    {
        id: '6481e294-288e-4a2d-8df5-1cf285367a30',
        tailNumber: 'N456FP',
        airportIcaoCode: 'OMAA',
        requestedFuelVolume: '2400.00',
        volumeUnit: VolumeUnit.LITERS,
        deliveryWindowStartAt: new Date('2026-07-08T08:00:00.000Z'),
        deliveryWindowEndAt: new Date('2026-07-08T10:00:00.000Z'),
        status: FuelOrderStatus.CONFIRMED,
        submittedByUserId: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
        lastStatusChangedByUserId: '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
    },
    {
        id: '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
        tailNumber: 'N789FP',
        airportIcaoCode: 'OMSJ',
        requestedFuelVolume: '3200.00',
        volumeUnit: VolumeUnit.LITERS,
        deliveryWindowStartAt: new Date('2026-07-09T13:00:00.000Z'),
        deliveryWindowEndAt: new Date('2026-07-09T15:00:00.000Z'),
        status: FuelOrderStatus.COMPLETED,
        submittedByUserId: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
        lastStatusChangedByUserId: '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
    },
] as const;

const seedStatusHistory = [
    {
        id: '8d56c297-6f53-465c-b6ed-dff19e8498b8',
        fuelOrderId: '8f4f3314-8971-4bfe-a8b4-7ec9cbd66f1f',
        fromStatus: null,
        toStatus: FuelOrderStatus.PENDING,
        changedByUserId: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
        changedAt: new Date('2026-07-06T08:00:00.000Z'),
        note: 'Seed order submitted.',
    },
    {
        id: '546d3306-90ed-4d8c-b09d-4ce849144bcf',
        fuelOrderId: '6481e294-288e-4a2d-8df5-1cf285367a30',
        fromStatus: null,
        toStatus: FuelOrderStatus.PENDING,
        changedByUserId: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
        changedAt: new Date('2026-07-06T09:00:00.000Z'),
        note: 'Seed order submitted.',
    },
    {
        id: '8cfc7a3e-1123-42bf-805d-dfd8d99d0f46',
        fuelOrderId: '6481e294-288e-4a2d-8df5-1cf285367a30',
        fromStatus: FuelOrderStatus.PENDING,
        toStatus: FuelOrderStatus.CONFIRMED,
        changedByUserId: '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
        changedAt: new Date('2026-07-06T10:00:00.000Z'),
        note: 'Seed order confirmed.',
    },
    {
        id: '7d0f0d05-56cb-4d37-bda7-a86f244cf0d9',
        fuelOrderId: '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
        fromStatus: null,
        toStatus: FuelOrderStatus.PENDING,
        changedByUserId: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
        changedAt: new Date('2026-07-06T11:00:00.000Z'),
        note: 'Seed order submitted.',
    },
    {
        id: '977c80d0-35f1-4fa3-b211-3978cc86c561',
        fuelOrderId: '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
        fromStatus: FuelOrderStatus.PENDING,
        toStatus: FuelOrderStatus.CONFIRMED,
        changedByUserId: '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
        changedAt: new Date('2026-07-06T12:00:00.000Z'),
        note: 'Seed order confirmed.',
    },
    {
        id: '4ad79db8-c7cc-4514-94ef-5735f1899443',
        fuelOrderId: '42c5f1d8-88c3-4a09-aa5e-4f24d70c4cb6',
        fromStatus: FuelOrderStatus.CONFIRMED,
        toStatus: FuelOrderStatus.COMPLETED,
        changedByUserId: '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
        changedAt: new Date('2026-07-06T13:00:00.000Z'),
        note: 'Seed order completed.',
    },
] as const;

export async function seedOrdersData(seedDataSource: DataSource = dataSource): Promise<void> {
    const initializedDataSource = seedDataSource.isInitialized ? seedDataSource : await seedDataSource.initialize();

    await initializedDataSource.transaction(async (entityManager): Promise<void> => {
        const fuelOrderRepository = entityManager.getRepository(FuelOrderEntity);
        const statusHistoryRepository = entityManager.getRepository(FuelOrderStatusHistoryEntity);

        await seedFuelOrderRecords(fuelOrderRepository);
        await seedStatusHistoryRecords(statusHistoryRepository);
    });
}

async function seedFuelOrderRecords(fuelOrderRepository: Repository<FuelOrderEntity>): Promise<void> {
    for (const fuelOrderData of seedFuelOrders) {
        const fuelOrder = await fuelOrderRepository.findOne({ where: { id: fuelOrderData.id } });

        if (fuelOrder !== null) {
            continue;
        }

        await fuelOrderRepository.save(fuelOrderRepository.create(fuelOrderData));
    }
}

async function seedStatusHistoryRecords(statusHistoryRepository: Repository<FuelOrderStatusHistoryEntity>): Promise<void> {
    for (const statusHistoryData of seedStatusHistory) {
        const statusHistory = await statusHistoryRepository.findOne({ where: { id: statusHistoryData.id } });

        if (statusHistory !== null) {
            continue;
        }

        await statusHistoryRepository.save(statusHistoryRepository.create(statusHistoryData));
    }
}

async function runSeed(): Promise<void> {
    try {
        await seedOrdersData();
        console.log('Orders seed data applied successfully.');
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

if (require.main === module) {
    void runSeed().catch((error: unknown): void => {
        console.error('Failed to apply orders seed data.', error);
        process.exitCode = 1;
    });
}
