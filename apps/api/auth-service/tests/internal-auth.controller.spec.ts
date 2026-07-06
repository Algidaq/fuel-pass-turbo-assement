import { HttpStatus } from '@nestjs/common';
import { AUTH_ERRORS, AuthFailure } from '../src/auth/auth.errors';
import { InternalAuthController } from '../src/auth/controllers/internal-auth.controller';
import type { AuthService } from '../src/auth/services/auth.service';

describe('InternalAuthController', () => {
    function createController(authService: Partial<AuthService>): InternalAuthController {
        return new InternalAuthController(authService as AuthService);
    }

    it('rejects invalid create-user requests', async () => {
        const controller = createController({});

        const response = await controller.createUser({
            email: '',
            fullName: 'Admin User',
            password: 'Password123!',
            roleKeys: ['admin'],
        });

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        expect(response.errors).toEqual([AUTH_ERRORS.InvalidRequest]);
    });

    it('maps duplicate create-user failures to conflict responses', async () => {
        const controller = createController({
            createInternalUser: jest.fn().mockRejectedValue(new AuthFailure('UserAlreadyExists')),
        });

        const response = await controller.createUser({
            email: 'admin@fuelpass.local',
            fullName: 'Admin User',
            password: 'Password123!',
            roleKeys: ['admin'],
        });

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.CONFLICT);
        expect(response.errors).toEqual([AUTH_ERRORS.UserAlreadyExists]);
    });

    it('returns created users with 201 responses', async () => {
        const user = {
            id: 'user-1',
            email: 'admin@fuelpass.local',
            fullName: 'Admin User',
            roles: ['admin'],
            permissions: [],
        };
        const controller = createController({
            createInternalUser: jest.fn().mockResolvedValue({ user }),
        });

        const response = await controller.createUser({
            email: 'admin@fuelpass.local',
            fullName: 'Admin User',
            password: 'Password123!',
            roleKeys: ['admin'],
        });

        expect(response.success).toBe(true);
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.data).toEqual({ user });
    });
});
