import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import { IncomingMessage, ServerResponse } from 'http';
import morgan from 'morgan';
import { CORE_MIDDLEWARE_MODULE_OPTIONS, CoreMiddlewareModuleOptions } from './core-middleware.module.options';

export type TReqLoggerMiddlewareOptions = {
    format: 'tiny' | 'short' | 'common' | 'combined' | (string & {});
    options?: morgan.Options<IncomingMessage, ServerResponse>;
};

export const DEFAULT_REQ_LOGGER_OPTIONS: TReqLoggerMiddlewareOptions = {
    format: 'combined',
    options: { immediate: true },
};

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    public middleware: RequestHandler;
    public constructor(@Inject(CORE_MIDDLEWARE_MODULE_OPTIONS) { reqLogger }: CoreMiddlewareModuleOptions) {
        const { format, options } = typeof reqLogger === 'object' ? reqLogger.options : DEFAULT_REQ_LOGGER_OPTIONS;
        this.middleware = morgan(format, options) as RequestHandler;
    }

    public use(req: unknown, res: unknown, next: (error?: unknown) => void): unknown {
        return this.middleware(req, res, next);
    }
}
