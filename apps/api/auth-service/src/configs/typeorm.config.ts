import { getOsEnv, getOsEnvBoolean, getOsEnvNumber } from '@fuel-pass/node-commons';
import { join } from 'node:path';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import type { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import {
    AuthAuditEventEntity,
    PermissionEntity,
    RefreshTokenEntity,
    RoleEntity,
    RolePermissionEntity,
    UserCredentialEntity,
    UserEntity,
    UserRoleEntity,
    UserSessionEntity,
} from '../auth/entities';

export const authDatabaseEntities = [
    UserEntity,
    UserCredentialEntity,
    UserSessionEntity,
    RefreshTokenEntity,
    RoleEntity,
    PermissionEntity,
    UserRoleEntity,
    RolePermissionEntity,
    AuthAuditEventEntity,
];

const authDatabaseMigrations = [join(__dirname, '../database/migrations/*{.ts,.js}')];

export type AuthTypeOrmModuleOptions = PostgresConnectionOptions | SqliteConnectionOptions;

function getDatabaseType(): 'postgres' | 'sqlite' {
    const databaseType = getOsEnv('DB_TYPE', 'postgres');

    if (databaseType === 'postgres' || databaseType === 'sqlite') {
        return databaseType;
    }

    throw new Error(`Unsupported DB_TYPE "${databaseType}". Expected "postgres" or "sqlite".`);
}

export function getTypeOrmModuleOptions(): AuthTypeOrmModuleOptions {
    const databaseType = getDatabaseType();

    if (databaseType === 'sqlite') {
        return {
            type: 'sqlite',
            database: getOsEnv('SQLITE_DATABASE', ':memory:') ?? ':memory:',
            entities: authDatabaseEntities,
            migrations: authDatabaseMigrations,
            synchronize: getOsEnvBoolean('SQLITE_SYNCHRONIZE', false),
        };
    }

    const sslEnabled = getOsEnvBoolean('DB_SSL', false);

    return {
        type: 'postgres',
        host: getOsEnv('DB_HOST', 'localhost'),
        port: getOsEnvNumber('DB_PORT', 5432),
        username: getOsEnv('DB_USERNAME', 'postgres'),
        password: getOsEnv('DB_PASSWORD', 'postgres'),
        database: getOsEnv('DB_DATABASE', 'fuel_pass_auth'),
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        entities: authDatabaseEntities,
        migrations: authDatabaseMigrations,
        synchronize: false,
    };
}

export const DB_CONFIG = getTypeOrmModuleOptions;
