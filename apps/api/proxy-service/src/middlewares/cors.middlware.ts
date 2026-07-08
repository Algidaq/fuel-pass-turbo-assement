import cors, { type CorsOptions } from 'cors';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getNamespace, resolveProxyService } from '../utils/service-registry';

const corsForbiddenError = new Error('CORS origin is not allowed for this service.');

const createCorsOptions = (path: string): CorsOptions => ({
    credentials: true,
    origin: (origin, callback): void => {
        if (origin === undefined || origin.trim().length === 0) {
            callback(null, false);
            return;
        }

        const service = resolveProxyService(getNamespace(path));

        if (service === undefined || !service.allowedOrigins.includes(origin)) {
            callback(corsForbiddenError);
            return;
        }

        callback(null, origin);
    },
});

export const corsMiddleware: RequestHandler = (request: Request, response: Response, next: NextFunction): void => {
    cors(createCorsOptions(request.path))(request, response, (error: unknown): void => {
        if (error === corsForbiddenError) {
            response.status(403).json({
                success: false,
                errors: [{ code: 'PROXY.CORS_ORIGIN_FORBIDDEN', message: 'Origin is not allowed for this service.' }],
            });
            return;
        }

        if (error !== undefined) {
            next(error);
            return;
        }

        next();
    });
};
