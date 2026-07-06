import { getAuthRuntimeConfig } from './auth.config';
import { DB_CONFIG } from './typeorm.config';

export const configs = {
    auth: getAuthRuntimeConfig,
    database: DB_CONFIG,
} as const;
