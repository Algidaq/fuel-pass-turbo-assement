/* eslint-disable @stylistic/comma-dangle */

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    DISABLED = 'DISABLED',
    LOCKED = 'LOCKED',
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum CredentialProvider {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
    MICROSOFT = 'MICROSOFT',
    AZURE_AD = 'AZURE_AD',
    AUTH0 = 'AUTH0',
}

export enum SessionStatus {
    ACTIVE = 'ACTIVE',
    REVOKED = 'REVOKED',
    EXPIRED = 'EXPIRED',
}

export enum RefreshTokenStatus {
    ACTIVE = 'ACTIVE',
    ROTATED = 'ROTATED',
    REVOKED = 'REVOKED',
    EXPIRED = 'EXPIRED',
    REUSED = 'REUSED',
}
