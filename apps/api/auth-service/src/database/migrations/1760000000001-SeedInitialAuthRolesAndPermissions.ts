import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialAuthRolesAndPermissions1760000000001 implements MigrationInterface {
    public name = 'SeedInitialAuthRolesAndPermissions1760000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "roles" ("key", "name", "description")
            VALUES
                ('aircraft_operator', 'Aircraft Operator', 'Can create and manage own fuel order activity.'),
                ('operations_manager', 'Operations Manager', 'Can manage operational fuel order workflows.'),
                ('admin', 'Admin', 'Can administer auth roles and permissions.')
            ON CONFLICT ("key") DO NOTHING
        `);

        await queryRunner.query(`
            INSERT INTO "permissions" ("key", "resource", "action", "description")
            VALUES
                ('fuel_order:create', 'fuel_order', 'create', 'Create fuel orders.'),
                ('fuel_order:read_own', 'fuel_order', 'read_own', 'Read own fuel orders.'),
                ('fuel_order:read_all', 'fuel_order', 'read_all', 'Read all fuel orders.'),
                ('fuel_order:update_status', 'fuel_order', 'update_status', 'Update fuel order status.'),
                ('fuel_order:filter_by_airport', 'fuel_order', 'filter_by_airport', 'Filter fuel orders by airport.')
            ON CONFLICT ("key") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "permissions"
            WHERE "key" IN (
                'fuel_order:create',
                'fuel_order:read_own',
                'fuel_order:read_all',
                'fuel_order:update_status',
                'fuel_order:filter_by_airport'
            )
        `);

        await queryRunner.query(`
            DELETE FROM "roles"
            WHERE "key" IN (
                'aircraft_operator',
                'operations_manager',
                'admin'
            )
        `);
    }
}
