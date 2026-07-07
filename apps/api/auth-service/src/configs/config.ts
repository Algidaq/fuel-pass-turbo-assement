import { getAppRuntimeConfig } from './app.config';
import { getAuthRuntimeConfig } from './auth.config';
import { DB_CONFIG, getTypeOrmModuleOptions } from './typeorm.config';

export const configs = {
    app: getAppRuntimeConfig,
    auth: getAuthRuntimeConfig,
    database: DB_CONFIG,
} as const;

export const envs = {
    app: getAppRuntimeConfig(),
    auth: getAuthRuntimeConfig(),
    database: getTypeOrmModuleOptions(),
} as const;
