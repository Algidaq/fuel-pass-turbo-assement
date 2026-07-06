export interface CsStdError {
    code: string;
    message: string;
    description: string;
}

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

export function catalogKeys<const T extends Record<string, unknown>>(catalog: T): { readonly [K in keyof T]: K } {
    return Object.freeze(Object.fromEntries(Object.keys(catalog).map((key): [string, string] => [key, key]))) as {
        readonly [K in keyof T]: K;
    };
}
