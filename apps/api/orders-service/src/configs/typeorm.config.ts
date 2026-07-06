import { getOsEnv, getOsEnvBoolean, getOsEnvNumber } from '@fuel-pass/node-commons';
import { join } from 'node:path';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import type { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { FuelOrderEntity, FuelOrderStatusHistoryEntity } from '../orders/entities';

export const ordersDatabaseEntities = [FuelOrderEntity, FuelOrderStatusHistoryEntity];

export type OrdersTypeOrmModuleOptions = PostgresConnectionOptions | SqliteConnectionOptions;

function getDatabaseType(): 'postgres' | 'sqlite' {
    const databaseType = getOsEnv('DB_TYPE', 'postgres');

    if (databaseType === 'postgres' || databaseType === 'sqlite') {
        return databaseType;
    }

    throw new Error(`Unsupported DB_TYPE "${databaseType}". Expected "postgres" or "sqlite".`);
}

export function getTypeOrmModuleOptions(): OrdersTypeOrmModuleOptions {
    const databaseType = getDatabaseType();

    if (databaseType === 'sqlite') {
        return {
            type: 'sqlite',
            database: getOsEnv('SQLITE_DATABASE', ':memory:') ?? ':memory:',
            entities: ordersDatabaseEntities,
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
        database: getOsEnv('DB_DATABASE', 'fuel_pass_orders'),
        ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        entities: ordersDatabaseEntities,
        migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
        synchronize: false,
    };
}

export const DB_CONFIG = getTypeOrmModuleOptions;
