import { getAppRuntimeConfig } from '../../../src/configs/app.config';

const managedEnvKeys = [
    'PORT',
    'NODE_ENV',
    'LOG_LEVEL',
    'HEALTH_TIMEOUT_MS',
    'AUTH_SERVICE_URL',
    'AUTH_SERVICE_ALLOWED_ORIGINS',
    'AUTH_SERVICE_HEALTH_PATH',
    'ORDERS_SERVICE_URL',
    'ORDERS_SERVICE_ALLOWED_ORIGINS',
    'ORDERS_SERVICE_HEALTH_PATH',
    'PROXY_SERVICES',
];

const originalEnv = { ...process.env };

const clearManagedEnv = (): void => {
    for (const key of managedEnvKeys) {
        delete process.env[key];
    }
};

describe('getAppRuntimeConfig', () => {
    beforeEach(() => {
        process.env = { ...originalEnv };
        clearManagedEnv();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('loads default proxy configuration when env values are missing', () => {
        const config = getAppRuntimeConfig();

        expect(config).toEqual({
            port: 3100,
            healthTimeoutMs: 2000,
            logLevel: 'info',
            services: [
                {
                    namespace: 'auth-service',
                    targetBaseUrl: 'http://localhost:3000',
                    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
                    healthPath: '/api/health',
                },
                {
                    namespace: 'orders-service',
                    targetBaseUrl: 'http://localhost:3001',
                    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
                    healthPath: '/api/health',
                },
            ],
        });
    });

    it('loads service URLs, CORS origins, health paths, port, and timeout from env values', () => {
        process.env.PORT = '4100';
        process.env.LOG_LEVEL = 'debug';
        process.env.HEALTH_TIMEOUT_MS = '750';
        process.env.AUTH_SERVICE_URL = 'http://auth.test:3000';
        process.env.AUTH_SERVICE_ALLOWED_ORIGINS = 'http://web.test, http://admin.test';
        process.env.AUTH_SERVICE_HEALTH_PATH = '/status';
        process.env.ORDERS_SERVICE_URL = 'http://orders.test:3001';
        process.env.ORDERS_SERVICE_ALLOWED_ORIGINS = 'http://orders-web.test';
        process.env.ORDERS_SERVICE_HEALTH_PATH = '/ready';

        const config = getAppRuntimeConfig();

        expect(config).toEqual({
            port: 4100,
            healthTimeoutMs: 750,
            logLevel: 'debug',
            services: [
                {
                    namespace: 'auth-service',
                    targetBaseUrl: 'http://auth.test:3000',
                    allowedOrigins: ['http://web.test', 'http://admin.test'],
                    healthPath: '/status',
                },
                {
                    namespace: 'orders-service',
                    targetBaseUrl: 'http://orders.test:3001',
                    allowedOrigins: ['http://orders-web.test'],
                    healthPath: '/ready',
                },
            ],
        });
    });

    it('loads full service registry from PROXY_SERVICES when provided', () => {
        process.env.PORT = '5100';
        process.env.NODE_ENV = 'test';
        process.env.HEALTH_TIMEOUT_MS = '300';
        process.env.PROXY_SERVICES = JSON.stringify([
            {
                namespace: 'custom-service',
                targetBaseUrl: 'http://custom.test:3010',
                allowedOrigins: ['http://custom-web.test'],
                healthPath: '/api/live',
            },
        ]);

        const config = getAppRuntimeConfig();

        expect(config).toEqual({
            port: 5100,
            healthTimeoutMs: 300,
            logLevel: 'silent',
            services: [
                {
                    namespace: 'custom-service',
                    targetBaseUrl: 'http://custom.test:3010',
                    allowedOrigins: ['http://custom-web.test'],
                    healthPath: '/api/live',
                },
            ],
        });
    });
});
