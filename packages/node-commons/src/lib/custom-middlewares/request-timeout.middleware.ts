/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./express-timeout-handler.d.ts" />

import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { RequestHandler } from '@nestjs/common/interfaces';
import { NextFunction, Request, Response } from 'express';
import { handler as timeoutHandler, type TimeoutOptions } from 'express-timeout-handler';
import { StatusCodes } from 'http-status-codes';
import { CORE_MIDDLEWARE_MODULE_OPTIONS, type CoreMiddlewareModuleOptions } from './core-middleware.module.options';

const errors = [
    {
        name: '408 Request Timeout',
        code: 'GLOBAL.REQUEST-TIMEOUT',
        message: 'Request timeout due to subsystem call exceeding allowed duration',
        description: 'Request timed out due to subsystem call exceeding the call duration ',
    },
];
export type TReqTimeoutMiddlewareOptions = Pick<TimeoutOptions, 'timeout' | 'disable'>;

export const DEFAULT_REQ_TIMEOUT_OPTIONS: TReqTimeoutMiddlewareOptions = {
    timeout: 30_000,
    disable: [],
};

@Injectable()
export class RequestTimeoutMiddleware implements NestMiddleware {
    public readonly middleware: RequestHandler;
    public constructor(@Inject(CORE_MIDDLEWARE_MODULE_OPTIONS) { timeout }: CoreMiddlewareModuleOptions) {
        const options = typeof timeout === 'object' ? timeout.options : DEFAULT_REQ_TIMEOUT_OPTIONS;
        this.middleware = timeoutHandler({ ...options, onTimeout: this.onTimeout.bind(this) }) as RequestHandler;
    }

    public use(req: Request, res: Response, next: NextFunction): void {
        return this.middleware(req, res, next);
    }

    public onTimeout(_request: Request, response: Response): void {
        if (response.headersSent) {
            return;
        }

        response.status(StatusCodes.REQUEST_TIMEOUT).json({
            errors,
        });
    }
}
