import { HttpStatus } from '@nestjs/common';
import { ORDER_ERRORS, OrderFailure } from '../../../src/orders/orders.errors';
import { FuelOrdersController } from '../../../src/orders/controllers/fuel-orders.controller';
import type { FuelOrdersService } from '../../../src/orders/services/fuel-orders.service';
import type { AuthenticatedRequest } from '../../../src/orders/types/auth-request.types';

const authRequest = {
    auth: {
        userId: 'user-1',
        sessionId: 'session-1',
        email: 'operator@fuelpass.test',
        roles: ['aircraft_operator'],
        permissions: ['fuel_order:create'],
        jti: 'jti-1',
    },
} as AuthenticatedRequest;

const fuelOrder = {
    id: '8c2d1c4a-c42e-4e77-8ff1-6f76c473f6aa',
    tailNumber: 'A6-ABC',
    airportIcaoCode: 'OMDB',
    requestedFuelVolume: '12000.50',
    volumeUnit: 'LITERS' as const,
    deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
    deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
    status: 'PENDING' as const,
    createdAt: '2026-07-06T12:00:00.000Z',
    updatedAt: '2026-07-06T12:00:00.000Z',
};

function createController(fuelOrdersService: Partial<FuelOrdersService>): FuelOrdersController {
    return new FuelOrdersController(fuelOrdersService as FuelOrdersService);
}

describe('FuelOrdersController', () => {
    it('returns created fuel orders with 201 responses', async () => {
        const controller = createController({
            createFuelOrder: jest.fn().mockResolvedValue(fuelOrder),
        });

        const response = await controller.createFuelOrder(
            {
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: 12000.5,
                deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
            },
            authRequest
        );

        expect(response.success).toBe(true);
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.data).toEqual(fuelOrder);
    });

    it('maps invalid requests to 400 responses', async () => {
        const controller = createController({
            createFuelOrder: jest.fn().mockRejectedValue(new OrderFailure('InvalidRequest')),
        });

        const response = await controller.createFuelOrder({}, authRequest);

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.errors).toEqual([ORDER_ERRORS.InvalidRequest]);
    });

    it('maps missing orders to 404 responses', async () => {
        const controller = createController({
            getFuelOrderById: jest.fn().mockRejectedValue(new OrderFailure('FuelOrderNotFound')),
        });

        const response = await controller.getFuelOrderById(fuelOrder.id);

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
        expect(response.errors).toEqual([ORDER_ERRORS.FuelOrderNotFound]);
    });

    it('maps invalid transitions to 409 responses', async () => {
        const controller = createController({
            updateFuelOrderStatus: jest.fn().mockRejectedValue(new OrderFailure('InvalidStatusTransition')),
        });

        const response = await controller.updateFuelOrderStatus(fuelOrder.id, { status: 'COMPLETED' }, authRequest);

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.CONFLICT);
        expect(response.errors).toEqual([ORDER_ERRORS.InvalidStatusTransition]);
    });
});
