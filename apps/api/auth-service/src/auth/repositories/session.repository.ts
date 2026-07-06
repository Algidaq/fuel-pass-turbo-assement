import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SessionStatus } from '../entities/auth.enums';
import { UserSessionEntity } from '../entities/user-session.entity';

export interface CreateSessionData {
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceName?: string | null;
    expiresAt: Date;
}

@Injectable()
export class SessionRepository {
    public constructor(@InjectRepository(UserSessionEntity) private readonly repository: Repository<UserSessionEntity>) {}

    public createSession(data: CreateSessionData, manager?: EntityManager): Promise<UserSessionEntity> {
        const repository = this.getRepository(manager);
        const session = repository.create(data);

        return repository.save(session);
    }

    public findActiveById(sessionId: string, manager?: EntityManager): Promise<UserSessionEntity | null> {
        return this.getRepository(manager).findOne({
            where: {
                id: sessionId,
                status: SessionStatus.ACTIVE,
            },
        });
    }

    public findActiveByUserId(userId: string): Promise<UserSessionEntity[]> {
        return this.repository.find({
            where: {
                userId,
                status: SessionStatus.ACTIVE,
            },
        });
    }

    public async revokeSession(sessionId: string, reason: string, manager?: EntityManager): Promise<void> {
        await this.getRepository(manager).update(
            { id: sessionId },
            {
                status: SessionStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: reason,
            }
        );
    }

    public async revokeAllUserSessions(userId: string, reason: string): Promise<void> {
        await this.repository.update(
            { userId, status: SessionStatus.ACTIVE },
            {
                status: SessionStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: reason,
            }
        );
    }

    public async updateLastSeen(sessionId: string, date: Date): Promise<void> {
        await this.repository.update({ id: sessionId }, { lastSeenAt: date });
    }

    private getRepository(manager?: EntityManager): Repository<UserSessionEntity> {
        return manager?.getRepository(UserSessionEntity) ?? this.repository;
    }
}
