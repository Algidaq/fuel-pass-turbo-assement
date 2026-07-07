export interface AuthUserContextDto {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface JwkDto {
    kty: string;
    use?: string;
    kid?: string;
    alg?: string;
    n?: string;
    e?: string;
}

export interface JwksResponseDto {
    keys: JwkDto[];
}

export interface IntrospectActiveResponseDto {
    active: true;
    sub: string;
    sessionId: string;
    email: string;
    roles: string[];
    permissions: string[];
    user: AuthUserContextDto;
}

export interface IntrospectInactiveResponseDto {
    active: false;
}

export type IntrospectResponseDto = IntrospectActiveResponseDto | IntrospectInactiveResponseDto;

export type CreateInternalUserStatusDto = 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'PENDING_VERIFICATION';
