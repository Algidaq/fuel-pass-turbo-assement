/* eslint-disable @typescript-eslint/member-ordering */
import { BaseModel, type ClassParams } from '@fuel-pass/node-commons';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { UserSessionEntity } from './user-session.entity';
import type { UserEntity } from './user.entity';

@Entity({ name: 'auth_audit_events' })
@Index('idx_auth_audit_events_user_id_created_at', ['userId', 'createdAt'])
@Index('idx_auth_audit_events_event_type_created_at', ['eventType', 'createdAt'])
export class AuthAuditEventEntity extends BaseModel<AuthAuditEventEntity> {
    public static create(params: Omit<ClassParams<AuthAuditEventEntity>, 'user' | 'session' | 'id'>): AuthAuditEventEntity {
        return Object.assign(new AuthAuditEventEntity(), params);
    }

    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    public userId!: string | null;

    @Column({ name: 'session_id', type: 'uuid', nullable: true })
    public sessionId!: string | null;

    @Column({ name: 'event_type', type: 'varchar', length: 100 })
    public eventType!: string;

    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    public ipAddress!: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    public userAgent!: string | null;

    @Column({ name: 'success', type: 'boolean' })
    public success!: boolean;

    @Column({ name: 'failure_reason', type: 'text', nullable: true })
    public failureReason!: string | null;

    @Column({ name: 'metadata', type: 'simple-json', nullable: true })
    public metadata!: Record<string, unknown> | null;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date;

    @ManyToOne('UserEntity', (user: UserEntity): AuthAuditEventEntity[] => user.auditEvents, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'user_id' })
    public user!: UserEntity | null;

    @ManyToOne('UserSessionEntity', (session: UserSessionEntity): AuthAuditEventEntity[] => session.auditEvents, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'session_id' })
    public session!: UserSessionEntity | null;

    public override copyWith(params: Partial<ClassParams<AuthAuditEventEntity>>): AuthAuditEventEntity {
        return Object.assign(new AuthAuditEventEntity(), this, params);
    }
}
