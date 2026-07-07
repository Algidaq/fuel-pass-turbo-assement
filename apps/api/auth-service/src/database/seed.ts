import { ORDER_PERMISSIONS } from '@fuel-pass/contracts/backend';
import dataSource from './data-source';

const seedRoles = {
    aircraftOperator: {
        key: 'aircraft_operator',
        name: 'Aircraft Operator',
        description: 'Can create and manage own fuel order activity.',
    },
    operationsManager: {
        key: 'operations_manager',
        name: 'Operations Manager',
        description: 'Can manage operational fuel order workflows.',
    },
    admin: {
        key: 'admin',
        name: 'Admin',
        description: 'Can administer auth roles and permissions.',
    },
} as const;

export async function seedAuthData(): Promise<void> {
    const initializedDataSource = dataSource.isInitialized ? dataSource : await dataSource.initialize();

    await initializedDataSource.transaction(async (entityManager): Promise<void> => {
        await entityManager.query(`
            INSERT INTO "roles" ("id", "key", "name", "description")
            VALUES
                ('f302bdec-7f9f-45e2-8ab2-15f4097a9f2a', '${seedRoles.aircraftOperator.key}', '${seedRoles.aircraftOperator.name}', '${seedRoles.aircraftOperator.description}'),
                ('9d08e4b0-ad98-49ad-8e95-170ddbc96c73', '${seedRoles.operationsManager.key}', '${seedRoles.operationsManager.name}', '${seedRoles.operationsManager.description}'),
                ('5db14ff7-cc79-4149-ab36-c4c67439ce82', '${seedRoles.admin.key}', '${seedRoles.admin.name}', '${seedRoles.admin.description}')
            ON CONFLICT ("key") DO NOTHING
        `);

        await entityManager.query(`
            INSERT INTO "permissions" ("id", "key", "resource", "action", "description")
            VALUES
                ('18385a73-429d-48c9-a6d4-c32da340dd08', '${ORDER_PERMISSIONS.fuelOrderCreate.key}', '${ORDER_PERMISSIONS.fuelOrderCreate.resource}', '${ORDER_PERMISSIONS.fuelOrderCreate.action}', '${ORDER_PERMISSIONS.fuelOrderCreate.description}'),
                ('dce1f357-66a0-452c-8ce2-d829d219afec', '${ORDER_PERMISSIONS.fuelOrderReadOwn.key}', '${ORDER_PERMISSIONS.fuelOrderReadOwn.resource}', '${ORDER_PERMISSIONS.fuelOrderReadOwn.action}', '${ORDER_PERMISSIONS.fuelOrderReadOwn.description}'),
                ('625e9345-f895-4dd1-90f5-13408e926102', '${ORDER_PERMISSIONS.fuelOrderReadAll.key}', '${ORDER_PERMISSIONS.fuelOrderReadAll.resource}', '${ORDER_PERMISSIONS.fuelOrderReadAll.action}', '${ORDER_PERMISSIONS.fuelOrderReadAll.description}'),
                ('ebc27f42-9836-4cc6-8741-d0cd70ba6a2a', '${ORDER_PERMISSIONS.fuelOrderUpdateStatus.key}', '${ORDER_PERMISSIONS.fuelOrderUpdateStatus.resource}', '${ORDER_PERMISSIONS.fuelOrderUpdateStatus.action}', '${ORDER_PERMISSIONS.fuelOrderUpdateStatus.description}'),
                ('10e9d791-1593-4f64-b79a-ef4041fb8c37', '${ORDER_PERMISSIONS.fuelOrderFilterByAirport.key}', '${ORDER_PERMISSIONS.fuelOrderFilterByAirport.resource}', '${ORDER_PERMISSIONS.fuelOrderFilterByAirport.action}', '${ORDER_PERMISSIONS.fuelOrderFilterByAirport.description}')
            ON CONFLICT ("key") DO NOTHING
        `);

        await entityManager.query(`
            WITH seed_users(id, email, full_name, role_key) AS (
                VALUES
                    ('3bd3f1fe-0582-4379-99f5-d2f1240eaa7c', 'admin@fuelpass.local', 'Admin User', '${seedRoles.admin.key}'),
                    ('5aa0f497-f484-4eeb-a4c1-8dc363c3e0c4', 'aircraft.operator@fuelpass.local', 'Aircraft Operator', '${seedRoles.aircraftOperator.key}'),
                    ('6abf35f5-1a16-40c3-bbe0-916ba0986c84', 'operations.manager@fuelpass.local', 'Operations Manager', '${seedRoles.operationsManager.key}')
            )
            INSERT INTO "users" ("id", "email", "full_name", "status", "email_verified_at")
            SELECT seed_users.id, seed_users.email, seed_users.full_name, 'ACTIVE', CURRENT_TIMESTAMP
            FROM seed_users
            WHERE true
            ON CONFLICT ("email") DO NOTHING
        `);

        await entityManager.query(`
            INSERT INTO "user_credentials" ("id", "user_id", "provider", "password_hash", "password_changed_at")
            SELECT
                CASE "users"."email"
                    WHEN 'admin@fuelpass.local' THEN '108e425f-e1ac-4d7a-9b42-0cd77218f555'
                    WHEN 'aircraft.operator@fuelpass.local' THEN 'f8075bd5-663b-42c9-94a4-c36cf3d94802'
                    WHEN 'operations.manager@fuelpass.local' THEN '254281ff-1554-45b5-a377-5b86fbad8d32'
                END,
                "users"."id",
                'LOCAL',
                '$2b$12$nTYSU7njeWvAcrCqRuRONe6tfE117XdHcEs4HJ0uPkuz8Pa1wxwXm',
                CURRENT_TIMESTAMP
            FROM "users"
            WHERE "users"."email" IN (
                'admin@fuelpass.local',
                'aircraft.operator@fuelpass.local',
                'operations.manager@fuelpass.local'
            )
            AND NOT EXISTS (
                SELECT 1
                FROM "user_credentials"
                WHERE "user_credentials"."user_id" = "users"."id"
                AND "user_credentials"."provider" = 'LOCAL'
            )
        `);

        await entityManager.query(`
            WITH seed_users(email, role_key) AS (
                VALUES
                    ('admin@fuelpass.local', '${seedRoles.admin.key}'),
                    ('aircraft.operator@fuelpass.local', '${seedRoles.aircraftOperator.key}'),
                    ('operations.manager@fuelpass.local', '${seedRoles.operationsManager.key}')
            )
            INSERT INTO "user_roles" ("user_id", "role_id")
            SELECT "users"."id", "roles"."id"
            FROM seed_users
            INNER JOIN "users" ON "users"."email" = seed_users.email
            INNER JOIN "roles" ON "roles"."key" = seed_users.role_key
            WHERE true
            ON CONFLICT ("user_id", "role_id") DO NOTHING
        `);

        await entityManager.query(`
            WITH role_permission_keys(role_key, permission_key) AS (
                VALUES
                    ('${seedRoles.aircraftOperator.key}', '${ORDER_PERMISSIONS.fuelOrderCreate.key}'),
                    ('${seedRoles.aircraftOperator.key}', '${ORDER_PERMISSIONS.fuelOrderReadOwn.key}'),
                    ('${seedRoles.operationsManager.key}', '${ORDER_PERMISSIONS.fuelOrderReadAll.key}'),
                    ('${seedRoles.operationsManager.key}', '${ORDER_PERMISSIONS.fuelOrderUpdateStatus.key}'),
                    ('${seedRoles.operationsManager.key}', '${ORDER_PERMISSIONS.fuelOrderFilterByAirport.key}'),
                    ('${seedRoles.admin.key}', '${ORDER_PERMISSIONS.fuelOrderCreate.key}'),
                    ('${seedRoles.admin.key}', '${ORDER_PERMISSIONS.fuelOrderReadOwn.key}'),
                    ('${seedRoles.admin.key}', '${ORDER_PERMISSIONS.fuelOrderReadAll.key}'),
                    ('${seedRoles.admin.key}', '${ORDER_PERMISSIONS.fuelOrderUpdateStatus.key}'),
                    ('${seedRoles.admin.key}', '${ORDER_PERMISSIONS.fuelOrderFilterByAirport.key}')
            )
            INSERT INTO "role_permissions" ("role_id", "permission_id")
            SELECT "roles"."id", "permissions"."id"
            FROM role_permission_keys
            INNER JOIN "roles" ON "roles"."key" = role_permission_keys.role_key
            INNER JOIN "permissions" ON "permissions"."key" = role_permission_keys.permission_key
            WHERE true
            ON CONFLICT ("role_id", "permission_id") DO NOTHING
        `);
    });
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
