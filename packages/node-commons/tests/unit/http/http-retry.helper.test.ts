import { isRetryableHttpError, withHttpRetry } from '../../../src';

function createAxiosError(status?: number): Error {
    return Object.assign(new Error(status === undefined ? 'network error' : `http ${status}`), {
        isAxiosError: true,
        response: status === undefined ? undefined : { status },
    });
}

describe('withHttpRetry', (): void => {
    it('retries retryable HTTP status codes', async (): Promise<void> => {
        const operation = jest.fn<Promise<string>, []>().mockRejectedValueOnce(createAxiosError(502)).mockResolvedValue('ok');

        await expect(withHttpRetry(operation, { retries: 1, minTimeout: 1, maxTimeout: 1 })).resolves.toBe('ok');
        expect(operation).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-retryable HTTP status codes', async (): Promise<void> => {
        const error = createAxiosError(403);
        const operation = jest.fn<Promise<string>, []>().mockRejectedValue(error);

        await expect(withHttpRetry(operation, { retries: 2, minTimeout: 1, maxTimeout: 1 })).rejects.toBe(error);
        expect(operation).toHaveBeenCalledTimes(1);
    });
});

describe('isRetryableHttpError', (): void => {
    it('treats axios network errors as retryable', (): void => {
        expect(isRetryableHttpError(createAxiosError())).toBe(true);
    });

    it('treats non-axios errors as non-retryable', (): void => {
        expect(isRetryableHttpError(new Error('boom'))).toBe(false);
    });
});
