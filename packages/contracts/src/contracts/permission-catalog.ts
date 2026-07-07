export interface PermissionDefinition {
    key: string;
    resource: string;
    action: string;
    description?: string;
}

export type PermissionCatalog = Record<string, PermissionDefinition>;

export function definePermissionCatalog<const T extends PermissionCatalog>(catalog: T): T {
    return catalog;
}
