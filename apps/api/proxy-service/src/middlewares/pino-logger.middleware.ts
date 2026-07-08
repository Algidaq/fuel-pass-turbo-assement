import type { RequestHandler } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../logger/logger';

export const pinoLoggerMiddleware: RequestHandler = pinoHttp({
    logger,
    autoLogging: true,
    customProps: (request): Record<string, unknown> => ({
        namespace: request.url?.split('?')[0]?.split('/').filter(Boolean)[0],
    }),
});
