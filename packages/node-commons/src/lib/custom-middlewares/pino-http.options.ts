/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { type Options } from 'pino-http';

export const DEFAULT_PINO_HTTP_OPTIONS: Options = {
    genReqId: (req, res): string | string[] => {
        const existingId = req.headers['unique-reference-code'];
        const id = Array.isArray(existingId) && existingId.length > 0 ? existingId[0]! : (existingId ?? crypto.randomUUID());

        res.setHeader('unique-reference-code', id);
        return id;
    },

    customSuccessMessage: (req, res): string => {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (req, res, err): string => {
        return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },

    customSuccessObject: (req, res, loggableObject): object => {
        return {
            req: {
                id: req.id,
                method: req.method,
                url: req.url,
                query: (req as any).query,
                remoteAddress: req.socket?.remoteAddress,
                userAgent: req.headers['user-agent'],
            },
            res: {
                statusCode: res.statusCode,
            },
            responseTime: loggableObject.responseTime,
        };
    },

    customErrorObject: (req, res, err, loggableObject): object => {
        return {
            req: {
                id: req.id,
                method: req.method,
                url: req.url,
                query: (req as any)?.query,
                remoteAddress: req.socket?.remoteAddress,
                userAgent: req.headers['user-agent'],
            },
            res: {
                statusCode: res.statusCode,
            },
            err: {
                type: err.name,
                message: err.message,
                stack: err.stack,
            },
            responseTime: loggableObject.responseTime,
        };
    },

    customProps: (_req, res): object => {
        return {
            userId: (res as any)?.locals?.user?.id,
        };
    },
};
