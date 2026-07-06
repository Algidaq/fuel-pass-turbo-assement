import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import helmet, { HelmetOptions } from 'helmet';
import { CORE_MIDDLEWARE_MODULE_OPTIONS, CoreMiddlewareModuleOptions } from './core-middleware.module.options';

export const DEFAULT_HELMET_SECURITY_OPTIONS: HelmetOptions = {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
};
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
    public readonly middleware: RequestHandler;

    public constructor(@Inject(CORE_MIDDLEWARE_MODULE_OPTIONS) { security }: CoreMiddlewareModuleOptions) {
        const options = typeof security === 'object' ? security.options : DEFAULT_HELMET_SECURITY_OPTIONS;

        this.middleware = helmet(options) as RequestHandler;
    }

    public use(req: unknown, res: unknown, next: (error?: unknown) => void): unknown {
        return this.middleware(req, res, next);
    }
}
