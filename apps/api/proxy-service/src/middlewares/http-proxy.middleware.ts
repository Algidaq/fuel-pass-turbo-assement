import { createProxyMiddleware } from 'http-proxy-middleware';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import http from 'node:http';
import { logger } from '../logger/logger';
import { getNamespace, getPathSegments, resolveProxyService, stripNamespace } from '../utils/service-registry';

const httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 56,
    maxFreeSockets: 32,
});

export const httpProxyMiddleware = createProxyMiddleware({
    agent: httpAgent,
    changeOrigin: true,
    logger,
    proxyTimeout: 30000,
    secure: false,
    target: 'http://127.0.0.1',
    timeout: 30000,
    pathRewrite: (path): string => stripNamespace(path),
    router: (request): string => {
        const namespace = getNamespace(request.url ?? '');
        const service = resolveProxyService(namespace);
        const targetBaseUrl = service?.targetBaseUrl ?? 'http://127.0.0.1';

        logger.debug({ namespace, targetBaseUrl, path: request.url }, 'Proxy target resolved');

        return targetBaseUrl;
    },
    on: {
        error: (error, request, response): void => {
            logger.error({ error, path: request.url }, 'Proxy request failed');

            if (response instanceof http.ServerResponse && !response.headersSent) {
                response.writeHead(502, { 'Content-Type': 'application/json' });
                response.end(
                    JSON.stringify({
                        success: false,
                        errors: [{ code: 'PROXY.BAD_GATEWAY', message: 'Unable to reach the target service.' }],
                    })
                );
            }
        },
    },
});

export const proxyGuardMiddleware: RequestHandler = (request: Request, response: Response, next: NextFunction): void => {
    const segments = getPathSegments(request.path);
    const [namespace, apiSegment] = segments;

    if (namespace === undefined || apiSegment !== 'api') {
        response.status(404).json({
            success: false,
            errors: [{ code: 'PROXY.ROUTE_NOT_FOUND', message: 'Proxy route was not found.' }],
        });
        return;
    }

    if (resolveProxyService(namespace) === undefined) {
        response.status(404).json({
            success: false,
            errors: [{ code: 'PROXY.UNKNOWN_NAMESPACE', message: 'Service namespace was not found.' }],
        });
        return;
    }

    next();
};
