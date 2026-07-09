import { getOsEnv, getOsEnvNumber } from '@fuel-pass/node-commons';

export interface OrdersAuthRuntimeConfig {
    internalAuthBaseUrl: string;
    internalServiceApiKey: string;
    introspectionTimeoutMs: number;
}

function getStringEnv(key: string, fallback: string): string {
    return getOsEnv(key, fallback) ?? fallback;
}

export function getAuthRuntimeConfig(): OrdersAuthRuntimeConfig {
    return {
        internalAuthBaseUrl: getStringEnv('AUTH_INTERNAL_BASE_URL', 'http://localhost:3000/api/internal/auth'),
        internalServiceApiKey: getStringEnv('INTERNAL_SERVICE_API_KEY', ''),
        introspectionTimeoutMs: getOsEnvNumber('AUTH_INTROSPECTION_TIMEOUT_MS', 3000),
    };
}
