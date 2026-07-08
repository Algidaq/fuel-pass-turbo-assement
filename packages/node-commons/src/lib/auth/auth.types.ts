import type { Request } from 'express';

export interface AuthenticatedPrincipal {
    readonly userId: string;
    readonly sessionId: string;
    readonly email: string;
    readonly roles: string[];
    readonly permissions: string[];
    readonly jti: string;
}

export type AuthenticatedRequest = Request & {
    auth: AuthenticatedPrincipal;
};

export interface IntrospectionActiveResponse {
    readonly active: true;
    readonly sub: string;
    readonly sessionId: string;
    readonly email: string;
    readonly roles: string[];
    readonly permissions: string[];
    readonly user: unknown;
}

export interface IntrospectionInactiveResponse {
    readonly active: false;
}

export type IntrospectionResponse = IntrospectionActiveResponse | IntrospectionInactiveResponse;
