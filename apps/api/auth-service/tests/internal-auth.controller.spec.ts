import { HttpStatus } from '@nestjs/common';
import { ApiResponse, BaseApiHeaders } from '@fuel-pass/node-commons';
import { InternalAuthController } from '../src/auth/controllers/internal-auth.controller';
import type { AuthIntrospectionService } from '../src/auth/services/auth-introspection.service';
import type { InternalUserCreationService } from '../src/auth/services/internal-user-creation.service';

const headers = new BaseApiHeaders();
const adminRoleKey = 'admin';

describe('InternalAuthController', () => {
    function createController(params?: {
        introspectionService?: Partial<AuthIntrospectionService>;
        internalUserCreationService?: Partial<InternalUserCreationService>;
    }): InternalAuthController {
        return new InternalAuthController(
            (params?.introspectionService ?? {}) as AuthIntrospectionService,
            (params?.internalUserCreationService ?? {}) as InternalUserCreationService
        );
    }

    it('delegates create-user responses from the endpoint service', async () => {
        const controller = createController({
            internalUserCreationService: {
                createUser: jest.fn().mockResolvedValue(
                    ApiResponse.builder()
                        .withFailure({
                            status: HttpStatus.CONFLICT,
                            errors: {
                                code: 'AUTH.USER-ALREADY-EXISTS',
                                message: 'User already exists',
                                description: 'A user with the supplied email already exists.',
                            },
                        })
                        .build()
                ),
            },
        });

        const response = await controller.createUser(
            {
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                password: 'Password123!',
                roleKeys: [adminRoleKey],
            },
            headers
        );

        expect(response.success).toBe(false);
        expect(response.status).toBe(HttpStatus.CONFLICT);
    });

    it('returns created users with 201 responses', async () => {
        const user = {
            id: 'user-1',
            email: 'admin@fuelpass.local',
            fullName: 'Admin User',
            roles: [adminRoleKey],
            permissions: [],
        };
        const controller = createController({
            internalUserCreationService: {
                createUser: jest
                    .fn()
                    .mockResolvedValue(ApiResponse.builder().withSuccess({ status: HttpStatus.CREATED, data: { user } }).build()),
            },
        });

        const response = await controller.createUser(
            {
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                password: 'Password123!',
                roleKeys: [adminRoleKey],
            },
            headers
        );

        expect(response.success).toBe(true);
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.data).toEqual({ user });
    });
});
