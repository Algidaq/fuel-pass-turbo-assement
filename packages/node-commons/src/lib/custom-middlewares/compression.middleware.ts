import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import compression, { CompressionOptions } from 'compression';
import { CORE_MIDDLEWARE_MODULE_OPTIONS, CoreMiddlewareModuleOptions } from './core-middleware.module.options';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const compressionFilter: compression.CompressionFilter = (req, res): boolean => {
    if (req.headers['x-no-compression']) {
        return false;
    }
    return compression.filter(req, res);
};

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
    threshold: '1kb',
    level: 6,
    filter: compressionFilter,
};

@Injectable()
export class CompressionMiddleware implements NestMiddleware {
    public middleware: RequestHandler;
    public constructor(@Inject(CORE_MIDDLEWARE_MODULE_OPTIONS) options: CoreMiddlewareModuleOptions) {
        const middlewareOptions = typeof options.compression === 'object' ? options.compression.options : DEFAULT_COMPRESSION_OPTIONS;
        this.middleware = compression(middlewareOptions) as RequestHandler;
    }

    public use(req: unknown, res: unknown, next: (error?: unknown) => void): unknown {
        return this.middleware(req, res, next);
    }
}
