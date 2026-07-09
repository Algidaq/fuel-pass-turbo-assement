import type { AppRuntimeConfig, ProxyServiceConfig } from '../configs/app.config';

let proxyConfig: AppRuntimeConfig | undefined;
let proxyServiceMap: Map<string, ProxyServiceConfig> | undefined;

export const registerProxyServices = (config: AppRuntimeConfig): void => {
    proxyConfig = config;
    proxyServiceMap = new Map(config.services.map((service): [string, ProxyServiceConfig] => [service.namespace, service]));
};

export const getProxyConfig = (): AppRuntimeConfig => {
    if (proxyConfig === undefined) {
        throw new Error('Proxy config was not registered.');
    }

    return proxyConfig;
};

export const getProxyServices = (): ProxyServiceConfig[] => getProxyConfig().services;

export const getPathSegments = (path: string): string[] => path.split('?')[0]?.split('/').filter(Boolean) ?? [];

export const getNamespace = (path: string): string | undefined => getPathSegments(path)[0];

export const resolveProxyService = (namespace: string | undefined): ProxyServiceConfig | undefined => {
    if (namespace === undefined) {
        return undefined;
    }

    if (proxyServiceMap === undefined) {
        throw new Error('Proxy services were not registered.');
    }

    return proxyServiceMap.get(namespace);
};

export const hasInternalPathSegment = (path: string): boolean =>
    getPathSegments(path).some((segment): boolean => segment.toLowerCase() === 'internal');

export const stripNamespace = (path: string): string => {
    const [, , ...rest] = path.split('/');

    return `/${rest.join('/')}`;
};
