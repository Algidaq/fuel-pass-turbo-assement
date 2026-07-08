import type { ProxyServiceConfig } from '../configs/app.config';
import { logger } from '../logger/logger';
import { getProxyConfig, getProxyServices } from '../utils/service-registry';

export type ServiceHealthResult = {
    namespace: string;
    healthy: boolean;
    status?: number;
    target: string;
};

export type ShallowHealth = {
    status: 'ok';
    uptimeSeconds: number;
    services: string[];
};

export type DeepHealth = {
    healthy: boolean;
    status: 'ok' | 'degraded';
    services: ServiceHealthResult[];
};

const buildHealthUrl = (service: ProxyServiceConfig): string => new URL(service.healthPath, service.targetBaseUrl).toString();

export class HealthService {
    private readonly startedAt = Date.now();

    public getShallowHealth(): ShallowHealth {
        return {
            status: 'ok',
            uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
            services: getProxyServices().map((service): string => service.namespace),
        };
    }

    public async getDeepHealth(): Promise<DeepHealth> {
        const config = getProxyConfig();
        const services = await Promise.all(
            config.services.map((service): Promise<ServiceHealthResult> => this.checkServiceHealth(service, config.healthTimeoutMs))
        );
        const healthy = services.every((service): boolean => service.healthy);

        logger.info('Deep health check completed', { healthy, services });

        return {
            healthy,
            status: healthy ? 'ok' : 'degraded',
            services,
        };
    }

    private async checkServiceHealth(service: ProxyServiceConfig, timeoutMs: number): Promise<ServiceHealthResult> {
        const target = buildHealthUrl(service);

        try {
            const response = await fetch(target, { signal: AbortSignal.timeout(timeoutMs) });
            const healthy = response.ok;

            logger.debug(
                'Service health check completed',
                {
                    namespace: service.namespace,
                    target,
                    status: response.status,
                    healthy,
                }
            );

            return {
                namespace: service.namespace,
                healthy,
                status: response.status,
                target,
            };
        } catch (error) {
            logger.warn('Service health check failed', { error, namespace: service.namespace, target });

            return {
                namespace: service.namespace,
                healthy: false,
                target,
            };
        }
    }
}

export const healthService = new HealthService();
