import { Injectable } from '@nestjs/common';
import { CsStdError, ErrorCatalog, ErrorDefinition } from './standard-error.types';

export interface StandardErrorOptions {
    prefix?: string;
}

export const STANDARD_ERROR_OPTIONS = Symbol('STANDARD_ERROR_OPTIONS');

@Injectable()
export class StandardErrorRegistry {
    private readonly mappings = new Map<string, readonly ErrorDefinition[]>();

    public register(namespace: string, catalog: ErrorCatalog): void {
        for (const [key, value] of Object.entries(catalog)) {
            const registryKey = this.buildRegistryKey(namespace, key);

            if (this.mappings.has(registryKey)) {
                throw new Error(`Duplicate error mapping registered: ${registryKey}`);
            }

            const definitions = Array.isArray(value) ? value : [value];

            this.mappings.set(registryKey, definitions);
        }
    }

    public resolve(namespace: string, errorKey: string, errorObj?: unknown): CsStdError | CsStdError[] {
        const registryKey = this.buildRegistryKey(namespace, errorKey);
        const mappings = this.mappings.get(registryKey);

        if (mappings === undefined) {
            return this.normalize(errorKey, undefined, errorObj);
        }

        const errors = mappings.map((item): CsStdError => this.normalize(errorKey, item, errorObj));

        return errors.length === 1 && errors[0] ? errors[0] : errors;
    }

    private buildRegistryKey(namespace: string, errorKey: string): string {
        return `${namespace}.${errorKey}`;
    }

    private normalize(errorKey: string, definition?: ErrorDefinition, errorObj?: unknown): CsStdError {
        const fallback = this.toStringRecord(errorObj);

        const code = definition?.code ?? fallback?.['code'] ?? 'UNKNOWN';
        const message = definition?.message ?? fallback?.['message'] ?? errorKey;
        const description = definition?.description ?? fallback?.['description'] ?? message;

        return {
            code,
            message,
            description,
        };
    }

    private toStringRecord(value: unknown): Record<string, string> | undefined {
        if (!value || typeof value !== 'object') {
            return undefined;
        }

        const result: Record<string, string> = {};

        for (const [key, propertyValue] of Object.entries(value)) {
            if (typeof propertyValue === 'string') {
                result[key] = propertyValue;
            }
        }

        return result;
    }
}
