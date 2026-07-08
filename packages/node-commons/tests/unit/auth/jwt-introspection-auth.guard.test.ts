import axios from 'axios';
import { HttpStatus } from '@nestjs/common';
import { AppHttpError, CS_ERRORS, JwtIntrospectionAuthGuard } from '../../../src';
import type { ExecutionContext } from '@nestjs/common';

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
        isAxiosError: (error: unknown): boolean => typeof error === 'object' && error !== null && 'isAxiosError' in error,
    },
}));

const axiosMock = axios as jest.Mocked<typeof axios>;

function createExecutionContext(request: { header: (name: string) => string | undefined; auth?: unknown }): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
        getHandler: () => function handler(): void {},
        getClass: () => class TestController {},
    } as ExecutionContext;
}

function createGuard(): JwtIntrospectionAuthGuard {
    return new JwtIntrospectionAuthGuard({
        internalAuthBaseUrl: 'http://auth.test/api/internal/auth/',
        internalServiceApiKey: 'test-key',
        introspectionTimeoutMs: 3000,
    });
}

describe('JwtIntrospectionAuthGuard', (): void => {
    beforeEach((): void => {
        axiosMock.post.mockReset();
    });

    it('rejects requests without bearer tokens', async (): Promise<void> => {
        const guard = createGuard();

        await expect(guard.canActivate(createExecutionContext({ header: (): undefined => undefined }))).rejects.toMatchObject(
            new AppHttpError(HttpStatus.UNAUTHORIZED, CS_ERRORS.MissingAuthorizationToken)
        );
    });

    it('attaches principals from active wrapped introspection responses', async (): Promise<void> => {
        axiosMock.post.mockResolvedValue({
            data: {
                data: {
                    active: true,
                    sub: 'user-1',
                    sessionId: 'session-1',
                    email: 'operator@fuelpass.test',
                    roles: ['aircraft_operator'],
                    permissions: ['fuel-orders:create'],
                    user: {
                        id: 'user-1',
                        email: 'operator@fuelpass.test',
                        fullName: 'Operator',
                        roles: ['aircraft_operator'],
                        permissions: ['fuel-orders:create'],
                    },
                },
            },
        });
        const request = {
            header: (name: string): string | undefined => (name === 'authorization' ? 'Bearer access-token' : undefined),
        };
        const guard = createGuard();

        await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);
        expect(axiosMock.post).toHaveBeenCalledWith(
            'http://auth.test/api/internal/auth/introspect',
            { token: 'access-token' },
            expect.objectContaining({
                headers: expect.objectContaining({ 'x-internal-api-key': 'test-key' }),
                timeout: 3000,
            })
        );
        expect(request).toMatchObject({
            auth: {
                userId: 'user-1',
                sessionId: 'session-1',
                email: 'operator@fuelpass.test',
                permissions: ['fuel-orders:create'],
            },
        });
    });

    it('rejects inactive introspection responses', async (): Promise<void> => {
        axiosMock.post.mockResolvedValue({ data: { data: { active: false } } });
        const guard = createGuard();

        await expect(
            guard.canActivate(
                createExecutionContext({
                    header: (name: string): string | undefined => (name === 'authorization' ? 'Bearer access-token' : undefined),
                })
            )
        ).rejects.toMatchObject(new AppHttpError(HttpStatus.UNAUTHORIZED, CS_ERRORS.InvalidAuthorizationToken));
    });
});
