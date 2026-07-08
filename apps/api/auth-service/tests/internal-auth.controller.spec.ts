import { HttpStatus } from '@nestjs/common';
import { ApiResponse, BaseApiHeaders } from '@fuel-pass/node-commons';
import { InternalAuthController } from '../src/auth/controllers/internal-auth.controller';
import type { AuthIntrospectionService } from '../src/auth/services/auth-introspection.service';
import type { InternalUserCreationService } from '../src/auth/services/internal-user-creation.service';
import type { InternalUserLookupService } from '../src/auth/services/internal-user-lookup.service';

const headers = new BaseApiHeaders();
const adminRoleKey = 'admin';

describe('InternalAuthController', () => {
    function createController(params?: {
        introspectionService?: Partial<AuthIntrospectionService>;
        internalUserCreationService?: Partial<InternalUserCreationService>;
        internalUserLookupService?: Partial<InternalUserLookupService>;
    }): InternalAuthController {
        return new InternalAuthController(
            (params?.introspectionService ?? {}) as AuthIntrospectionService,
            (params?.internalUserCreationService ?? {}) as InternalUserCreationService,
            (params?.internalUserLookupService ?? {}) as InternalUserLookupService
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

    it('delegates internal user lookup requests', async () => {
        const response = ApiResponse.builder()
            .withSuccess({
                status: HttpStatus.OK,
                data: {
                    users: [{ id: 'user-1', email: 'operator@fuelpass.test', fullName: 'Aircraft Operator' }],
                },
            })
            .build();
        const lookupUsers = jest.fn().mockResolvedValue(response);
        const controller = createController({ internalUserLookupService: { lookupUsers } });
        const body = { userIds: ['8c2d1c4a-c42e-4e77-8ff1-6f76c473f6aa'] };

        await expect(controller.lookupUsers(body, headers)).resolves.toBe(response);
        expect(lookupUsers).toHaveBeenCalledWith({ headers, body });
    });
});
