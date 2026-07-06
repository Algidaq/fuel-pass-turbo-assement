import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialAuthUsers1760000000002 implements MigrationInterface {
    public name = 'SeedInitialAuthUsers1760000000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            WITH seed_users(email, full_name, role_key) AS (
                VALUES
                    ('admin@fuelpass.local', 'Admin User', 'admin'),
                    ('aircraft.operator@fuelpass.local', 'Aircraft Operator', 'aircraft_operator'),
                    ('operations.manager@fuelpass.local', 'Operations Manager', 'operations_manager')
            )
            INSERT INTO "users" ("email", "full_name", "status", "email_verified_at")
            SELECT seed_users.email, seed_users.full_name, 'ACTIVE', now()
            FROM seed_users
            ON CONFLICT ("email") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO "user_credentials" ("user_id", "provider", "password_hash", "password_changed_at")
            SELECT
                "users"."id",
                'LOCAL',
                '$2b$12$nTYSU7njeWvAcrCqRuRONe6tfE117XdHcEs4HJ0uPkuz8Pa1wxwXm',
                now()
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

        await queryRunner.query(`
            WITH seed_users(email, role_key) AS (
                VALUES
                    ('admin@fuelpass.local', 'admin'),
                    ('aircraft.operator@fuelpass.local', 'aircraft_operator'),
                    ('operations.manager@fuelpass.local', 'operations_manager')
            )
            INSERT INTO "user_roles" ("user_id", "role_id")
            SELECT "users"."id", "roles"."id"
            FROM seed_users
            INNER JOIN "users" ON "users"."email" = seed_users.email
            INNER JOIN "roles" ON "roles"."key" = seed_users.role_key
            ON CONFLICT ("user_id", "role_id") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "users"
            WHERE "email" IN (
                'admin@fuelpass.local',
                'aircraft.operator@fuelpass.local',
                'operations.manager@fuelpass.local'
            )
        `);
    }
}
