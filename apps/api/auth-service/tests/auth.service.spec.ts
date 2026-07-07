import type { DataSource, EntityManager } from 'typeorm';
import { ACCESS_ROLES } from '@fuel-pass/contracts/backend';
import { BaseApiHeaders } from '@fuel-pass/node-commons';
import { CredentialProvider, UserStatus } from '../src/auth/entities/auth.enums';
import { RoleEntity } from '../src/auth/entities/role.entity';
import { UserCredentialEntity } from '../src/auth/entities/user-credential.entity';
import { UserRoleEntity } from '../src/auth/entities/user-role.entity';
import { UserEntity } from '../src/auth/entities/user.entity';
import { InternalUserCreationService } from '../src/auth/services/internal-user-creation.service';

const headers = new BaseApiHeaders();

describe('InternalUserCreationService.createUser', () => {
    function createService(overrides?: { existingUser?: UserEntity | null; roles?: RoleEntity[] }): {
        service: InternalUserCreationService;
        manager: jest.Mocked<Pick<EntityManager, 'create' | 'find' | 'save'>>;
        passwordService: { hashPassword: jest.Mock };
        currentUserService: { buildCurrentUser: jest.Mock };
    } {
        const roles = overrides?.roles ?? [Object.assign(new RoleEntity(), { id: 'role-1', key: ACCESS_ROLES.admin.key })];
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
                roles: [ACCESS_ROLES.admin.key],
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
                roleKeys: [ACCESS_ROLES.admin.key],
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
                roleKeys: [ACCESS_ROLES.admin.key],
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
                roleKeys: [ACCESS_ROLES.admin.key],
            },
        });

        expect(response.success).toBe(false);
        expect(response.status).toBe(400);
        expect(response.errors[0]?.code).toEqual('AUTH.INVALID-REQUEST');
    });
});
