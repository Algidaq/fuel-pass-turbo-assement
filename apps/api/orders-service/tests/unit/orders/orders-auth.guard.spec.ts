import { ACCESS_PERMISSIONS, ACCESS_ROLES } from '@fuel-pass/contracts/backend';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { OrdersJwtAuthGuard } from '../../../src/orders/guards/orders-jwt-auth.guard';
import { OrdersPermissionsGuard } from '../../../src/orders/guards/orders-permissions.guard';
import { REQUIRED_PERMISSIONS_METADATA_KEY } from '../../../src/orders/guards/permissions.decorator';

function createExecutionContext(request: {
    header: (name: string) => string | undefined;
    auth?: { permissions: string[] };
}): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
        getHandler: () => function handler(): void {},
        getClass: () => class TestController {},
    } as ExecutionContext;
}

describe('OrdersJwtAuthGuard', () => {
    const fetchMock = jest.fn();

    beforeEach(() => {
        fetchMock.mockReset();
        global.fetch = fetchMock;
    });

    it('rejects requests without bearer tokens', async () => {
        const guard = new OrdersJwtAuthGuard(new ConfigService());
        const context = createExecutionContext({ header: (): undefined => undefined });

        await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('extracts principals from active auth introspection responses', async () => {
        fetchMock.mockResolvedValue(
            new Response(
                JSON.stringify({
                    data: {
                        active: true,
                        sub: 'user-1',
                        sessionId: 'session-1',
                        email: 'operator@fuelpass.test',
                        roles: [ACCESS_ROLES.aircraftOperator.key],
                        permissions: [ACCESS_PERMISSIONS.fuelOrderCreate.key],
                        user: {
                            id: 'user-1',
                            email: 'operator@fuelpass.test',
                            fullName: 'Operator',
                            roles: [ACCESS_ROLES.aircraftOperator.key],
                            permissions: [ACCESS_PERMISSIONS.fuelOrderCreate.key],
                        },
                    },
                }),
                { status: 200 }
            )
        );
        const request = {
            header: (name: string): string | undefined => (name === 'authorization' ? 'Bearer access-token' : undefined),
        };
        const guard = new OrdersJwtAuthGuard(
            new ConfigService({
                auth: {
                    internalAuthBaseUrl: 'http://auth.test/api/internal/auth',
                    internalServiceApiKey: 'test-key',
                    introspectionTimeoutMs: 3000,
                },
            })
        );

        await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
            'http://auth.test/api/internal/auth/introspect',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'x-internal-api-key': 'test-key' }),
            })
        );
        expect(request).toMatchObject({
            auth: {
                userId: 'user-1',
                permissions: [ACCESS_PERMISSIONS.fuelOrderCreate.key],
            },
        });
    });

    it('rejects inactive introspection responses', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { active: false } }), { status: 200 }));
        const guard = new OrdersJwtAuthGuard(new ConfigService());
        const context = createExecutionContext({
            header: (name: string): string | undefined => (name === 'authorization' ? 'Bearer access-token' : undefined),
        });

        await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    });
});

describe('OrdersPermissionsGuard', () => {
    it('allows requests with all required permissions', () => {
        const reflector = new Reflector();
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ACCESS_PERMISSIONS.fuelOrderCreate.key]);
        const guard = new OrdersPermissionsGuard(reflector);

        expect(
            guard.canActivate(
                createExecutionContext({
                    header: (): undefined => undefined,
                    auth: { permissions: [ACCESS_PERMISSIONS.fuelOrderCreate.key] },
                })
            )
        ).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRED_PERMISSIONS_METADATA_KEY, expect.any(Array));
    });

    it('rejects requests missing required permissions', () => {
        const reflector = new Reflector();
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ACCESS_PERMISSIONS.fuelOrderUpdateStatus.key]);
        const guard = new OrdersPermissionsGuard(reflector);

        expect(() =>
            guard.canActivate(
                createExecutionContext({
                    header: (): undefined => undefined,
                    auth: { permissions: [ACCESS_PERMISSIONS.fuelOrderCreate.key] },
                })
            )
        ).toThrow(ForbiddenException);
    });
});
