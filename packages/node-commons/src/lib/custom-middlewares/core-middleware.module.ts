import { DynamicModule, Inject, MiddlewareConsumer, Module, NestModule, RequestMethod, type Type } from '@nestjs/common';
import { CompressionMiddleware, DEFAULT_COMPRESSION_OPTIONS } from './compression.middleware';
import { CORE_MIDDLEWARE_MODULE_OPTIONS, CoreMiddlewareModuleOptions } from './core-middleware.module.options';
import { NoCacheMiddleware } from './no-cache.middleware';
import { PinoHttpMiddleware } from './pino-http.middleware';
import { RequestLoggerMiddleware } from './request-logger.middleware';
import { DEFAULT_REQ_TIMEOUT_OPTIONS, RequestTimeoutMiddleware } from './request-timeout.middleware';
import { DEFAULT_HELMET_SECURITY_OPTIONS, SecurityMiddleware } from './security.middleware';

const forRoutes = [
    { method: RequestMethod.ALL, path: '' },
    { method: RequestMethod.ALL, path: '/' },
    { method: RequestMethod.ALL, path: '/*path' },
];

export const DEFAULT_CORE_MIDDLEWARE_MODULE_OPTIONS: CoreMiddlewareModuleOptions = {
    compression: { options: DEFAULT_COMPRESSION_OPTIONS, forRoutes },
    noCache: false,
    pinoHttp: false,
    timeout: { options: DEFAULT_REQ_TIMEOUT_OPTIONS, forRoutes },
    reqLogger: false,
    security: { options: DEFAULT_HELMET_SECURITY_OPTIONS, forRoutes },
} as const;

export const CORE_MIDDLEWARES_MAP: Record<keyof CoreMiddlewareModuleOptions, Type<any>> = {
    timeout: RequestTimeoutMiddleware,
    compression: CompressionMiddleware,
    noCache: NoCacheMiddleware,
    pinoHttp: PinoHttpMiddleware,
    reqLogger: RequestLoggerMiddleware,
    security: SecurityMiddleware,
};

@Module({})
export class CoreMiddlewareModule implements NestModule {
    public constructor(@Inject(CORE_MIDDLEWARE_MODULE_OPTIONS) public readonly options: CoreMiddlewareModuleOptions) {}

    public static forRoot(options: CoreMiddlewareModuleOptions = DEFAULT_CORE_MIDDLEWARE_MODULE_OPTIONS): DynamicModule {
        return {
            module: CoreMiddlewareModule,
            providers: [
                {
                    provide: CORE_MIDDLEWARE_MODULE_OPTIONS,
                    useValue: options,
                },
                ...Object.values(CORE_MIDDLEWARES_MAP),
            ],
            global: true,
        };
    }

    public configure(consumer: MiddlewareConsumer): void {
        for (const [key, options] of Object.entries(this.options)) {
            if (options === false) {
                continue;
            }

            const Middleware = CORE_MIDDLEWARES_MAP[key as keyof CoreMiddlewareModuleOptions];
            consumer.apply(Middleware).forRoutes(...options.forRoutes);
        }
    }
}
