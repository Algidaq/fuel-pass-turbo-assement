import express from 'express';
import type { AppRuntimeConfig } from '../configs/app.config';
import { corsMiddleware } from '../middlewares/cors.middlware';
import { errorHandlerMiddleware } from '../middlewares/error-handler.middleware';
import { httpProxyMiddleware, proxyGuardMiddleware } from '../middlewares/http-proxy.middleware';
import { internalRouteBlockMiddleware } from '../middlewares/internal-route.middleware';
import { pinoLoggerMiddleware } from '../middlewares/pino-logger.middleware';
import { healthRouter } from '../routes/health.routes';
import { registerProxyServices } from '../utils/service-registry';

export const createServer = (config: AppRuntimeConfig): express.Express => {
    const application = express();

    application.disable('x-powered-by');
    registerProxyServices(config);

    application.use(pinoLoggerMiddleware);
    application.use(healthRouter);
    application.use(internalRouteBlockMiddleware);
    application.use(corsMiddleware);
    application.use(proxyGuardMiddleware);
    application.use(httpProxyMiddleware);
    application.use(errorHandlerMiddleware);

    return application;
};
