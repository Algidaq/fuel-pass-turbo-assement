import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import nocache from 'nocache';

@Injectable()
export class NoCacheMiddleware implements NestMiddleware {
    public middleware: RequestHandler;
    public constructor() {
        this.middleware = nocache() as RequestHandler;
    }

    public use(req: unknown, res: unknown, next: (error?: unknown) => void): unknown {
        return this.middleware(req, res, next);
    }
}
