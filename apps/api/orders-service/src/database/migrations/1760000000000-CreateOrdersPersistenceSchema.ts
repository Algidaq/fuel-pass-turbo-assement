import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersPersistenceSchema1760000000000 implements MigrationInterface {
    public name = 'CreateOrdersPersistenceSchema1760000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type === 'sqlite') {
            await this.createSqliteSchema(queryRunner);
            return;
        }

        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        await queryRunner.query("CREATE TYPE \"fuel_order_status\" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED')");
        await queryRunner.query('CREATE TYPE "volume_unit" AS ENUM (\'LITERS\')');

        await queryRunner.query(`
            CREATE TABLE "fuel_orders" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "tail_number" varchar(32) NOT NULL,
                "airport_icao_code" varchar(4) NOT NULL,
                "requested_fuel_volume" numeric(12,2) NOT NULL,
                "volume_unit" "volume_unit" NOT NULL DEFAULT 'LITERS',
                "delivery_window_start_at" timestamptz NOT NULL,
                "delivery_window_end_at" timestamptz NOT NULL,
                "status" "fuel_order_status" NOT NULL DEFAULT 'PENDING',
                "submitted_by_user_id" uuid,
                "last_status_changed_by_user_id" uuid,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "ck_fuel_orders_tail_number_not_empty" CHECK (length(btrim("tail_number")) > 0),
                CONSTRAINT "ck_fuel_orders_airport_icao_code_format" CHECK ("airport_icao_code" ~ '^[A-Z]{4}$'),
                CONSTRAINT "ck_fuel_orders_requested_fuel_volume_positive" CHECK ("requested_fuel_volume" > 0),
                CONSTRAINT "ck_fuel_orders_delivery_window_order" CHECK ("delivery_window_end_at" > "delivery_window_start_at")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "fuel_order_status_history" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "fuel_order_id" uuid NOT NULL,
                "from_status" "fuel_order_status",
                "to_status" "fuel_order_status" NOT NULL,
                "changed_by_user_id" uuid,
                "changed_at" timestamptz NOT NULL DEFAULT now(),
                "note" text,
                CONSTRAINT "fk_fuel_order_status_history_fuel_order_id" FOREIGN KEY ("fuel_order_id") REFERENCES "fuel_orders"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query('CREATE INDEX "idx_fuel_orders_airport_icao_code" ON "fuel_orders" ("airport_icao_code")');
        await queryRunner.query('CREATE INDEX "idx_fuel_orders_created_at" ON "fuel_orders" ("created_at" DESC)');
        await queryRunner.query('CREATE INDEX "idx_fuel_orders_status" ON "fuel_orders" ("status")');
        await queryRunner.query(
            'CREATE INDEX "idx_fuel_order_status_history_order_changed_at" ON "fuel_order_status_history" ("fuel_order_id", "changed_at" DESC)'
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type === 'sqlite') {
            await this.dropSqliteSchema(queryRunner);
            return;
        }

        await queryRunner.query('DROP INDEX "idx_fuel_order_status_history_order_changed_at"');
        await queryRunner.query('DROP INDEX "idx_fuel_orders_status"');
        await queryRunner.query('DROP INDEX "idx_fuel_orders_created_at"');
        await queryRunner.query('DROP INDEX "idx_fuel_orders_airport_icao_code"');

        await queryRunner.query('DROP TABLE "fuel_order_status_history"');
        await queryRunner.query('DROP TABLE "fuel_orders"');

        await queryRunner.query('DROP TYPE "volume_unit"');
        await queryRunner.query('DROP TYPE "fuel_order_status"');
    }

    private async createSqliteSchema(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "fuel_orders" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "tail_number" varchar(32) NOT NULL,
                "airport_icao_code" varchar(4) NOT NULL,
                "requested_fuel_volume" numeric(12,2) NOT NULL,
                "volume_unit" varchar CHECK ("volume_unit" IN ('LITERS')) NOT NULL DEFAULT ('LITERS'),
                "delivery_window_start_at" datetime NOT NULL,
                "delivery_window_end_at" datetime NOT NULL,
                "status" varchar CHECK ("status" IN ('PENDING', 'CONFIRMED', 'COMPLETED')) NOT NULL DEFAULT ('PENDING'),
                "submitted_by_user_id" varchar(36),
                "last_status_changed_by_user_id" varchar(36),
                "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "ck_fuel_orders_tail_number_not_empty" CHECK (length(trim("tail_number")) > 0),
                CONSTRAINT "ck_fuel_orders_airport_icao_code_format" CHECK (length("airport_icao_code") = 4 AND "airport_icao_code" = upper("airport_icao_code") AND "airport_icao_code" GLOB '[A-Z][A-Z][A-Z][A-Z]'),
                CONSTRAINT "ck_fuel_orders_requested_fuel_volume_positive" CHECK ("requested_fuel_volume" > 0),
                CONSTRAINT "ck_fuel_orders_delivery_window_order" CHECK ("delivery_window_end_at" > "delivery_window_start_at")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "fuel_order_status_history" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "fuel_order_id" varchar(36) NOT NULL,
                "from_status" varchar CHECK ("from_status" IN ('PENDING', 'CONFIRMED', 'COMPLETED')),
                "to_status" varchar CHECK ("to_status" IN ('PENDING', 'CONFIRMED', 'COMPLETED')) NOT NULL,
                "changed_by_user_id" varchar(36),
                "changed_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "note" text,
                CONSTRAINT "fk_fuel_order_status_history_fuel_order_id" FOREIGN KEY ("fuel_order_id") REFERENCES "fuel_orders"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query('CREATE INDEX "idx_fuel_orders_airport_icao_code" ON "fuel_orders" ("airport_icao_code")');
        await queryRunner.query('CREATE INDEX "idx_fuel_orders_created_at" ON "fuel_orders" ("created_at" DESC)');
        await queryRunner.query('CREATE INDEX "idx_fuel_orders_status" ON "fuel_orders" ("status")');
        await queryRunner.query(
            'CREATE INDEX "idx_fuel_order_status_history_order_changed_at" ON "fuel_order_status_history" ("fuel_order_id", "changed_at" DESC)'
        );
    }

    private async dropSqliteSchema(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_fuel_order_status_history_order_changed_at"');
        await queryRunner.query('DROP INDEX "idx_fuel_orders_status"');
        await queryRunner.query('DROP INDEX "idx_fuel_orders_created_at"');
        await queryRunner.query('DROP INDEX "idx_fuel_orders_airport_icao_code"');

        await queryRunner.query('DROP TABLE "fuel_order_status_history"');
        await queryRunner.query('DROP TABLE "fuel_orders"');
    }
}
