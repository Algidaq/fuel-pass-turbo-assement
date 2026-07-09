import { randomUUID } from 'node:crypto';
import { FuelOrderUserResDto, ORDER_PERMISSIONS } from '@fuel-pass/contracts/backend';
import { BaseApiHeaders, type AuthenticatedPrincipal } from '@fuel-pass/node-commons';
import type { DataSource, EntityManager } from 'typeorm';
import { FuelOrderEntity, FuelOrderStatus, FuelOrderStatusHistoryEntity, VolumeUnit } from '../../../src/orders/entities';
import { OrderException } from '../../../src/orders/orders.errors';
import type { FuelOrderRepository } from '../../../src/orders/repositories';
import { CreateFuelOrderService } from '../../../src/orders/services/create-fuel-order.service';
import { GetFuelOrderService } from '../../../src/orders/services/get-fuel-order.service';
import type { InternalAuthUsersService } from '../../../src/orders/services/internal-auth-users.service';
import { ListFuelOrdersService } from '../../../src/orders/services/list-fuel-orders.service';
import { UpdateFuelOrderStatusService } from '../../../src/orders/services/update-fuel-order-status.service';

const headers = new BaseApiHeaders();
const userId = randomUUID();
const aircraftOperatorRoleKey = 'aircraft_operator';
const adminRoleKey = 'admin';
const orderId = randomUUID();
const deliveryWindowStartAt = new Date('2026-07-10T08:00:00.000Z');
const deliveryWindowEndAt = new Date('2026-07-10T10:00:00.000Z');
const principal: AuthenticatedPrincipal = {
    userId,
    sessionId: randomUUID(),
    email: 'operator@fuelpass.test',
    roles: [aircraftOperatorRoleKey],
    permissions: [ORDER_PERMISSIONS.fuelOrderCreate.key, ORDER_PERMISSIONS.fuelOrderReadOwn.key],
    jti: randomUUID(),
};
const readAllPrincipal: AuthenticatedPrincipal = {
    userId: randomUUID(),
    sessionId: randomUUID(),
    email: 'admin@fuelpass.test',
    roles: [adminRoleKey],
    permissions: [ORDER_PERMISSIONS.fuelOrderReadAll.key],
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

function createLoggerMock(): { child: jest.Mock; info: jest.Mock; error: jest.Mock } {
    const logger = {
        child: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    };
    logger.child.mockReturnValue(logger);
    return logger;
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
    internalAuthUsersService: jest.Mocked<Pick<InternalAuthUsersService, 'lookupUsersByIds'>>;
    fuelOrderRepository: jest.Mocked<
        Pick<
            FuelOrderRepository,
            | 'createFuelOrder'
            | 'createStatusHistory'
            | 'countByStatus'
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
        countByStatus: jest.fn().mockResolvedValue({
            [FuelOrderStatus.PENDING]: 1,
            [FuelOrderStatus.CONFIRMED]: 2,
            [FuelOrderStatus.COMPLETED]: 3,
        }),
        findManyAndCount: jest.fn().mockResolvedValue([[createFuelOrder()], 1]),
        findById,
        findByIdOrThrow: jest.fn().mockResolvedValue(createFuelOrder()),
        findByIdWithStatusHistoryOrThrow: jest.fn().mockResolvedValue(createFuelOrder({ statusHistory: [createStatusHistory()] })),
        updateStatusIfCurrent: jest.fn().mockResolvedValue(overrides?.updateStatusIfCurrent ?? true),
    };
    const internalAuthUsersService = {
        lookupUsersByIds: jest.fn().mockResolvedValue(
            new Map([
                [
                    userId,
                    new FuelOrderUserResDto({
                        id: userId,
                        email: 'operator@fuelpass.test',
                        fullName: 'Aircraft Operator',
                    }),
                ],
            ])
        ),
    };
    const dataSource = {
        transaction: jest.fn((callback: (entityManager: EntityManager) => Promise<unknown>): Promise<unknown> => callback(manager)),
    };

    return {
        createService: new CreateFuelOrderService(
            fuelOrderRepository as never,
            dataSource as unknown as DataSource,
            createLoggerMock() as never
        ),
        listService: new ListFuelOrdersService(
            fuelOrderRepository as never,
            internalAuthUsersService as never,
            createLoggerMock() as never
        ),
        getService: new GetFuelOrderService(fuelOrderRepository as never, internalAuthUsersService as never, createLoggerMock() as never),
        updateService: new UpdateFuelOrderStatusService(
            fuelOrderRepository as never,
            dataSource as unknown as DataSource,
            createLoggerMock() as never
        ),
        internalAuthUsersService,
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
        const { listService, fuelOrderRepository, internalAuthUsersService } = createHarness();

        const response = await listService.listFuelOrders({
            headers,
            principal: readAllPrincipal,
            query: {
                airportIcaoCode: 'OMDB',
                status: 'PENDING',
                include_status: false,
                include_user: false,
                page: 2,
                pageSize: 10,
            },
        });

        expect(fuelOrderRepository.findManyAndCount).toHaveBeenCalledWith({
            airportIcaoCode: 'OMDB',
            submittedByUserId: undefined,
            status: FuelOrderStatus.PENDING,
            page: 2,
            pageSize: 10,
        });
        expect(fuelOrderRepository.countByStatus).not.toHaveBeenCalled();
        expect(internalAuthUsersService.lookupUsersByIds).not.toHaveBeenCalled();
        expect(response.data?.pagination).toMatchObject({
            page: 2,
            pageSize: 10,
            totalItems: 1,
            totalPages: 1,
        });
    });

    it('scopes list responses to the principal for read-own users', async () => {
        const { listService, fuelOrderRepository } = createHarness();

        await listService.listFuelOrders({
            headers,
            principal,
            query: {
                include_status: false,
                include_user: false,
                page: 1,
                pageSize: 20,
            },
        });

        expect(fuelOrderRepository.findManyAndCount).toHaveBeenCalledWith({
            airportIcaoCode: undefined,
            submittedByUserId: userId,
            status: undefined,
            page: 1,
            pageSize: 20,
        });
    });

    it('includes grouped status counts when requested', async () => {
        const { listService, fuelOrderRepository } = createHarness();

        const response = await listService.listFuelOrders({
            headers,
            principal,
            query: {
                airportIcaoCode: 'OMDB',
                include_status: true,
                include_user: false,
                page: 1,
                pageSize: 20,
            },
        });

        expect(fuelOrderRepository.countByStatus).toHaveBeenCalledWith({
            airportIcaoCode: 'OMDB',
            submittedByUserId: userId,
            status: undefined,
        });
        expect(response.data?.statusCounts).toMatchObject({
            [FuelOrderStatus.PENDING]: 1,
            [FuelOrderStatus.CONFIRMED]: 2,
            [FuelOrderStatus.COMPLETED]: 3,
        });
    });

    it('includes user details when requested for list responses', async () => {
        const { listService, internalAuthUsersService } = createHarness();

        const response = await listService.listFuelOrders({
            headers,
            principal: readAllPrincipal,
            query: {
                include_status: false,
                include_user: true,
                page: 1,
                pageSize: 20,
            },
        });

        expect(internalAuthUsersService.lookupUsersByIds).toHaveBeenCalledWith([userId]);
        expect(response.data?.items[0]?.submittedByUser).toMatchObject({
            id: userId,
            email: 'operator@fuelpass.test',
            fullName: 'Aircraft Operator',
        });
    });

    it('returns not found responses for missing orders', async () => {
        const { getService, fuelOrderRepository } = createHarness({ findById: null });
        fuelOrderRepository.findByIdOrThrow.mockRejectedValue(new OrderException(404, 'FuelOrderNotFound'));

        const response = await getService.getFuelOrder({ headers, id: orderId, principal });

        expect(response.success).toBe(false);
        expect(response.status).toBe(404);
        expect(response.errors[0]?.code).toEqual('ORDER.FUEL-ORDER-NOT-FOUND');
    });

    it('loads a fuel order without status history by default', async () => {
        const { getService, fuelOrderRepository, internalAuthUsersService } = createHarness();

        const response = await getService.getFuelOrder({ headers, id: orderId, principal });

        expect(fuelOrderRepository.findByIdOrThrow).toHaveBeenCalledWith(orderId);
        expect(fuelOrderRepository.findByIdWithStatusHistoryOrThrow).not.toHaveBeenCalled();
        expect(internalAuthUsersService.lookupUsersByIds).not.toHaveBeenCalled();
        expect(response.data?.statusHistory).toBeUndefined();
    });

    it('loads a fuel order with status history when requested', async () => {
        const { getService, fuelOrderRepository } = createHarness();

        const response = await getService.getFuelOrder({
            headers,
            id: orderId,
            principal,
            query: { include_status_history: true, include_user: false },
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

    it('returns not found when read-own users load another user order', async () => {
        const { getService, fuelOrderRepository } = createHarness();
        fuelOrderRepository.findByIdOrThrow.mockResolvedValue(createFuelOrder({ submittedByUserId: randomUUID() }));

        const response = await getService.getFuelOrder({ headers, id: orderId, principal });

        expect(response.success).toBe(false);
        expect(response.status).toBe(404);
        expect(response.errors[0]?.code).toEqual('ORDER.FUEL-ORDER-NOT-FOUND');
    });

    it('loads user details with status history when requested', async () => {
        const { getService, internalAuthUsersService } = createHarness();

        const response = await getService.getFuelOrder({
            headers,
            id: orderId,
            principal,
            query: { include_status_history: true, include_user: true },
        });

        expect(internalAuthUsersService.lookupUsersByIds).toHaveBeenCalledWith([userId]);
        expect(response.data?.submittedByUser).toMatchObject({
            id: userId,
            fullName: 'Aircraft Operator',
        });
        expect(response.data?.statusHistory?.[0]?.changedByUser).toMatchObject({
            id: userId,
            email: 'operator@fuelpass.test',
        });
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
