import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { logger } from '../logger/logger';

type HttpErrorLike = {
    message?: string;
    status?: number;
    statusCode?: number;
};

const getErrorStatusCode = (error: unknown): number => {
    const errorLike = error as HttpErrorLike;
    const statusCode = errorLike.statusCode ?? errorLike.status;

    if (typeof statusCode !== 'number' || !Number.isInteger(statusCode)) {
        return 500;
    }

    return statusCode >= 400 && statusCode <= 599 ? statusCode : 500;
};

const getErrorMessage = (error: unknown, statusCode: number): string => {
    if (statusCode >= 500) {
        return 'An unexpected proxy error occurred.';
    }

    return error instanceof Error && error.message.length > 0 ? error.message : 'The proxy request could not be completed.';
};

export const errorHandlerMiddleware: ErrorRequestHandler = (
    error: unknown,
    request: Request,
    response: Response,
    next: NextFunction
): void => {
    if (response.headersSent) {
        next(error);
        return;
    }

    const statusCode = getErrorStatusCode(error);

    logger.error('Unhandled proxy error', {
        error,
        data: {
            method: request.method,
            path: request.originalUrl,
            statusCode,
        },
    });

    response.status(statusCode).json({
        success: false,
        errors: [
            {
                code: statusCode >= 500 ? 'PROXY.INTERNAL_SERVER_ERROR' : 'PROXY.REQUEST_FAILED',
                message: getErrorMessage(error, statusCode),
            },
        ],
    });
};
