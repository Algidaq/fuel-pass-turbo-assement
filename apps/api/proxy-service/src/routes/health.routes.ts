import { Router, type Request, type Response } from 'express';
import { healthService } from '../services/health.service';

export const healthRouter = Router();

healthRouter.get('/health', (_request: Request, response: Response): void => {
    response.status(200).json({
        success: true,
        data: healthService.getShallowHealth(),
    });
});

healthRouter.get('/health/deep', async (_request: Request, response: Response): Promise<void> => {
    const health = await healthService.getDeepHealth();

    response.status(health.healthy ? 200 : 503).json({
        success: health.healthy,
        data: {
            status: health.status,
            services: health.services,
        },
    });
});
