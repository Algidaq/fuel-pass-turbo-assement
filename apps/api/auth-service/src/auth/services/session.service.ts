import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { SessionStatus } from '../entities/auth.enums';
import { UserSessionEntity } from '../entities/user-session.entity';
import { SessionRepository } from '../repositories/session.repository';
import type { RequestMetadata } from '../types/auth-request.types';

@Injectable()
export class SessionService {
    public constructor(private readonly sessionRepository: SessionRepository) {}

    public createSession(userId: string, metadata: RequestMetadata, expiresAt: Date): Promise<UserSessionEntity> {
        return this.sessionRepository.createSession({
            userId,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            deviceName: metadata.deviceName,
            expiresAt,
        });
    }

    public async validateActiveSession(sessionId: string, manager?: EntityManager): Promise<UserSessionEntity | null> {
        const session = await this.sessionRepository.findActiveById(sessionId, manager);

        if (session === null) {
            return null;
        }

        if (session.expiresAt.getTime() <= Date.now()) {
            await this.sessionRepository.revokeSession(sessionId, SessionStatus.EXPIRED, manager);
            return null;
        }

        return session;
    }

    public revokeSession(sessionId: string, reason: string, manager?: EntityManager): Promise<void> {
        return this.sessionRepository.revokeSession(sessionId, reason, manager);
    }

    public updateLastSeen(sessionId: string): Promise<void> {
        return this.sessionRepository.updateLastSeen(sessionId, new Date());
    }
}
