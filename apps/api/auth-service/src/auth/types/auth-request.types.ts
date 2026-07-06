import type { Request } from 'express';

export interface RequestMetadata {
    ipAddress: string | null;
    userAgent: string | null;
    deviceName: string | null;
}

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

export function requestMetadataFromRequest(request: Request): RequestMetadata {
    const forwardedFor = request.header('x-forwarded-for')?.split(',')[0]?.trim();
    const clientIp = request.header('x-client-ip') ?? forwardedFor ?? request.ip ?? null;

    return {
        ipAddress: clientIp,
        userAgent: request.header('user-agent') ?? null,
        deviceName: request.header('x-device-name') ?? null,
    };
}
