import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthPersistenceSchema1760000000000 implements MigrationInterface {
    public name = 'CreateAuthPersistenceSchema1760000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type === 'sqlite') {
            await this.createSqliteSchema(queryRunner);
            return;
        }

        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        await queryRunner.query("CREATE TYPE \"user_status\" AS ENUM ('ACTIVE', 'DISABLED', 'LOCKED', 'PENDING_VERIFICATION')");
        await queryRunner.query("CREATE TYPE \"credential_provider\" AS ENUM ('LOCAL', 'GOOGLE', 'MICROSOFT', 'AZURE_AD', 'AUTH0')");
        await queryRunner.query("CREATE TYPE \"session_status\" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED')");
        await queryRunner.query("CREATE TYPE \"refresh_token_status\" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED', 'REUSED')");

        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "email" varchar(255) NOT NULL,
                "full_name" varchar(255) NOT NULL,
                "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
                "email_verified_at" timestamptz,
                "last_login_at" timestamptz,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "uq_users_email" UNIQUE ("email")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_credentials" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "provider" "credential_provider" NOT NULL,
                "provider_user_id" varchar(255),
                "password_hash" text,
                "password_changed_at" timestamptz,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "fk_user_credentials_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_sessions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "status" "session_status" NOT NULL DEFAULT 'ACTIVE',
                "ip_address" inet,
                "user_agent" text,
                "device_name" varchar(255),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "last_seen_at" timestamptz,
                "expires_at" timestamptz NOT NULL,
                "revoked_at" timestamptz,
                "revoked_reason" varchar(255),
                CONSTRAINT "fk_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "session_id" uuid NOT NULL,
                "token_hash" text NOT NULL,
                "family_id" uuid NOT NULL,
                "status" "refresh_token_status" NOT NULL DEFAULT 'ACTIVE',
                "issued_at" timestamptz NOT NULL DEFAULT now(),
                "expires_at" timestamptz NOT NULL,
                "used_at" timestamptz,
                "rotated_to_token_id" uuid,
                "revoked_at" timestamptz,
                "revoked_reason" varchar(255),
                "ip_address" inet,
                "user_agent" text,
                CONSTRAINT "uq_refresh_tokens_token_hash" UNIQUE ("token_hash"),
                CONSTRAINT "fk_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_refresh_tokens_session_id" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_refresh_tokens_rotated_to_token_id" FOREIGN KEY ("rotated_to_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "key" varchar(100) NOT NULL,
                "name" varchar(255) NOT NULL,
                "description" text,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "uq_roles_key" UNIQUE ("key")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "key" varchar(150) NOT NULL,
                "resource" varchar(100) NOT NULL,
                "action" varchar(100) NOT NULL,
                "description" text,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "uq_permissions_key" UNIQUE ("key")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_id" uuid NOT NULL,
                "role_id" uuid NOT NULL,
                "assigned_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "pk_user_roles" PRIMARY KEY ("user_id", "role_id"),
                CONSTRAINT "fk_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "assigned_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "pk_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
                CONSTRAINT "fk_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "auth_audit_events" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" uuid,
                "session_id" uuid,
                "event_type" varchar(100) NOT NULL,
                "ip_address" inet,
                "user_agent" text,
                "success" boolean NOT NULL,
                "failure_reason" text,
                "metadata" jsonb,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "fk_auth_audit_events_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "fk_auth_audit_events_session_id" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query('CREATE INDEX "idx_user_credentials_user_id" ON "user_credentials" ("user_id")');
        await queryRunner.query(
            'CREATE UNIQUE INDEX "uq_user_credentials_provider_provider_user_id" ON "user_credentials" ("provider", "provider_user_id") WHERE "provider_user_id" IS NOT NULL'
        );
        await queryRunner.query('CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" ("user_id")');
        await queryRunner.query('CREATE INDEX "idx_user_sessions_status" ON "user_sessions" ("status")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_session_id" ON "refresh_tokens" ("session_id")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens" ("family_id")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_status" ON "refresh_tokens" ("status")');
        await queryRunner.query(
            'CREATE INDEX "idx_auth_audit_events_user_id_created_at" ON "auth_audit_events" ("user_id", "created_at" DESC)'
        );
        await queryRunner.query(
            'CREATE INDEX "idx_auth_audit_events_event_type_created_at" ON "auth_audit_events" ("event_type", "created_at" DESC)'
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type === 'sqlite') {
            await this.dropSqliteSchema(queryRunner);
            return;
        }

        await queryRunner.query('DROP INDEX "idx_auth_audit_events_event_type_created_at"');
        await queryRunner.query('DROP INDEX "idx_auth_audit_events_user_id_created_at"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_status"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_family_id"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_session_id"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_user_id"');
        await queryRunner.query('DROP INDEX "idx_user_sessions_status"');
        await queryRunner.query('DROP INDEX "idx_user_sessions_user_id"');
        await queryRunner.query('DROP INDEX "uq_user_credentials_provider_provider_user_id"');
        await queryRunner.query('DROP INDEX "idx_user_credentials_user_id"');

        await queryRunner.query('DROP TABLE "auth_audit_events"');
        await queryRunner.query('DROP TABLE "role_permissions"');
        await queryRunner.query('DROP TABLE "user_roles"');
        await queryRunner.query('DROP TABLE "permissions"');
        await queryRunner.query('DROP TABLE "roles"');
        await queryRunner.query('DROP TABLE "refresh_tokens"');
        await queryRunner.query('DROP TABLE "user_sessions"');
        await queryRunner.query('DROP TABLE "user_credentials"');
        await queryRunner.query('DROP TABLE "users"');

        await queryRunner.query('DROP TYPE "refresh_token_status"');
        await queryRunner.query('DROP TYPE "session_status"');
        await queryRunner.query('DROP TYPE "credential_provider"');
        await queryRunner.query('DROP TYPE "user_status"');
    }

    private async createSqliteSchema(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "email" varchar(255) NOT NULL,
                "full_name" varchar(255) NOT NULL,
                "status" varchar CHECK ("status" IN ('ACTIVE', 'DISABLED', 'LOCKED', 'PENDING_VERIFICATION')) NOT NULL DEFAULT ('ACTIVE'),
                "email_verified_at" datetime,
                "last_login_at" datetime,
                "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "uq_users_email" UNIQUE ("email")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_credentials" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "user_id" varchar(36) NOT NULL,
                "provider" varchar CHECK ("provider" IN ('LOCAL', 'GOOGLE', 'MICROSOFT', 'AZURE_AD', 'AUTH0')) NOT NULL,
                "provider_user_id" varchar(255),
                "password_hash" text,
                "password_changed_at" datetime,
                "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "fk_user_credentials_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_sessions" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "user_id" varchar(36) NOT NULL,
                "status" varchar CHECK ("status" IN ('ACTIVE', 'REVOKED', 'EXPIRED')) NOT NULL DEFAULT ('ACTIVE'),
                "ip_address" varchar(45),
                "user_agent" text,
                "device_name" varchar(255),
                "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "last_seen_at" datetime,
                "expires_at" datetime NOT NULL,
                "revoked_at" datetime,
                "revoked_reason" varchar(255),
                CONSTRAINT "fk_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "user_id" varchar(36) NOT NULL,
                "session_id" varchar(36) NOT NULL,
                "token_hash" text NOT NULL,
                "family_id" varchar(36) NOT NULL,
                "status" varchar CHECK ("status" IN ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED', 'REUSED')) NOT NULL DEFAULT ('ACTIVE'),
                "issued_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                "expires_at" datetime NOT NULL,
                "used_at" datetime,
                "rotated_to_token_id" varchar(36),
                "revoked_at" datetime,
                "revoked_reason" varchar(255),
                "ip_address" varchar(45),
                "user_agent" text,
                CONSTRAINT "uq_refresh_tokens_token_hash" UNIQUE ("token_hash"),
                CONSTRAINT "fk_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_refresh_tokens_session_id" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_refresh_tokens_rotated_to_token_id" FOREIGN KEY ("rotated_to_token_id") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "key" varchar(100) NOT NULL,
                "name" varchar(255) NOT NULL,
                "description" text,
                "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "uq_roles_key" UNIQUE ("key")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "key" varchar(150) NOT NULL,
                "resource" varchar(100) NOT NULL,
                "action" varchar(100) NOT NULL,
                "description" text,
                "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "uq_permissions_key" UNIQUE ("key")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "user_id" varchar(36) NOT NULL,
                "role_id" varchar(36) NOT NULL,
                "assigned_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "pk_user_roles" PRIMARY KEY ("user_id", "role_id"),
                CONSTRAINT "fk_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" varchar(36) NOT NULL,
                "permission_id" varchar(36) NOT NULL,
                "assigned_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "pk_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
                CONSTRAINT "fk_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "auth_audit_events" (
                "id" varchar(36) PRIMARY KEY NOT NULL,
                "user_id" varchar(36),
                "session_id" varchar(36),
                "event_type" varchar(100) NOT NULL,
                "ip_address" varchar(45),
                "user_agent" text,
                "success" boolean NOT NULL,
                "failure_reason" text,
                "metadata" text,
                "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
                CONSTRAINT "fk_auth_audit_events_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "fk_auth_audit_events_session_id" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query('CREATE INDEX "idx_user_credentials_user_id" ON "user_credentials" ("user_id")');
        await queryRunner.query(
            'CREATE UNIQUE INDEX "uq_user_credentials_provider_provider_user_id" ON "user_credentials" ("provider", "provider_user_id") WHERE "provider_user_id" IS NOT NULL'
        );
        await queryRunner.query('CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" ("user_id")');
        await queryRunner.query('CREATE INDEX "idx_user_sessions_status" ON "user_sessions" ("status")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_session_id" ON "refresh_tokens" ("session_id")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens" ("family_id")');
        await queryRunner.query('CREATE INDEX "idx_refresh_tokens_status" ON "refresh_tokens" ("status")');
        await queryRunner.query(
            'CREATE INDEX "idx_auth_audit_events_user_id_created_at" ON "auth_audit_events" ("user_id", "created_at" DESC)'
        );
        await queryRunner.query(
            'CREATE INDEX "idx_auth_audit_events_event_type_created_at" ON "auth_audit_events" ("event_type", "created_at" DESC)'
        );
    }

    private async dropSqliteSchema(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_auth_audit_events_event_type_created_at"');
        await queryRunner.query('DROP INDEX "idx_auth_audit_events_user_id_created_at"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_status"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_family_id"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_session_id"');
        await queryRunner.query('DROP INDEX "idx_refresh_tokens_user_id"');
        await queryRunner.query('DROP INDEX "idx_user_sessions_status"');
        await queryRunner.query('DROP INDEX "idx_user_sessions_user_id"');
        await queryRunner.query('DROP INDEX "uq_user_credentials_provider_provider_user_id"');
        await queryRunner.query('DROP INDEX "idx_user_credentials_user_id"');

        await queryRunner.query('DROP TABLE "auth_audit_events"');
        await queryRunner.query('DROP TABLE "role_permissions"');
        await queryRunner.query('DROP TABLE "user_roles"');
        await queryRunner.query('DROP TABLE "permissions"');
        await queryRunner.query('DROP TABLE "roles"');
        await queryRunner.query('DROP TABLE "refresh_tokens"');
        await queryRunner.query('DROP TABLE "user_sessions"');
        await queryRunner.query('DROP TABLE "user_credentials"');
        await queryRunner.query('DROP TABLE "users"');
    }
}
