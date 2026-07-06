import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import { FuelOrderEntity, FuelOrderStatus, VolumeUnit } from '../../../src/orders/entities';
import { OrderFailure } from '../../../src/orders/orders.errors';
import type { FuelOrderRepository } from '../../../src/orders/repositories';
import { FuelOrdersService } from '../../../src/orders/services/fuel-orders.service';

const userId = randomUUID();
const orderId = randomUUID();
const deliveryWindowStartAt = new Date('2026-07-10T08:00:00.000Z');
const deliveryWindowEndAt = new Date('2026-07-10T10:00:00.000Z');

function createFuelOrder(overrides: Partial<FuelOrderEntity> = {}): FuelOrderEntity {
    return Object.assign(new FuelOrderEntity(), {
        id: orderId,
        tailNumber: 'A6-ABC',
        airportIcaoCode: 'OMDB',
        requestedFuelVolume: '12000.50',
        volumeUnit: VolumeUnit.LITERS,
        deliveryWindowStartAt,
        deliveryWindowEndAt,
        status: FuelOrderStatus.PENDING,
        submittedByUserId: userId,
        lastStatusChangedByUserId: userId,
        createdAt: new Date('2026-07-06T12:00:00.000Z'),
        updatedAt: new Date('2026-07-06T12:00:00.000Z'),
        ...overrides,
    });
}

function createHarness(overrides?: {
    findById?: FuelOrderEntity | null;
    updateStatusIfCurrent?: boolean;
}): {
    service: FuelOrdersService;
    fuelOrderRepository: jest.Mocked<
        Pick<
            FuelOrderRepository,
            'createFuelOrder' | 'createStatusHistory' | 'findManyAndCount' | 'findById' | 'updateStatusIfCurrent'
        >
    >;
    manager: EntityManager;
} {
    const manager = {} as EntityManager;
    const fuelOrderRepository = {
        createFuelOrder: jest.fn().mockResolvedValue(createFuelOrder()),
        createStatusHistory: jest.fn().mockResolvedValue({}),
        findManyAndCount: jest.fn().mockResolvedValue([[createFuelOrder()], 1]),
        findById: jest.fn().mockResolvedValue(overrides !== undefined && 'findById' in overrides ? overrides.findById : createFuelOrder()),
        updateStatusIfCurrent: jest.fn().mockResolvedValue(overrides?.updateStatusIfCurrent ?? true),
    };
    const dataSource = {
        transaction: jest.fn((callback: (entityManager: EntityManager) => Promise<unknown>): Promise<unknown> => callback(manager)),
    };

    return {
        service: new FuelOrdersService(fuelOrderRepository as never, dataSource as unknown as DataSource),
        fuelOrderRepository,
        manager,
    };
}

describe('FuelOrdersService', () => {
    it('creates a normalized pending fuel order and initial status history in a transaction', async () => {
        const { service, fuelOrderRepository, manager } = createHarness();

        const response = await service.createFuelOrder(
            {
                tailNumber: ' a6-abc ',
                airportIcaoCode: ' omdb ',
                requestedFuelVolume: 12000.5,
                deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
            },
            userId
        );

        expect(fuelOrderRepository.createFuelOrder).toHaveBeenCalledWith(
            expect.objectContaining({
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: '12000.50',
                status: FuelOrderStatus.PENDING,
                volumeUnit: VolumeUnit.LITERS,
                submittedByUserId: userId,
            }),
            manager
        );
        expect(fuelOrderRepository.createStatusHistory).toHaveBeenCalledWith(
            expect.objectContaining({
                fuelOrderId: orderId,
                fromStatus: null,
                toStatus: FuelOrderStatus.PENDING,
                changedByUserId: userId,
            }),
            manager
        );
        expect(response.status).toBe(FuelOrderStatus.PENDING);
        expect(response.requestedFuelVolume).toBe('12000.50');
    });

    it('rejects invalid create requests', async () => {
        const { service } = createHarness();

        await expect(
            service.createFuelOrder({
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMD',
                requestedFuelVolume: 12000.5,
                deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
            })
        ).rejects.toEqual(new OrderFailure('InvalidRequest'));

        await expect(
            service.createFuelOrder({
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: 0,
                deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
            })
        ).rejects.toEqual(new OrderFailure('InvalidRequest'));

        await expect(
            service.createFuelOrder({
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: 12000.5,
                deliveryWindowStartAt: '2026-07-10T10:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T08:00:00.000Z',
            })
        ).rejects.toEqual(new OrderFailure('InvalidRequest'));
    });

    it('lists paginated orders with normalized filters', async () => {
        const { service, fuelOrderRepository } = createHarness();

        const response = await service.listFuelOrders({
            airportIcaoCode: ' omdb ',
            status: 'PENDING',
            page: '2',
            pageSize: '10',
        });

        expect(fuelOrderRepository.findManyAndCount).toHaveBeenCalledWith({
            airportIcaoCode: 'OMDB',
            status: FuelOrderStatus.PENDING,
            page: 2,
            pageSize: 10,
        });
        expect(response.pagination).toEqual({
            page: 2,
            pageSize: 10,
            totalItems: 1,
            totalPages: 1,
        });
    });

    it('returns not found for missing orders', async () => {
        const { service } = createHarness({ findById: null });

        await expect(service.getFuelOrderById(orderId)).rejects.toEqual(new OrderFailure('FuelOrderNotFound'));
    });

    it('updates status for valid transitions and writes history', async () => {
        const { service, fuelOrderRepository, manager } = createHarness();

        const response = await service.updateFuelOrderStatus({
            id: orderId,
            body: {
                status: 'CONFIRMED',
                note: 'Fueling slot confirmed.',
            },
            userId,
        });

        expect(fuelOrderRepository.updateStatusIfCurrent).toHaveBeenCalledWith(
            {
                fuelOrderId: orderId,
                currentStatus: FuelOrderStatus.PENDING,
                status: FuelOrderStatus.CONFIRMED,
                changedByUserId: userId,
            },
            manager
        );
        expect(fuelOrderRepository.createStatusHistory).toHaveBeenCalledWith(
            expect.objectContaining({
                fromStatus: FuelOrderStatus.PENDING,
                toStatus: FuelOrderStatus.CONFIRMED,
                note: 'Fueling slot confirmed.',
            }),
            manager
        );
        expect(response.id).toBe(orderId);
    });

    it('rejects invalid status transitions', async () => {
        const { service } = createHarness();

        await expect(
            service.updateFuelOrderStatus({
                id: orderId,
                body: { status: 'COMPLETED' },
                userId,
            })
        ).rejects.toEqual(new OrderFailure('InvalidStatusTransition'));
    });

    it('does not duplicate history for same-status updates', async () => {
        const { service, fuelOrderRepository } = createHarness();

        await service.updateFuelOrderStatus({
            id: orderId,
            body: { status: 'PENDING' },
            userId,
        });

        expect(fuelOrderRepository.updateStatusIfCurrent).not.toHaveBeenCalled();
        expect(fuelOrderRepository.createStatusHistory).not.toHaveBeenCalled();
    });
});
