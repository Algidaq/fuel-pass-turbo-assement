import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { logger } from '../logger/logger';
import { hasInternalPathSegment } from '../utils/service-registry';

export const internalRouteBlockMiddleware: RequestHandler = (
    request: Request,
    response: Response,
    next: NextFunction
): void => {
    if (hasInternalPathSegment(request.path)) {
        logger.warn('Internal route blocked', { path: request.path });

        response.status(403).json({
            success: false,
            errors: [{ code: 'PROXY.INTERNAL_ROUTE_FORBIDDEN', message: 'Internal routes are not available through the proxy.' }],
        });
        return;
    }

    next();
};
