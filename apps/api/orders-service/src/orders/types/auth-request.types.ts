import type { Request } from 'express';

export interface AuthenticatedPrincipal {
    userId: string;
    sessionId: string;
    email: string;
    roles: string[];
    permissions: string[];
    jti: string;
}

export type AuthenticatedRequest = Request & {
    auth: AuthenticatedPrincipal;
};
