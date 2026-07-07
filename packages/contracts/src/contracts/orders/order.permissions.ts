import { definePermissionCatalog } from '../permission-catalog.js';

export const ORDER_PERMISSIONS = definePermissionCatalog({
    fuelOrderCreate: {
        key: 'fuel_order:create',
        resource: 'fuel_order',
        action: 'create',
        description: 'Create fuel orders.',
    },
    fuelOrderReadOwn: {
        key: 'fuel_order:read_own',
        resource: 'fuel_order',
        action: 'read_own',
        description: 'Read own fuel orders.',
    },
    fuelOrderReadAll: {
        key: 'fuel_order:read_all',
        resource: 'fuel_order',
        action: 'read_all',
        description: 'Read all fuel orders.',
    },
    fuelOrderUpdateStatus: {
        key: 'fuel_order:update_status',
        resource: 'fuel_order',
        action: 'update_status',
        description: 'Update fuel order status.',
    },
    fuelOrderFilterByAirport: {
        key: 'fuel_order:filter_by_airport',
        resource: 'fuel_order',
        action: 'filter_by_airport',
        description: 'Filter fuel orders by airport.',
    },
});

export type OrderPermissionName = keyof typeof ORDER_PERMISSIONS;
export type OrderPermissionKey = (typeof ORDER_PERMISSIONS)[OrderPermissionName]['key'];
export const orderPermissionKeys: readonly OrderPermissionKey[] = Object.values(ORDER_PERMISSIONS).map(
    (permission): OrderPermissionKey => permission.key
);
