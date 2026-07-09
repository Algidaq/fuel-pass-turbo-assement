import { HttpStatus } from '@nestjs/common';
import { ApiResponse, AppHttpError, CS_ERRORS } from '../../../src';

describe('ApiResponse builder', () => {
    it('builds success responses with status, headers, and data', () => {
        const response = ApiResponse.builder<{ ok: boolean }>()
            .withSuccess({
                status: HttpStatus.CREATED,
                headers: { location: '/orders/1' },
                data: { ok: true },
            })
            .withHeader('x-request-id', 'request-1')
            .build();

        expect(response.success).toBe(true);
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.headers).toEqual({
            location: '/orders/1',
            'x-request-id': 'request-1',
        });
        expect(response.data).toEqual({ ok: true });
    });

    it('builds failure responses from a single error', () => {
        const response = ApiResponse.builder()
            .withFailure({
                status: HttpStatus.BAD_REQUEST,
                errors: CS_ERRORS.InvalidBody,
            })
            .build();

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.errors).toEqual([CS_ERRORS.InvalidBody]);
    });

    it('creates error responses from AppHttpError', () => {
        const appError = new AppHttpError(HttpStatus.UNAUTHORIZED, CS_ERRORS.InvalidAuthorizationToken);

        const response = ApiResponse.fromAppError(appError);

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
        expect(response.data).toEqual({ errors: [CS_ERRORS.InvalidAuthorizationToken] });
    });
});
