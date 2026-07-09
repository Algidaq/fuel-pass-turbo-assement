import { HttpStatus, StreamableFile, type CallHandler, type ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { ApiResponse, ApiResponseInterceptor, AppHttpError, CS_ERRORS } from '../../../src';

function createResponseMock(): { status: jest.Mock; setHeader: jest.Mock } {
    return {
        status: jest.fn(),
        setHeader: jest.fn(),
    };
}

function createContext(response: ReturnType<typeof createResponseMock>): ExecutionContext {
    return {
        switchToHttp: () => ({
            getResponse: () => response,
        }),
    } as unknown as ExecutionContext;
}

describe('ApiResponseInterceptor', () => {
    it('passes through plain response values', async () => {
        const interceptor = new ApiResponseInterceptor();
        const response = createResponseMock();
        const next: CallHandler = {
            handle: () => of({ ok: true }),
        };

        await expect(lastValueFrom(interceptor.intercept(createContext(response), next))).resolves.toEqual({ ok: true });
        expect(response.status).not.toHaveBeenCalled();
        expect(response.setHeader).not.toHaveBeenCalled();
    });

    it('serializes successful ApiResponse values and applies status and headers', async () => {
        const interceptor = new ApiResponseInterceptor();
        const response = createResponseMock();
        const next: CallHandler = {
            handle: () =>
                of(
                    ApiResponse.builder()
                        .withSuccess({
                            status: HttpStatus.CREATED,
                            headers: { location: '/orders/1' },
                            data: {
                                toJSON: () => ({ id: 'order-1' }),
                            },
                        })
                        .build()
                ),
        };

        await expect(lastValueFrom(interceptor.intercept(createContext(response), next))).resolves.toEqual({ id: 'order-1' });
        expect(response.status).toHaveBeenCalledWith(HttpStatus.CREATED);
        expect(response.setHeader).toHaveBeenCalledWith('location', '/orders/1');
    });

    it('serializes Buffer response data as StreamableFile', () => {
        const interceptor = new ApiResponseInterceptor();
        const response = createResponseMock();

        const result = interceptor.mapToApiResponse(response)(
            ApiResponse.builder()
                .withSuccess({
                    status: HttpStatus.OK,
                    data: Buffer.from('file'),
                })
                .build()
        );

        expect(result).toBeInstanceOf(StreamableFile);
    });

    it('maps AppHttpError failures to error envelopes', async () => {
        const interceptor = new ApiResponseInterceptor();
        const response = createResponseMock();
        const next: CallHandler = {
            handle: () => throwError(() => new AppHttpError(HttpStatus.BAD_REQUEST, CS_ERRORS.InvalidBody)),
        };

        await expect(lastValueFrom(interceptor.intercept(createContext(response), next))).resolves.toEqual({
            errors: [CS_ERRORS.InvalidBody],
        });
        expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('rethrows unknown errors', async () => {
        const interceptor = new ApiResponseInterceptor();
        const response = createResponseMock();
        const error = new Error('unexpected');
        const next: CallHandler = {
            handle: () => throwError(() => error),
        };

        await expect(lastValueFrom(interceptor.intercept(createContext(response), next))).rejects.toBe(error);
    });
});
