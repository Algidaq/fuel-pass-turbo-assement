import { getAuthRuntimeConfig } from './auth.config';
import { DB_CONFIG, getTypeOrmModuleOptions } from './typeorm.config';

export const configs = {
    auth: getAuthRuntimeConfig,
    database: DB_CONFIG,
} as const;

export const envs = {
    auth: getAuthRuntimeConfig(),
    database: getTypeOrmModuleOptions(),
} as const;
