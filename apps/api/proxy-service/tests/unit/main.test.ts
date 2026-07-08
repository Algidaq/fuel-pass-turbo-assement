import express from 'express';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { AppRuntimeConfig } from '../../src/configs/app.config';
import { createServer } from '../../src/server/server';

type RunningServer = {
    close: () => Promise<void>;
    url: string;
};

type RequestRecord = {
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
    method: string;
    path: string;
    query: unknown;
};

const listen = async (application: express.Express): Promise<RunningServer> => {
    const server = await new Promise<http.Server>((resolve): void => {
        const runningServer = application.listen(0, (): void => resolve(runningServer));
    });
    const address = server.address() as AddressInfo;

    return {
        url: `http://127.0.0.1:${address.port}`,
        close: () =>
            new Promise((resolve, reject): void => {
                server.close((error): void => {
                    if (error !== undefined) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            }),
    };
};

const createTargetServer = async (
    namespace: string,
    onRequest?: (request: RequestRecord) => void,
    healthStatus: number = 200
): Promise<RunningServer> => {
    const application = express();
    application.use(express.json());

    application.get('/api/health', (_request, response): void => {
        response.status(healthStatus).json({ status: healthStatus < 400 ? 'ok' : 'down', service: namespace });
    });

    application.all('/api/*', (request, response): void => {
        const record: RequestRecord = {
            body: request.body,
            headers: request.headers,
            method: request.method,
            path: request.path,
            query: request.query,
        };
        onRequest?.(record);
        response.status(200).json(record);
    });

    return listen(application);
};

const createTestConfig = (authUrl: string, ordersUrl: string): AppRuntimeConfig => ({
    port: 0,
    healthTimeoutMs: 500,
    services: [
        {
            namespace: 'auth-service',
            targetBaseUrl: authUrl,
            allowedOrigins: ['http://web.local'],
            healthPath: '/api/health',
        },
        {
            namespace: 'orders-service',
            targetBaseUrl: ordersUrl,
            allowedOrigins: ['http://orders-web.local'],
            healthPath: '/api/health',
        },
    ],
});

describe('proxy-service', () => {
    let authTarget: RunningServer;
    let ordersTarget: RunningServer;
    let proxy: RunningServer;
    let records: RequestRecord[];

    beforeEach(async () => {
        records = [];
        authTarget = await createTargetServer('auth-service', (request): void => {
            records.push(request);
        });
        ordersTarget = await createTargetServer('orders-service', (request): void => {
            records.push(request);
        });
        proxy = await listen(createServer(createTestConfig(authTarget.url, ordersTarget.url)));
    });

    afterEach(async () => {
        await proxy.close();
        await ordersTarget.close();
        await authTarget.close();
    });

    it('returns shallow health without calling downstream services', async () => {
        const response = await fetch(`${proxy.url}/health`);
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload).toMatchObject({
            success: true,
            data: {
                status: 'ok',
                services: ['auth-service', 'orders-service'],
            },
        });
        expect(records).toHaveLength(0);
    });

    it('returns deep health when every downstream service is healthy', async () => {
        const response = await fetch(`${proxy.url}/health/deep`);
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.success).toBe(true);
        expect(payload.data.status).toBe('ok');
        expect(payload.data.services).toHaveLength(2);
    });

    it('returns degraded deep health when a downstream service fails', async () => {
        await proxy.close();
        await ordersTarget.close();
        ordersTarget = await createTargetServer('orders-service', undefined, 503);
        proxy = await listen(createServer(createTestConfig(authTarget.url, ordersTarget.url)));

        const response = await fetch(`${proxy.url}/health/deep`);
        const payload = await response.json();

        expect(response.status).toBe(503);
        expect(payload.success).toBe(false);
        expect(payload.data.status).toBe('degraded');
    });

    it('returns 404 for an unknown namespace', async () => {
        const response = await fetch(`${proxy.url}/unknown-service/api/v1/orders`);
        const payload = await response.json();

        expect(response.status).toBe(404);
        expect(payload.errors[0].code).toBe('PROXY.UNKNOWN_NAMESPACE');
    });

    it('returns 404 for malformed namespace paths', async () => {
        const response = await fetch(`${proxy.url}/orders-service/v1/orders`);
        const payload = await response.json();

        expect(response.status).toBe(404);
        expect(payload.errors[0].code).toBe('PROXY.ROUTE_NOT_FOUND');
    });

    it('blocks internal path segments before proxying', async () => {
        const response = await fetch(`${proxy.url}/auth-service/api/internal/auth`);
        const payload = await response.json();

        expect(response.status).toBe(403);
        expect(payload.errors[0].code).toBe('PROXY.INTERNAL_ROUTE_FORBIDDEN');
        expect(records).toHaveLength(0);
    });

    it('allows configured CORS origins for the selected namespace', async () => {
        const response = await fetch(`${proxy.url}/auth-service/api/v1/auth/me`, {
            headers: { Origin: 'http://web.local' },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('access-control-allow-origin')).toBe('http://web.local');
    });

    it('rejects CORS origins that are not configured for the selected namespace', async () => {
        const response = await fetch(`${proxy.url}/auth-service/api/v1/auth/me`, {
            headers: { Origin: 'http://orders-web.local' },
        });
        const payload = await response.json();

        expect(response.status).toBe(403);
        expect(payload.errors[0].code).toBe('PROXY.CORS_ORIGIN_FORBIDDEN');
    });

    it('handles allowed CORS preflight requests', async () => {
        const response = await fetch(`${proxy.url}/orders-service/api/v1/fuel-orders`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://orders-web.local',
                'Access-Control-Request-Headers': 'authorization,content-type',
            },
        });

        expect(response.status).toBe(204);
        expect(response.headers.get('access-control-allow-origin')).toBe('http://orders-web.local');
        expect(response.headers.get('access-control-allow-headers')).toBe('authorization,content-type');
    });

    it('strips the namespace and preserves the backend api path', async () => {
        const response = await fetch(`${proxy.url}/orders-service/api/v1/fuel-orders?include_status=true`);
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.path).toBe('/api/v1/fuel-orders');
        expect(payload.query).toEqual({ include_status: 'true' });
    });

    it('preserves request method, headers, query string, and JSON body', async () => {
        const response = await fetch(`${proxy.url}/orders-service/api/v1/fuel-orders/abc/status?audit=true`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Test-Header': 'forward-me',
            },
            body: JSON.stringify({ status: 'APPROVED' }),
        });
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload).toMatchObject({
            method: 'PATCH',
            path: '/api/v1/fuel-orders/abc/status',
            query: { audit: 'true' },
            body: { status: 'APPROVED' },
        });
        expect(payload.headers['x-test-header']).toBe('forward-me');
    });
});
