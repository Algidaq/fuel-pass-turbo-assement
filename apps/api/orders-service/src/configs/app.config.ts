import { getOsEnv } from '@fuel-pass/node-commons';

export type AppRuntimeConfig = {
    cors: {
        credentials: boolean;
        origin: string[] | true;
    };
    globalPrefix: string;
    port: number | string;
};

const defaultCorsOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

function getCorsOrigin(): string[] | true {
    const configuredOrigins = getOsEnv('CORS_ORIGINS');

    if (configuredOrigins === undefined || configuredOrigins.trim().length === 0) {
        return defaultCorsOrigins;
    }

    if (configuredOrigins.trim() === '*') {
        return true;
    }

    return configuredOrigins
        .split(',')
        .map((origin): string => origin.trim())
        .filter((origin): boolean => origin.length > 0);
}

export function getAppRuntimeConfig(): AppRuntimeConfig {
    return {
        cors: {
            credentials: true,
            origin: getCorsOrigin(),
        },
        globalPrefix: getOsEnv('GLOBAL_PREFIX', 'api') ?? 'api',
        port: getOsEnv('PORT', '3001') ?? '3001',
    };
}
