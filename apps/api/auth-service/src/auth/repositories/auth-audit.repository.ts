import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthAuditEventEntity } from '../entities/auth-audit-event.entity';

export interface CreateAuthAuditEventData {
    userId?: string | null;
    sessionId?: string | null;
    eventType: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    success: boolean;
    failureReason?: string | null;
    metadata?: Record<string, unknown> | null;
}

export interface PaginationData {
    limit: number;
    offset: number;
}

@Injectable()
export class AuthAuditRepository {
    public constructor(@InjectRepository(AuthAuditEventEntity) private readonly repository: Repository<AuthAuditEventEntity>) {}

    public createEvent(data: CreateAuthAuditEventData): Promise<AuthAuditEventEntity> {
        const event = this.repository.create(data);

        return this.repository.save(event);
    }

    public findByUserId(userId: string, pagination: PaginationData): Promise<AuthAuditEventEntity[]> {
        return this.repository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: pagination.limit,
            skip: pagination.offset,
        });
    }

    public findByEventType(eventType: string, pagination: PaginationData): Promise<AuthAuditEventEntity[]> {
        return this.repository.find({
            where: { eventType },
            order: { createdAt: 'DESC' },
            take: pagination.limit,
            skip: pagination.offset,
        });
    }
}
