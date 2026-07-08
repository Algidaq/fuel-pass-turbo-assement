import type { DataSource, EntityManager } from 'typeorm';
import { BaseApiHeaders } from '@fuel-pass/node-commons';
import { CredentialProvider, UserStatus } from '../src/auth/entities/auth.enums';
import { RoleEntity } from '../src/auth/entities/role.entity';
import { UserCredentialEntity } from '../src/auth/entities/user-credential.entity';
import { UserRoleEntity } from '../src/auth/entities/user-role.entity';
import { UserEntity } from '../src/auth/entities/user.entity';
import { InternalUserCreationService } from '../src/auth/services/internal-user-creation.service';
import { InternalUserLookupService } from '../src/auth/services/internal-user-lookup.service';

const headers = new BaseApiHeaders();
const adminRoleKey = 'admin';

describe('InternalUserCreationService.createUser', () => {
    function createService(overrides?: { existingUser?: UserEntity | null; roles?: RoleEntity[] }): {
        service: InternalUserCreationService;
        manager: jest.Mocked<Pick<EntityManager, 'create' | 'find' | 'save'>>;
        passwordService: { hashPassword: jest.Mock };
        currentUserService: { buildCurrentUser: jest.Mock };
    } {
        const roles = overrides?.roles ?? [Object.assign(new RoleEntity(), { id: 'role-1', key: adminRoleKey })];
        const manager = {
            find: jest.fn().mockResolvedValue(roles),
            create: jest.fn((target: unknown, data: unknown): unknown => ({ target, ...(data as Record<string, unknown>) })),
            save: jest.fn((record: unknown): unknown => {
                if (Array.isArray(record)) {
                    return Promise.resolve(record);
                }

                if ((record as { target?: unknown }).target === UserEntity) {
                    return Promise.resolve({ ...(record as Record<string, unknown>), id: 'user-1' });
                }

                return Promise.resolve(record);
            }),
        };
        const dataSource = {
            transaction: jest.fn((callback: (entityManager: typeof manager) => Promise<unknown>): Promise<unknown> => callback(manager)),
        };
        const passwordService = { hashPassword: jest.fn().mockResolvedValue('hashed-password') };
        const currentUserService = {
            buildCurrentUser: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                roles: [adminRoleKey],
                permissions: [],
            }),
        };
        const service = new InternalUserCreationService(
            {
                findByEmail: jest.fn().mockResolvedValue(overrides?.existingUser ?? null),
            } as never,
            passwordService as never,
            currentUserService as never,
            dataSource as unknown as DataSource
        );

        return { service, manager, passwordService, currentUserService };
    }

    it('creates normalized users, local credentials, and role assignments in a transaction', async () => {
        const { service, manager, passwordService, currentUserService } = createService();

        const response = await service.createUser({
            headers,
            body: {
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                password: 'Password123!',
                roleKeys: [adminRoleKey],
            },
        });

        expect(passwordService.hashPassword).toHaveBeenCalledWith('Password123!');
        expect(manager.create).toHaveBeenCalledWith(
            UserEntity,
            expect.objectContaining({
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                status: UserStatus.ACTIVE,
            })
        );
        expect(manager.create).toHaveBeenCalledWith(
            UserCredentialEntity,
            expect.objectContaining({
                userId: 'user-1',
                provider: CredentialProvider.LOCAL,
                passwordHash: 'hashed-password',
            })
        );
        expect(manager.create).toHaveBeenCalledWith(
            UserRoleEntity,
            expect.objectContaining({
                userId: 'user-1',
                roleId: 'role-1',
            })
        );
        expect(currentUserService.buildCurrentUser).toHaveBeenCalledWith('user-1');
        expect(response.data?.user.email).toBe('admin@fuelpass.local');
    });

    it('rejects duplicate emails', async () => {
        const { service } = createService({
            existingUser: Object.assign(new UserEntity(), { id: 'existing-user' }),
        });

        const response = await service.createUser({
            headers,
            body: {
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                password: 'Password123!',
                roleKeys: [adminRoleKey],
            },
        });

        expect(response.success).toBe(false);
        expect(response.status).toBe(409);
        expect(response.errors[0]?.code).toEqual('AUTH.USER-ALREADY-EXISTS');
    });

    it('rejects unknown role keys', async () => {
        const { service } = createService({ roles: [] });

        const response = await service.createUser({
            headers,
            body: {
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                password: 'Password123!',
                roleKeys: [adminRoleKey],
            },
        });

        expect(response.success).toBe(false);
        expect(response.status).toBe(400);
        expect(response.errors[0]?.code).toEqual('AUTH.INVALID-REQUEST');
    });
});

describe('InternalUserLookupService.lookupUsers', () => {
    it('returns user details for found IDs only', async () => {
        const foundUser = Object.assign(new UserEntity(), {
            id: '8c2d1c4a-c42e-4e77-8ff1-6f76c473f6aa',
            email: 'operator@fuelpass.test',
            fullName: 'Aircraft Operator',
        });
        const userRepository = {
            findByIds: jest.fn().mockResolvedValue([foundUser]),
        };
        const service = new InternalUserLookupService(userRepository as never);

        const response = await service.lookupUsers({
            headers,
            body: {
                userIds: ['8c2d1c4a-c42e-4e77-8ff1-6f76c473f6aa', '8c2d1c4a-c42e-4e77-8ff1-6f76c473f6aa'],
            },
        });

        expect(userRepository.findByIds).toHaveBeenCalledWith(['8c2d1c4a-c42e-4e77-8ff1-6f76c473f6aa']);
        expect(response.data?.users).toEqual([
            {
                id: '8c2d1c4a-c42e-4e77-8ff1-6f76c473f6aa',
                email: 'operator@fuelpass.test',
                fullName: 'Aircraft Operator',
            },
        ]);
    });
});
