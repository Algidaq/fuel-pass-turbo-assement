import { ORDER_PERMISSIONS } from '@fuel-pass/contracts/backend';
import { ApiResponse, BaseApiHeaders } from '@fuel-pass/node-commons';
import { FuelOrdersController } from '../../../src/orders/controllers/fuel-orders.controller';
import type { CreateFuelOrderService } from '../../../src/orders/services/create-fuel-order.service';
import type { GetFuelOrderService } from '../../../src/orders/services/get-fuel-order.service';
import type { ListFuelOrdersService } from '../../../src/orders/services/list-fuel-orders.service';
import type { UpdateFuelOrderStatusService } from '../../../src/orders/services/update-fuel-order-status.service';
import type { AuthenticatedRequest } from '../../../src/orders/types/auth-request.types';

const headers = new BaseApiHeaders();
const aircraftOperatorRoleKey = 'aircraft_operator';
const authRequest = {
    auth: {
        userId: 'user-1',
        sessionId: 'session-1',
        email: 'operator@fuelpass.test',
        roles: [aircraftOperatorRoleKey],
        permissions: [ORDER_PERMISSIONS.fuelOrderCreate.key],
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

function createController(overrides?: {
    createFuelOrderService?: Partial<CreateFuelOrderService>;
    listFuelOrdersService?: Partial<ListFuelOrdersService>;
    getFuelOrderService?: Partial<GetFuelOrderService>;
    updateFuelOrderStatusService?: Partial<UpdateFuelOrderStatusService>;
}): FuelOrdersController {
    return new FuelOrdersController(
        overrides?.createFuelOrderService as CreateFuelOrderService,
        overrides?.listFuelOrdersService as ListFuelOrdersService,
        overrides?.getFuelOrderService as GetFuelOrderService,
        overrides?.updateFuelOrderStatusService as UpdateFuelOrderStatusService
    );
}

describe('FuelOrdersController', () => {
    it('delegates create requests to the create endpoint service', async () => {
        const response = ApiResponse.builder().withSuccess({ status: 201, data: fuelOrder }).build();
        const createFuelOrder = jest.fn().mockResolvedValue(response);
        const controller = createController({ createFuelOrderService: { createFuelOrder } });
        const body = {
            tailNumber: 'A6-ABC',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '12000.50',
            deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
            deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
        };

        await expect(controller.createFuelOrder(body, authRequest, headers)).resolves.toBe(response);
        expect(createFuelOrder).toHaveBeenCalledWith({ headers, body, principal: authRequest.auth });
    });

    it('delegates list requests to the list endpoint service', async () => {
        const response = ApiResponse.builder()
            .withSuccess({ status: 200, data: { items: [], pagination: {} } })
            .build();
        const listFuelOrders = jest.fn().mockResolvedValue(response);
        const controller = createController({ listFuelOrdersService: { listFuelOrders } });
        const query = { airportIcaoCode: 'OMDB', status: 'PENDING' as const, page: 1, pageSize: 20 };

        await expect(controller.listFuelOrders(query, headers)).resolves.toBe(response);
        expect(listFuelOrders).toHaveBeenCalledWith({ headers, query });
    });

    it('delegates get requests to the get endpoint service', async () => {
        const response = ApiResponse.builder().withSuccess({ status: 200, data: fuelOrder }).build();
        const getFuelOrder = jest.fn().mockResolvedValue(response);
        const controller = createController({ getFuelOrderService: { getFuelOrder } });

        await expect(controller.getFuelOrderById(fuelOrder.id, headers)).resolves.toBe(response);
        expect(getFuelOrder).toHaveBeenCalledWith({ headers, id: fuelOrder.id });
    });

    it('delegates status updates to the update endpoint service', async () => {
        const response = ApiResponse.builder().withSuccess({ status: 200, data: fuelOrder }).build();
        const updateFuelOrderStatus = jest.fn().mockResolvedValue(response);
        const controller = createController({ updateFuelOrderStatusService: { updateFuelOrderStatus } });
        const body = { status: 'CONFIRMED' as const, note: 'Confirmed.' };

        await expect(controller.updateFuelOrderStatus(fuelOrder.id, body, authRequest, headers)).resolves.toBe(response);
        expect(updateFuelOrderStatus).toHaveBeenCalledWith({ headers, id: fuelOrder.id, body, principal: authRequest.auth });
    });
});
