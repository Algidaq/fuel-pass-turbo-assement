import { HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppHttpError, CS_ERRORS, PermissionsGuard, REQUIRED_PERMISSIONS_METADATA_KEY } from '../../../src';
import type { AuthenticatedRequest } from '../../../src';
import type { ExecutionContext } from '@nestjs/common';

function createExecutionContext(request: Partial<AuthenticatedRequest>): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
        getHandler: () => function handler(): void {},
        getClass: () => class TestController {},
    } as ExecutionContext;
}

describe('PermissionsGuard', (): void => {
    it('allows requests without required permission metadata', (): void => {
        const reflector = new Reflector();
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        const guard = new PermissionsGuard(reflector);

        expect(guard.canActivate(createExecutionContext({}))).toBe(true);
    });

    it('allows requests with all required permissions', (): void => {
        const reflector = new Reflector();
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['fuel-orders:create']);
        const guard = new PermissionsGuard(reflector);

        expect(
            guard.canActivate(
                createExecutionContext({
                    auth: {
                        userId: 'user-1',
                        sessionId: 'session-1',
                        email: 'operator@fuelpass.test',
                        roles: ['aircraft_operator'],
                        permissions: ['fuel-orders:create'],
                        jti: 'jti-1',
                    },
                })
            )
        ).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRED_PERMISSIONS_METADATA_KEY, expect.any(Array));
    });

    it('rejects requests missing required permissions', (): void => {
        const reflector = new Reflector();
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['fuel-orders:update-status']);
        const guard = new PermissionsGuard(reflector);

        const expectedError = new AppHttpError(HttpStatus.FORBIDDEN, CS_ERRORS.MissingRequiredPermissions);

        expect(() =>
            guard.canActivate(
                createExecutionContext({
                    auth: {
                        userId: 'user-1',
                        sessionId: 'session-1',
                        email: 'operator@fuelpass.test',
                        roles: ['aircraft_operator'],
                        permissions: ['fuel-orders:create'],
                        jti: 'jti-1',
                    },
                })
            )
        ).toThrow(expect.objectContaining(expectedError));
    });
});
