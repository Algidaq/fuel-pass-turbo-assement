import { getOsEnv, getOsEnvNumber } from '@fuel-pass/node-commons';

export type AuthRuntimeConfig = {
    issuer: string;
    audience: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlDays: number;
    jwtPrivateKey: string;
    jwtPublicKey: string;
    jwtKeyId: string;
    bcryptRounds: number;
    internalServiceApiKey: string;
    refreshToken: {
        familyId: string;
        ttlInDays: number;
    };
};

function normalizePem(value: string): string {
    return value.replace(/\\n/g, '\n');
}

function getStringEnv(key: string, fallback: string): string {
    return getOsEnv(key, fallback) ?? fallback;
}

export function getAuthRuntimeConfig(): AuthRuntimeConfig {
    return {
        issuer: getStringEnv('JWT_ISSUER', 'fuelpass-auth'),
        audience: getStringEnv('JWT_AUDIENCE', 'fuelpass-api'),
        accessTokenTtlSeconds: getOsEnvNumber('JWT_ACCESS_TOKEN_TTL_SECONDS', 900),
        refreshTokenTtlDays: getOsEnvNumber('REFRESH_TOKEN_TTL_DAYS', 7),
        jwtPrivateKey: normalizePem(getStringEnv('JWT_PRIVATE_KEY', '')),
        jwtPublicKey: normalizePem(getStringEnv('JWT_PUBLIC_KEY', '')),
        jwtKeyId: getStringEnv('JWT_KEY_ID', 'fuelpass-auth-dev-1'),
        bcryptRounds: getOsEnvNumber('BCRYPT_ROUNDS', 12),
        internalServiceApiKey: getStringEnv('INTERNAL_SERVICE_API_KEY', ''),
        refreshToken: {
            familyId: getStringEnv('REFRESH_TOKEN_FAMILY_ID', 'auth-refresh-v1'),
            ttlInDays: getOsEnvNumber('REFRESH_TOKEN_TTL_DAYS', 7),
        },
    };
}
