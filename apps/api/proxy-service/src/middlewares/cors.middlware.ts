import cors from 'cors';
import type { Request, RequestHandler } from 'express';
import { getNamespace, resolveProxyService } from '../utils/service-registry';

const corsDelegate: cors.CorsOptionsDelegate<Request> = (req, callback): void => {
    const service = resolveProxyService(getNamespace(req.path));
    if (service === undefined) {
        return callback(new Error('CORS configuration error: service not found'), {});
    }

    return callback(null, {
        origin: service.allowedOrigins,
        preflightContinue: true,
        credentials: true,
        exposedHeaders: service.exposeHeaders,
        optionsSuccessStatus: 200,
        methods: service.allowedMethods,
    });
};

export const corsMiddleware: RequestHandler = cors(corsDelegate);
