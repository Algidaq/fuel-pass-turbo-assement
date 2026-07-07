export interface ErrorDefinition {
    code: string;
    message: string;
    description?: string;
}

export type ErrorDefinitionValue = ErrorDefinition | readonly ErrorDefinition[];

export type ErrorCatalog = Record<string, ErrorDefinitionValue>;

export function defineErrorCatalog<const T extends ErrorCatalog>(catalog: T): T {
    return catalog;
}
