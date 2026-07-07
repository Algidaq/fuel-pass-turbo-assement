export interface AccessRoleDefinition {
    key: string;
    name: string;
    description?: string;
}

export interface AccessPermissionDefinition {
    key: string;
    resource: string;
    action: string;
    description?: string;
}

export interface AccessCatalog<
    Roles extends Record<string, AccessRoleDefinition>,
    Permissions extends Record<string, AccessPermissionDefinition>,
    RolePermissions extends Partial<Record<keyof Roles, readonly (keyof Permissions)[]>>
> {
    roles: Roles;
    permissions: Permissions;
    rolePermissions: RolePermissions;
}

export function defineAccessCatalog<
    const Roles extends Record<string, AccessRoleDefinition>,
    const Permissions extends Record<string, AccessPermissionDefinition>,
    const RolePermissions extends Partial<Record<keyof Roles, readonly (keyof Permissions)[]>>
>(catalog: AccessCatalog<Roles, Permissions, RolePermissions>): AccessCatalog<Roles, Permissions, RolePermissions> {
    return catalog;
}

export const ACCESS_CATALOG = defineAccessCatalog({
    roles: {
        aircraftOperator: {
            key: 'aircraft_operator',
            name: 'Aircraft Operator',
            description: 'Can create and manage own fuel order activity.',
        },
        operationsManager: {
            key: 'operations_manager',
            name: 'Operations Manager',
            description: 'Can manage operational fuel order workflows.',
        },
        admin: {
            key: 'admin',
            name: 'Admin',
            description: 'Can administer auth roles and permissions.',
        },
    },
    permissions: {
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
    },
    rolePermissions: {
        aircraftOperator: ['fuelOrderCreate', 'fuelOrderReadOwn'],
        operationsManager: ['fuelOrderReadAll', 'fuelOrderUpdateStatus', 'fuelOrderFilterByAirport'],
        admin: ['fuelOrderCreate', 'fuelOrderReadOwn', 'fuelOrderReadAll', 'fuelOrderUpdateStatus', 'fuelOrderFilterByAirport'],
    },
});

export const ACCESS_ROLES = ACCESS_CATALOG.roles;
export const ACCESS_PERMISSIONS = ACCESS_CATALOG.permissions;

export type AccessRoleName = keyof typeof ACCESS_ROLES;
export type AccessPermissionName = keyof typeof ACCESS_PERMISSIONS;
export type RoleKey = (typeof ACCESS_ROLES)[AccessRoleName]['key'];
export type PermissionKey = (typeof ACCESS_PERMISSIONS)[AccessPermissionName]['key'];

export const roleKeys: readonly RoleKey[] = Object.values(ACCESS_ROLES).map((role): RoleKey => role.key);
export const permissionKeys: readonly PermissionKey[] = Object.values(ACCESS_PERMISSIONS).map(
    (permission): PermissionKey => permission.key
);

export const ROLE_PERMISSION_MATRIX = {
    [ACCESS_ROLES.aircraftOperator.key]: [ACCESS_PERMISSIONS.fuelOrderCreate.key, ACCESS_PERMISSIONS.fuelOrderReadOwn.key],
    [ACCESS_ROLES.operationsManager.key]: [
        ACCESS_PERMISSIONS.fuelOrderReadAll.key,
        ACCESS_PERMISSIONS.fuelOrderUpdateStatus.key,
        ACCESS_PERMISSIONS.fuelOrderFilterByAirport.key,
    ],
    [ACCESS_ROLES.admin.key]: [
        ACCESS_PERMISSIONS.fuelOrderCreate.key,
        ACCESS_PERMISSIONS.fuelOrderReadOwn.key,
        ACCESS_PERMISSIONS.fuelOrderReadAll.key,
        ACCESS_PERMISSIONS.fuelOrderUpdateStatus.key,
        ACCESS_PERMISSIONS.fuelOrderFilterByAirport.key,
    ],
} as const satisfies Record<RoleKey, readonly PermissionKey[]>;

const roleKeySet: ReadonlySet<string> = new Set(roleKeys);
const permissionKeySet: ReadonlySet<string> = new Set(permissionKeys);

export function isRoleKey(value: string): value is RoleKey {
    return roleKeySet.has(value);
}

export function isPermissionKey(value: string): value is PermissionKey {
    return permissionKeySet.has(value);
}
