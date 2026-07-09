import { Injectable, Logger } from '@nestjs/common';
import { AuthAuditRepository } from '../repositories/auth-audit.repository';
import type { RequestMetadata } from '../types/auth-request.types';

export const AuthAuditEventType = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED_INVALID_PASSWORD: 'LOGIN_FAILED_INVALID_PASSWORD',
    LOGIN_FAILED_USER_LOCKED: 'LOGIN_FAILED_USER_LOCKED',
    TOKEN_REFRESHED: 'TOKEN_REFRESHED',
    REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
    LOGOUT: 'LOGOUT',
} as const;

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    public constructor(private readonly authAuditRepository: AuthAuditRepository) {}

    public async write(params: {
        userId?: string | null;
        sessionId?: string | null;
        eventType: string;
        success: boolean;
        failureReason?: string | null;
        metadata?: Record<string, unknown> | null;
        requestMetadata?: RequestMetadata;
    }): Promise<void> {
        try {
            await this.authAuditRepository.createEvent({
                userId: params.userId ?? null,
                sessionId: params.sessionId ?? null,
                eventType: params.eventType,
                success: params.success,
                failureReason: params.failureReason ?? null,
                metadata: params.metadata ?? null,
                ipAddress: params.requestMetadata?.ipAddress ?? null,
                userAgent: params.requestMetadata?.userAgent ?? null,
            });
        } catch (error: unknown) {
            this.logger.warn(`Failed to write auth audit event: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
