import type { RouteInfo, Type } from '@nestjs/common/interfaces';
import type { CompressionOptions } from 'compression';
import type { HelmetOptions } from 'helmet';
import type { TPinoHttpMiddlewareOptions } from './pino-http.middleware';
import type { TReqLoggerMiddlewareOptions } from './request-logger.middleware';
import type { TReqTimeoutMiddlewareOptions } from './request-timeout.middleware';

export const CORE_MIDDLEWARE_MODULE_OPTIONS = Symbol('CORE_MIDDLEWARE_MODULE_OPTIONS');
export type TForRoutes = (string | Type<any> | RouteInfo)[];

export type TMiddlewareOptions<Options = unknown> = false | { options: Options; forRoutes: TForRoutes };

export type CoreMiddlewareModuleOptions = {
    compression?: TMiddlewareOptions<CompressionOptions>;
    noCache?: TMiddlewareOptions;
    pinoHttp?: TMiddlewareOptions<TPinoHttpMiddlewareOptions>;
    timeout?: TMiddlewareOptions<TReqTimeoutMiddlewareOptions>;
    reqLogger?: TMiddlewareOptions<TReqLoggerMiddlewareOptions>;
    security?: TMiddlewareOptions<HelmetOptions>;
};
