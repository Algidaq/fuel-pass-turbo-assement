import type { DataSource, EntityManager } from 'typeorm';
import { AuthFailure } from '../src/auth/auth.errors';
import { CredentialProvider, UserStatus } from '../src/auth/entities/auth.enums';
import { RoleEntity } from '../src/auth/entities/role.entity';
import { UserCredentialEntity } from '../src/auth/entities/user-credential.entity';
import { UserRoleEntity } from '../src/auth/entities/user-role.entity';
import { UserEntity } from '../src/auth/entities/user.entity';
import { AuthService } from '../src/auth/services/auth.service';

describe('AuthService.createInternalUser', () => {
    function createService(overrides?: { existingUser?: UserEntity | null; roles?: RoleEntity[] }): {
        service: AuthService;
        manager: jest.Mocked<Pick<EntityManager, 'create' | 'find' | 'save'>>;
        passwordService: { hashPassword: jest.Mock };
        currentUserService: { buildCurrentUser: jest.Mock };
    } {
        const roles = overrides?.roles ?? [Object.assign(new RoleEntity(), { id: 'role-1', key: 'admin' })];
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
                roles: ['admin'],
                permissions: [],
            }),
        };
        const service = new AuthService(
            {
                findByEmail: jest.fn().mockResolvedValue(overrides?.existingUser ?? null),
            } as never,
            {} as never,
            passwordService as never,
            {} as never,
            {} as never,
            {} as never,
            currentUserService as never,
            {} as never,
            dataSource as unknown as DataSource
        );

        return { service, manager, passwordService, currentUserService };
    }

    it('creates normalized users, local credentials, and role assignments in a transaction', async () => {
        const { service, manager, passwordService, currentUserService } = createService();

        const response = await service.createInternalUser({
            email: ' Admin@FuelPass.Local ',
            fullName: ' Admin User ',
            password: 'Password123!',
            roleKeys: ['admin'],
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
        expect(response.user.email).toBe('admin@fuelpass.local');
    });

    it('rejects duplicate emails', async () => {
        const { service } = createService({
            existingUser: Object.assign(new UserEntity(), { id: 'existing-user' }),
        });

        await expect(
            service.createInternalUser({
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                password: 'Password123!',
                roleKeys: ['admin'],
            })
        ).rejects.toEqual(new AuthFailure('UserAlreadyExists'));
    });

    it('rejects unknown role keys', async () => {
        const { service } = createService({ roles: [] });

        await expect(
            service.createInternalUser({
                email: 'admin@fuelpass.local',
                fullName: 'Admin User',
                password: 'Password123!',
                roleKeys: ['admin'],
            })
        ).rejects.toEqual(new AuthFailure('InvalidRequest'));
    });
});
