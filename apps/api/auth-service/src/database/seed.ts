import { ORDER_PERMISSIONS } from '@fuel-pass/contracts/backend';
import type { DataSource, Repository } from 'typeorm';
import {
    CredentialProvider,
    PermissionEntity,
    RoleEntity,
    RolePermissionEntity,
    UserCredentialEntity,
    UserEntity,
    UserRoleEntity,
    UserStatus,
} from '../auth/entities';
import dataSource from './data-source';

const defaultPasswordHash = '$2b$12$nTYSU7njeWvAcrCqRuRONe6tfE117XdHcEs4HJ0uPkuz8Pa1wxwXm';

const seedRoles = {
    aircraftOperator: {
        id: 'f302bdec-7f9f-45e2-8ab2-15f4097a9f2a',
        key: 'aircraft_operator',
        name: 'Aircraft Operator',
        description: 'Can create and manage own fuel order activity.',
    },
    operationsManager: {
        id: '9d08e4b0-ad98-49ad-8e95-170ddbc96c73',
        key: 'operations_manager',
        name: 'Operations Manager',
        description: 'Can manage operational fuel order workflows.',
    },
    admin: {
        id: '5db14ff7-cc79-4149-ab36-c4c67439ce82',
        key: 'admin',
        name: 'Admin',
        description: 'Can administer auth roles and permissions.',
    },
} as const;

const seedPermissions = [
    { id: '18385a73-429d-48c9-a6d4-c32da340dd08', ...ORDER_PERMISSIONS.fuelOrderCreate },
    { id: 'dce1f357-66a0-452c-8ce2-d829d219afec', ...ORDER_PERMISSIONS.fuelOrderReadOwn },
    { id: '625e9345-f895-4dd1-90f5-13408e926102', ...ORDER_PERMISSIONS.fuelOrderReadAll },
    { id: 'ebc27f42-9836-4cc6-8741-d0cd70ba6a2a', ...ORDER_PERMISSIONS.fuelOrderUpdateStatus },
    { id: '10e9d791-1593-4f64-b79a-ef4041fb8c37', ...ORDER_PERMISSIONS.fuelOrderFilterByAirport },
] as const;

const seedUsers = [
    {
        id: '3bd3f1fe-0582-4379-99f5-d2f1240eaa7c',
        email: 'admin@fuelpass.local',
        fullName: 'Admin User',
        roleKey: seedRoles.admin.key,
        credentialId: '108e425f-e1ac-4d7a-9b42-0cd77218f555',
    },
    {
        id: '5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4',
        email: 'aircraft.operator@fuelpass.local',
        fullName: 'Aircraft Operator',
        roleKey: seedRoles.aircraftOperator.key,
        credentialId: 'f8075bd5-663b-42c9-94a4-c36cf3d94802',
    },
    {
        id: '6abf35f5-1a16-40c3-bbe0-916ba0986c84',
        email: 'operations.manager@fuelpass.local',
        fullName: 'Operations Manager',
        roleKey: seedRoles.operationsManager.key,
        credentialId: '254281ff-1554-45b5-a377-5b86fbad8d32',
    },
] as const;

const seedRolePermissions = [
    { roleKey: seedRoles.aircraftOperator.key, permissionKey: ORDER_PERMISSIONS.fuelOrderCreate.key },
    { roleKey: seedRoles.aircraftOperator.key, permissionKey: ORDER_PERMISSIONS.fuelOrderReadOwn.key },
    { roleKey: seedRoles.operationsManager.key, permissionKey: ORDER_PERMISSIONS.fuelOrderReadAll.key },
    { roleKey: seedRoles.operationsManager.key, permissionKey: ORDER_PERMISSIONS.fuelOrderUpdateStatus.key },
    { roleKey: seedRoles.operationsManager.key, permissionKey: ORDER_PERMISSIONS.fuelOrderFilterByAirport.key },
    { roleKey: seedRoles.admin.key, permissionKey: ORDER_PERMISSIONS.fuelOrderCreate.key },
    { roleKey: seedRoles.admin.key, permissionKey: ORDER_PERMISSIONS.fuelOrderReadOwn.key },
    { roleKey: seedRoles.admin.key, permissionKey: ORDER_PERMISSIONS.fuelOrderReadAll.key },
    { roleKey: seedRoles.admin.key, permissionKey: ORDER_PERMISSIONS.fuelOrderUpdateStatus.key },
    { roleKey: seedRoles.admin.key, permissionKey: ORDER_PERMISSIONS.fuelOrderFilterByAirport.key },
] as const;

export async function seedAuthData(seedDataSource: DataSource = dataSource): Promise<void> {
    const initializedDataSource = seedDataSource.isInitialized ? seedDataSource : await seedDataSource.initialize();

    await initializedDataSource.transaction(async (entityManager): Promise<void> => {
        const roleRepository = entityManager.getRepository(RoleEntity);
        const permissionRepository = entityManager.getRepository(PermissionEntity);
        const userRepository = entityManager.getRepository(UserEntity);
        const credentialRepository = entityManager.getRepository(UserCredentialEntity);
        const userRoleRepository = entityManager.getRepository(UserRoleEntity);
        const rolePermissionRepository = entityManager.getRepository(RolePermissionEntity);

        const rolesByKey = await seedRoleRecords(roleRepository);
        const permissionsByKey = await seedPermissionRecords(permissionRepository);
        const usersByEmail = await seedUserRecords(userRepository);

        await seedCredentialRecords(credentialRepository, usersByEmail);
        await seedUserRoleRecords(userRoleRepository, usersByEmail, rolesByKey);
        await seedRolePermissionRecords(rolePermissionRepository, rolesByKey, permissionsByKey);
    });
}

async function seedRoleRecords(roleRepository: Repository<RoleEntity>): Promise<Map<string, RoleEntity>> {
    const rolesByKey = new Map<string, RoleEntity>();

    for (const roleData of Object.values(seedRoles)) {
        const role = await roleRepository.findOne({ where: { key: roleData.key } });

        if (role !== null) {
            rolesByKey.set(role.key, role);
            continue;
        }

        const createdRole = await roleRepository.save(roleRepository.create(roleData));
        rolesByKey.set(createdRole.key, createdRole);
    }

    return rolesByKey;
}

async function seedPermissionRecords(permissionRepository: Repository<PermissionEntity>): Promise<Map<string, PermissionEntity>> {
    const permissionsByKey = new Map<string, PermissionEntity>();

    for (const permissionData of seedPermissions) {
        const permission = await permissionRepository.findOne({ where: { key: permissionData.key } });

        if (permission !== null) {
            permissionsByKey.set(permission.key, permission);
            continue;
        }

        const createdPermission = await permissionRepository.save(permissionRepository.create(permissionData));
        permissionsByKey.set(createdPermission.key, createdPermission);
    }

    return permissionsByKey;
}

async function seedUserRecords(userRepository: Repository<UserEntity>): Promise<Map<string, UserEntity>> {
    const usersByEmail = new Map<string, UserEntity>();
    const emailVerifiedAt = new Date();

    for (const userData of seedUsers) {
        const user = await userRepository.findOne({ where: { email: userData.email } });

        if (user !== null) {
            usersByEmail.set(user.email, user);
            continue;
        }

        const createdUser = await userRepository.save(
            userRepository.create({
                id: userData.id,
                email: userData.email,
                fullName: userData.fullName,
                status: UserStatus.ACTIVE,
                emailVerifiedAt,
            })
        );
        usersByEmail.set(createdUser.email, createdUser);
    }

    return usersByEmail;
}

async function seedCredentialRecords(
    credentialRepository: Repository<UserCredentialEntity>,
    usersByEmail: Map<string, UserEntity>
): Promise<void> {
    for (const userData of seedUsers) {
        const user = usersByEmail.get(userData.email);

        if (user === undefined) {
            continue;
        }

        const credential = await credentialRepository.findOne({
            where: {
                userId: user.id,
                provider: CredentialProvider.LOCAL,
            },
        });

        if (credential !== null) {
            continue;
        }

        await credentialRepository.save(
            credentialRepository.create({
                id: userData.credentialId,
                userId: user.id,
                provider: CredentialProvider.LOCAL,
                passwordHash: defaultPasswordHash,
                passwordChangedAt: new Date(),
            })
        );
    }
}

async function seedUserRoleRecords(
    userRoleRepository: Repository<UserRoleEntity>,
    usersByEmail: Map<string, UserEntity>,
    rolesByKey: Map<string, RoleEntity>
): Promise<void> {
    for (const userData of seedUsers) {
        const user = usersByEmail.get(userData.email);
        const role = rolesByKey.get(userData.roleKey);

        if (user === undefined || role === undefined) {
            continue;
        }

        const userRole = await userRoleRepository.findOne({
            where: {
                userId: user.id,
                roleId: role.id,
            },
        });

        if (userRole !== null) {
            continue;
        }

        await userRoleRepository.save(userRoleRepository.create({ userId: user.id, roleId: role.id }));
    }
}

async function seedRolePermissionRecords(
    rolePermissionRepository: Repository<RolePermissionEntity>,
    rolesByKey: Map<string, RoleEntity>,
    permissionsByKey: Map<string, PermissionEntity>
): Promise<void> {
    for (const rolePermissionData of seedRolePermissions) {
        const role = rolesByKey.get(rolePermissionData.roleKey);
        const permission = permissionsByKey.get(rolePermissionData.permissionKey);

        if (role === undefined || permission === undefined) {
            continue;
        }

        const rolePermission = await rolePermissionRepository.findOne({
            where: {
                roleId: role.id,
                permissionId: permission.id,
            },
        });

        if (rolePermission !== null) {
            continue;
        }

        await rolePermissionRepository.save(rolePermissionRepository.create({ roleId: role.id, permissionId: permission.id }));
    }
}

async function runSeed(): Promise<void> {
    try {
        await seedAuthData();
        console.log('Auth seed data applied successfully.');
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

if (require.main === module) {
    void runSeed().catch((error: unknown): void => {
        console.error('Failed to apply auth seed data.', error);
        process.exitCode = 1;
    });
}
