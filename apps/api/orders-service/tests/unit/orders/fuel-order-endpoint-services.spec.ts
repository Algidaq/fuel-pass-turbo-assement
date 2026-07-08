import { randomUUID } from 'node:crypto';
import { ORDER_PERMISSIONS } from '@fuel-pass/contracts/backend';
import { BaseApiHeaders, type AuthenticatedPrincipal } from '@fuel-pass/node-commons';
import type { DataSource, EntityManager } from 'typeorm';
import { FuelOrderEntity, FuelOrderStatus, FuelOrderStatusHistoryEntity, VolumeUnit } from '../../../src/orders/entities';
import { OrderException } from '../../../src/orders/orders.errors';
import type { FuelOrderRepository } from '../../../src/orders/repositories';
import { CreateFuelOrderService } from '../../../src/orders/services/create-fuel-order.service';
import { GetFuelOrderService } from '../../../src/orders/services/get-fuel-order.service';
import { ListFuelOrdersService } from '../../../src/orders/services/list-fuel-orders.service';
import { UpdateFuelOrderStatusService } from '../../../src/orders/services/update-fuel-order-status.service';

const headers = new BaseApiHeaders();
const userId = randomUUID();
const aircraftOperatorRoleKey = 'aircraft_operator';
const orderId = randomUUID();
const deliveryWindowStartAt = new Date('2026-07-10T08:00:00.000Z');
const deliveryWindowEndAt = new Date('2026-07-10T10:00:00.000Z');
const principal: AuthenticatedPrincipal = {
    userId,
    sessionId: randomUUID(),
    email: 'operator@fuelpass.test',
    roles: [aircraftOperatorRoleKey],
    permissions: [ORDER_PERMISSIONS.fuelOrderCreate.key],
    jti: randomUUID(),
};

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

function createStatusHistory(overrides: Partial<FuelOrderStatusHistoryEntity> = {}): FuelOrderStatusHistoryEntity {
    return Object.assign(new FuelOrderStatusHistoryEntity(), {
        id: randomUUID(),
        fuelOrderId: orderId,
        fromStatus: null,
        toStatus: FuelOrderStatus.PENDING,
        changedByUserId: userId,
        changedAt: new Date('2026-07-06T12:00:00.000Z'),
        note: 'Submitted',
        ...overrides,
    });
}

function createHarness(overrides?: {
    findById?: FuelOrderEntity | null;
    findByIdSequence?: Array<FuelOrderEntity | null>;
    updateStatusIfCurrent?: boolean;
}): {
    createService: CreateFuelOrderService;
    listService: ListFuelOrdersService;
    getService: GetFuelOrderService;
    updateService: UpdateFuelOrderStatusService;
    fuelOrderRepository: jest.Mocked<
        Pick<
            FuelOrderRepository,
            | 'createFuelOrder'
            | 'createStatusHistory'
            | 'findManyAndCount'
            | 'findById'
            | 'findByIdOrThrow'
            | 'findByIdWithStatusHistoryOrThrow'
            | 'updateStatusIfCurrent'
        >
    >;
    manager: EntityManager;
} {
    const manager = {} as EntityManager;
    const findById = jest.fn();

    if (overrides?.findByIdSequence !== undefined) {
        for (const result of overrides.findByIdSequence) {
            findById.mockResolvedValueOnce(result);
        }
    }

    findById.mockResolvedValue(overrides !== undefined && 'findById' in overrides ? overrides.findById : createFuelOrder());

    const fuelOrderRepository = {
        createFuelOrder: jest.fn().mockResolvedValue(createFuelOrder()),
        createStatusHistory: jest.fn().mockResolvedValue({}),
        findManyAndCount: jest.fn().mockResolvedValue([[createFuelOrder()], 1]),
        findById,
        findByIdOrThrow: jest.fn().mockResolvedValue(createFuelOrder()),
        findByIdWithStatusHistoryOrThrow: jest.fn().mockResolvedValue(createFuelOrder({ statusHistory: [createStatusHistory()] })),
        updateStatusIfCurrent: jest.fn().mockResolvedValue(overrides?.updateStatusIfCurrent ?? true),
    };
    const dataSource = {
        transaction: jest.fn((callback: (entityManager: EntityManager) => Promise<unknown>): Promise<unknown> => callback(manager)),
    };

    return {
        createService: new CreateFuelOrderService(fuelOrderRepository as never, dataSource as unknown as DataSource),
        listService: new ListFuelOrdersService(fuelOrderRepository as never),
        getService: new GetFuelOrderService(fuelOrderRepository as never),
        updateService: new UpdateFuelOrderStatusService(fuelOrderRepository as never, dataSource as unknown as DataSource),
        fuelOrderRepository,
        manager,
    };
}

describe('fuel order endpoint services', () => {
    it('creates a pending fuel order and initial status history in a transaction', async () => {
        const { createService, fuelOrderRepository, manager } = createHarness();

        const response = await createService.createFuelOrder({
            headers,
            principal,
            body: {
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: '12000.50',
                deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
            },
        });

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
        expect(response.status).toBe(201);
        expect(response.data?.status).toBe(FuelOrderStatus.PENDING);
        expect(response.data?.requestedFuelVolume).toBe('12000.50');
    });

    it('lists paginated orders with normalized filters', async () => {
        const { listService, fuelOrderRepository } = createHarness();

        const response = await listService.listFuelOrders({
            headers,
            query: {
                airportIcaoCode: 'OMDB',
                status: 'PENDING',
                page: 2,
                pageSize: 10,
            },
        });

        expect(fuelOrderRepository.findManyAndCount).toHaveBeenCalledWith({
            airportIcaoCode: 'OMDB',
            status: FuelOrderStatus.PENDING,
            page: 2,
            pageSize: 10,
        });
        expect(response.data?.pagination).toMatchObject({
            page: 2,
            pageSize: 10,
            totalItems: 1,
            totalPages: 1,
        });
    });

    it('returns not found responses for missing orders', async () => {
        const { getService, fuelOrderRepository } = createHarness({ findById: null });
        fuelOrderRepository.findByIdOrThrow.mockRejectedValue(new OrderException(404, 'FuelOrderNotFound'));

        const response = await getService.getFuelOrder({ headers, id: orderId });

        expect(response.success).toBe(false);
        expect(response.status).toBe(404);
        expect(response.errors[0]?.code).toEqual('ORDER.FUEL-ORDER-NOT-FOUND');
    });

    it('loads a fuel order without status history by default', async () => {
        const { getService, fuelOrderRepository } = createHarness();

        const response = await getService.getFuelOrder({ headers, id: orderId });

        expect(fuelOrderRepository.findByIdOrThrow).toHaveBeenCalledWith(orderId);
        expect(fuelOrderRepository.findByIdWithStatusHistoryOrThrow).not.toHaveBeenCalled();
        expect(response.data?.statusHistory).toBeUndefined();
    });

    it('loads a fuel order with status history when requested', async () => {
        const { getService, fuelOrderRepository } = createHarness();

        const response = await getService.getFuelOrder({
            headers,
            id: orderId,
            query: { include_status_history: true },
        });

        expect(fuelOrderRepository.findByIdWithStatusHistoryOrThrow).toHaveBeenCalledWith(orderId);
        expect(fuelOrderRepository.findByIdOrThrow).not.toHaveBeenCalled();
        expect(response.data?.statusHistory).toEqual([
            expect.objectContaining({
                fromStatus: null,
                toStatus: FuelOrderStatus.PENDING,
                note: 'Submitted',
            }),
        ]);
    });

    it('updates status for valid transitions and writes history', async () => {
        const { updateService, fuelOrderRepository, manager } = createHarness({
            findByIdSequence: [createFuelOrder(), createFuelOrder({ status: FuelOrderStatus.CONFIRMED })],
        });

        const response = await updateService.updateFuelOrderStatus({
            headers,
            id: orderId,
            principal,
            body: {
                status: 'CONFIRMED',
                note: 'Fueling slot confirmed.',
            },
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
        expect(response.data?.status).toBe(FuelOrderStatus.CONFIRMED);
    });

    it('rejects invalid status transitions', async () => {
        const { updateService } = createHarness();

        const response = await updateService.updateFuelOrderStatus({
            headers,
            id: orderId,
            principal,
            body: { status: 'COMPLETED' },
        });

        expect(response.success).toBe(false);
        expect(response.status).toBe(409);
        expect(response.errors[0]?.code).toEqual('ORDER.INVALID-STATUS-TRANSITION');
    });

    it('does not duplicate history for same-status updates', async () => {
        const { updateService, fuelOrderRepository } = createHarness();

        const response = await updateService.updateFuelOrderStatus({
            headers,
            id: orderId,
            principal,
            body: { status: 'PENDING' },
        });

        expect(response.success).toBe(true);
        expect(fuelOrderRepository.updateStatusIfCurrent).not.toHaveBeenCalled();
        expect(fuelOrderRepository.createStatusHistory).not.toHaveBeenCalled();
    });
});
