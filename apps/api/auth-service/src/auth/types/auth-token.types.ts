export interface AccessTokenClaims {
    sub: string;
    sid: string;
    jti: string;
    email: string;
    roles: string[];
    permissions: string[];
}
