import { getAuthRuntimeConfig } from './orders-auth.config';
import { DB_CONFIG } from './typeorm.config';

export const configs = {
    auth: getAuthRuntimeConfig,
    database: DB_CONFIG,
} as const;
