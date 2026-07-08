import { getOsEnv, getOsEnvNumber } from '@fuel-pass/node-commons';
import z from 'zod';

const defaultAllowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

const proxyServiceConfigSchema = z.object({
    namespace: z.string().min(1),
    targetBaseUrl: z.string().url(),
    allowedOrigins: z.array(z.string()).default(defaultAllowedOrigins),
    healthPath: z.string().startsWith('/').default('/api/health'),
});

const appConfigSchema = z.object({
    port: z.number().int().positive(),
    healthTimeoutMs: z.number().int().positive(),
    logLevel: z.string().min(1),
    logPretty: z.boolean(),
    services: z.array(proxyServiceConfigSchema).min(1),
});

export type ProxyServiceConfig = z.infer<typeof proxyServiceConfigSchema>;

export type AppRuntimeConfig = z.infer<typeof appConfigSchema>;

const parseCsv = (value: string | undefined, fallback: string[]): string[] => {
    if (value === undefined || value.trim().length === 0) {
        return fallback;
    }

    return value
        .split(',')
        .map((item): string => item.trim())
        .filter((item): boolean => item.length > 0);
};

const getDefaultServices = (): ProxyServiceConfig[] => [
    {
        namespace: 'auth-service',
        targetBaseUrl: getOsEnv('AUTH_SERVICE_URL', 'http://localhost:3000') ?? 'http://localhost:3000',
        allowedOrigins: parseCsv(getOsEnv('AUTH_SERVICE_ALLOWED_ORIGINS'), defaultAllowedOrigins),
        healthPath: getOsEnv('AUTH_SERVICE_HEALTH_PATH', '/api/health') ?? '/api/health',
    },
    {
        namespace: 'orders-service',
        targetBaseUrl: getOsEnv('ORDERS_SERVICE_URL', 'http://localhost:3001') ?? 'http://localhost:3001',
        allowedOrigins: parseCsv(getOsEnv('ORDERS_SERVICE_ALLOWED_ORIGINS'), defaultAllowedOrigins),
        healthPath: getOsEnv('ORDERS_SERVICE_HEALTH_PATH', '/api/health') ?? '/api/health',
    },
];

const getConfiguredServices = (): ProxyServiceConfig[] => {
    const rawServices = getOsEnv('PROXY_SERVICES');

    if (rawServices === undefined || rawServices.trim().length === 0) {
        return getDefaultServices();
    }

    return z.array(proxyServiceConfigSchema).parse(JSON.parse(rawServices));
};

export function getAppRuntimeConfig(): AppRuntimeConfig {
    const nodeEnv = getOsEnv('NODE_ENV');

    return appConfigSchema.parse({
        port: getOsEnvNumber('PORT', 3100),
        healthTimeoutMs: getOsEnvNumber('HEALTH_TIMEOUT_MS', 2000),
        logLevel: getOsEnv('LOG_LEVEL', nodeEnv === 'test' ? 'silent' : 'info') ?? 'info',
        logPretty: nodeEnv === 'development',
        services: getConfiguredServices(),
    });
}
