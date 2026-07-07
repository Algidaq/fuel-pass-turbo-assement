import {
    ACCESS_PERMISSIONS,
    ACCESS_ROLES,
    ROLE_PERMISSION_MATRIX,
    createFuelOrderReqDtoSchema,
    isPermissionKey,
    isRoleKey,
    listFuelOrdersQueryDtoSchema,
    ORDER_ERRORS,
    permissionKeys,
    roleKeys,
    updateFuelOrderStatusReqDtoSchema,
} from '../../src/contracts';
import { AUTH_ERRORS } from '../../src/contracts/users/auth';
import type { LoginRequestDto } from '../../src/contracts/users/auth';

describe('contracts', () => {
    it('exports auth contracts', () => {
        const request: LoginRequestDto = {
            email: 'manager@fuelpass.test',
            password: 'Password123!',
        };

        expect(request.email).toEqual('manager@fuelpass.test');
    });

    it('exports auth error catalog codes', () => {
        expect(AUTH_ERRORS.InvalidCredentials.code).toEqual('AUTH.INVALID-CREDENTIALS');
    });

    it('exports order error catalog codes', () => {
        expect(ORDER_ERRORS.FuelOrderNotFound.code).toEqual('ORDER.FUEL-ORDER-NOT-FOUND');
    });

    it('exports canonical access role and permission keys', () => {
        expect(ACCESS_ROLES.aircraftOperator.key).toEqual('aircraft_operator');
        expect(ACCESS_ROLES.operationsManager.key).toEqual('operations_manager');
        expect(ACCESS_ROLES.admin.key).toEqual('admin');
        expect(ACCESS_PERMISSIONS.fuelOrderCreate.key).toEqual('fuel_order:create');
        expect(ACCESS_PERMISSIONS.fuelOrderReadAll.key).toEqual('fuel_order:read_all');
    });

    it('validates access role and permission keys', () => {
        expect(isRoleKey(ACCESS_ROLES.admin.key)).toBe(true);
        expect(isRoleKey('unknown_role')).toBe(false);
        expect(isPermissionKey(ACCESS_PERMISSIONS.fuelOrderUpdateStatus.key)).toBe(true);
        expect(isPermissionKey('fuel_order:delete')).toBe(false);
    });

    it('maps roles only to declared permission keys', () => {
        const declaredRoleKeys = new Set(roleKeys);
        const declaredPermissionKeys = new Set(permissionKeys);

        for (const [roleKey, assignedPermissionKeys] of Object.entries(ROLE_PERMISSION_MATRIX)) {
            expect(declaredRoleKeys.has(roleKey)).toBe(true);
            expect(assignedPermissionKeys.every((permissionKey) => declaredPermissionKeys.has(permissionKey))).toBe(true);
        }
    });

    it('normalizes valid fuel order create requests', () => {
        const request = createFuelOrderReqDtoSchema.parse({
            tailNumber: ' a6-abc ',
            airportIcaoCode: ' omdb ',
            requestedFuelVolume: 12000.5,
            deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
            deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
        });

        expect(request).toMatchObject({
            tailNumber: 'A6-ABC',
            airportIcaoCode: 'OMDB',
            requestedFuelVolume: '12000.50',
        });
    });

    it('rejects invalid fuel order create requests', () => {
        expect(() =>
            createFuelOrderReqDtoSchema.parse({
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMD',
                requestedFuelVolume: 12000.5,
                deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
            })
        ).toThrow();
        expect(() =>
            createFuelOrderReqDtoSchema.parse({
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: 0,
                deliveryWindowStartAt: '2026-07-10T08:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T10:00:00.000Z',
            })
        ).toThrow();
        expect(() =>
            createFuelOrderReqDtoSchema.parse({
                tailNumber: 'A6-ABC',
                airportIcaoCode: 'OMDB',
                requestedFuelVolume: 12000.5,
                deliveryWindowStartAt: '2026-07-10T10:00:00.000Z',
                deliveryWindowEndAt: '2026-07-10T08:00:00.000Z',
            })
        ).toThrow();
    });

    it('normalizes list query defaults and filters', () => {
        expect(listFuelOrdersQueryDtoSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
        expect(
            listFuelOrdersQueryDtoSchema.parse({
                airportIcaoCode: ' omdb ',
                status: 'PENDING',
                page: '2',
                pageSize: '10',
            })
        ).toEqual({
            airportIcaoCode: 'OMDB',
            status: 'PENDING',
            page: 2,
            pageSize: 10,
        });
    });

    it('validates status update requests', () => {
        expect(updateFuelOrderStatusReqDtoSchema.parse({ status: 'CONFIRMED', note: '  ' })).toEqual({
            status: 'CONFIRMED',
            note: null,
        });
        expect(() => updateFuelOrderStatusReqDtoSchema.parse({ status: 'CANCELLED' })).toThrow();
    });
});
