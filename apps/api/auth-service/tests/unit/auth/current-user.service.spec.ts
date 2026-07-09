jest.mock('../../../src/auth/repositories/permission.repository', () => ({ PermissionRepository: class PermissionRepository {} }));
jest.mock('../../../src/auth/repositories/role.repository', () => ({ RoleRepository: class RoleRepository {} }));
jest.mock('../../../src/auth/repositories/user.repository', () => ({ UserRepository: class UserRepository {} }));
jest.mock('../../../src/auth/services/session.service', () => ({ SessionService: class SessionService {} }));

import { ORDER_PERMISSIONS } from '@fuel-pass/contracts/backend';
import { AuthFailure } from '../../../src/auth/auth.errors';
import { UserStatus } from '../../../src/auth/entities/auth.enums';
import { CurrentUserService } from '../../../src/auth/services/current-user.service';

describe('CurrentUserService', () => {
    const operationsManagerRoleKey = 'operations_manager';

    function createService(params?: { status?: UserStatus; sessionUserId?: string }): {
        service: CurrentUserService;
        roleRepository: { findUserRoles: jest.Mock };
        permissionRepository: { findPermissionsByUserId: jest.Mock };
    } {
        const userRepository = {
            findById: jest.fn().mockResolvedValue({
                id: 'user-1',
                email: 'manager@fuelpass.test',
                fullName: 'Operations Manager',
                status: params?.status ?? UserStatus.ACTIVE,
            }),
        };
        const roleRepository = {
            findUserRoles: jest.fn().mockResolvedValue([{ key: operationsManagerRoleKey }]),
        };
        const permissionRepository = {
            findPermissionsByUserId: jest.fn().mockResolvedValue([{ key: ORDER_PERMISSIONS.fuelOrderReadAll.key }]),
        };
        const sessionService = {
            validateActiveSession: jest.fn().mockResolvedValue({ id: 'session-1', userId: params?.sessionUserId ?? 'user-1' }),
        };

        return {
            service: new CurrentUserService(
                userRepository as never,
                roleRepository as never,
                permissionRepository as never,
                sessionService as never
            ),
            roleRepository,
            permissionRepository,
        };
    }

    it('returns fresh roles and permissions from the database repositories', async () => {
        const { service, roleRepository, permissionRepository } = createService();

        await expect(service.getCurrentUser('user-1', 'session-1')).resolves.toEqual({
            user: {
                id: 'user-1',
                email: 'manager@fuelpass.test',
                fullName: 'Operations Manager',
                roles: [operationsManagerRoleKey],
                permissions: [ORDER_PERMISSIONS.fuelOrderReadAll.key],
            },
        });
        expect(roleRepository.findUserRoles).toHaveBeenCalledWith('user-1');
        expect(permissionRepository.findPermissionsByUserId).toHaveBeenCalledWith('user-1');
    });

    it('rejects inactive users', async () => {
        const { service } = createService({ status: UserStatus.DISABLED });

        await expect(service.getCurrentUser('user-1', 'session-1')).rejects.toBeInstanceOf(AuthFailure);
    });
});
