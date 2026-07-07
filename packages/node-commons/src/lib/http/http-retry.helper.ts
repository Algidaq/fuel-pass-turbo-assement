import axios from 'axios';
import pRetry from 'p-retry';
import { HttpStatus } from '@nestjs/common';

const HTTP_STATUS_TOO_EARLY = 425;

export const DEFAULT_RETRYABLE_HTTP_STATUS_CODES = [
    HttpStatus.REQUEST_TIMEOUT,
    HTTP_STATUS_TOO_EARLY,
    HttpStatus.TOO_MANY_REQUESTS,
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.BAD_GATEWAY,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT,
] as const;

export interface HttpRetryOptions extends pRetry.Options {
    readonly retryableStatusCodes?: readonly number[];
    readonly shouldRetry?: (error: Error) => boolean | Promise<boolean>;
}

export async function withHttpRetry<T>(operation: () => Promise<T>, options: HttpRetryOptions = {}): Promise<T> {
    const { retryableStatusCodes = DEFAULT_RETRYABLE_HTTP_STATUS_CODES, shouldRetry, ...retryOptions } = options;

    try {
        return await pRetry(
            async (): Promise<T> => {
                try {
                    return await operation();
                } catch (error: unknown) {
                    const normalizedError = toError(error);
                    const retry = shouldRetry !== undefined ? await shouldRetry(normalizedError) : isRetryableHttpError(normalizedError, retryableStatusCodes);

                    if (!retry) {
                        throw new pRetry.AbortError(normalizedError);
                    }

                    throw normalizedError;
                }
            },
            {
                retries: 2,
                factor: 2,
                minTimeout: 100,
                maxTimeout: 1000,
                randomize: true,
                ...retryOptions,
            }
        );
    } catch (error: unknown) {
        if (error instanceof pRetry.AbortError) {
            throw error.originalError;
        }

        throw error;
    }
}

export function isRetryableHttpError(error: Error, retryableStatusCodes: readonly number[] = DEFAULT_RETRYABLE_HTTP_STATUS_CODES): boolean {
    if (!axios.isAxiosError(error)) {
        return false;
    }

    if (error.response === undefined) {
        return true;
    }

    return retryableStatusCodes.includes(error.response.status);
}

function toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
}
