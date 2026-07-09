import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
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

        logger.debug('Proxy target resolved', { data: { namespace, targetBaseUrl, path: request.url } });

        return targetBaseUrl;
    },
    on: {
        error: (error, request, response): void => {
            logger.error('Proxy request failed', { error, data: { path: request.url } });

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
        logger.warn('Malformed proxy route rejected', { data: { path: request.path, namespace, apiSegment } });

        response.status(404).json({
            success: false,
            errors: [{ code: 'PROXY.ROUTE_NOT_FOUND', message: 'Proxy route was not found.' }],
        });
        return;
    }

    if (resolveProxyService(namespace) === undefined) {
        logger.warn('Unknown proxy namespace rejected', { data: { path: request.path, namespace } });

        response.status(404).json({
            success: false,
            errors: [{ code: 'PROXY.UNKNOWN_NAMESPACE', message: 'Service namespace was not found.' }],
        });
        return;
    }

    next();
};
