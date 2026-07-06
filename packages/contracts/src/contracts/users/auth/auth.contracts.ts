export interface AuthUserContextDto {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
    permissions: string[];
}

export interface LoginRequestDto {
    email: string;
    password: string;
}

export interface LoginResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
    user: AuthUserContextDto;
}

export interface RefreshRequestDto {
    refreshToken: string;
}

export interface RefreshResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
}

export interface LogoutRequestDto {
    refreshToken?: string;
}

export interface LogoutResponseDto {
    success: true;
}

export interface CurrentUserResponseDto {
    user: AuthUserContextDto;
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

export interface IntrospectRequestDto {
    token: string;
}

export interface CreateInternalUserRequestDto {
    email: string;
    fullName: string;
    password: string;
    roleKeys: string[];
    status?: 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'PENDING_VERIFICATION';
}

export interface CreateInternalUserResponseDto {
    user: AuthUserContextDto;
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
