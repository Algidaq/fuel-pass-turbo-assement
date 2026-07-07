import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import pinoHttp from 'pino-http';
import type { Options as PinoHttpOptions } from 'pino-http';
import { CORE_MIDDLEWARE_MODULE_OPTIONS, CoreMiddlewareModuleOptions } from './core-middleware.module.options';

export type TPinoHttpMiddlewareOptions = PinoHttpOptions;

export const DEFAULT_PINO_HTTP_OPTIONS: TPinoHttpMiddlewareOptions = {
    autoLogging: true,
    useLevel: 'info',
};

@Injectable()
export class PinoHttpMiddleware implements NestMiddleware {
    public readonly middleware: RequestHandler;

    public constructor(@Inject(CORE_MIDDLEWARE_MODULE_OPTIONS) { pinoHttp: pinoHttpOptions }: CoreMiddlewareModuleOptions) {
        const options = typeof pinoHttpOptions === 'object' ? pinoHttpOptions.options : DEFAULT_PINO_HTTP_OPTIONS;

        this.middleware = pinoHttp(options) as RequestHandler;
    }

    public use(req: unknown, res: unknown, next: (error?: unknown) => void): unknown {
        return this.middleware(req, res, next);
    }
}
