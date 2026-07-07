import { BaseModel, type ClassParams } from '@fuel-pass/node-commons';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { AuthAuditEventEntity } from './auth-audit-event.entity';
import { SessionStatus } from './auth.enums';
import type { RefreshTokenEntity } from './refresh-token.entity';
import type { UserEntity } from './user.entity';

@Entity({ name: 'user_sessions' })
@Index('idx_user_sessions_user_id', ['userId'])
@Index('idx_user_sessions_status', ['status'])
export class UserSessionEntity extends BaseModel<UserSessionEntity> {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'user_id', type: 'varchar', length: 36 })
    public userId!: string;

    @Column({
        name: 'status',
        type: 'simple-enum',
        enum: SessionStatus,
        default: SessionStatus.ACTIVE,
    })
    public status!: SessionStatus;

    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    public ipAddress!: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    public userAgent!: string | null;

    @Column({ name: 'device_name', type: 'varchar', length: 255, nullable: true })
    public deviceName!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date;

    @Column({ name: 'last_seen_at', type: Date, nullable: true })
    public lastSeenAt!: Date | null;

    @Column({ name: 'expires_at', type: Date })
    public expiresAt!: Date;

    @Column({ name: 'revoked_at', type: Date, nullable: true })
    public revokedAt!: Date | null;

    @Column({ name: 'revoked_reason', type: 'varchar', length: 255, nullable: true })
    public revokedReason!: string | null;

    @ManyToOne('UserEntity', (user: UserEntity): UserSessionEntity[] => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    public user!: UserEntity;

    @OneToMany('RefreshTokenEntity', (refreshToken: RefreshTokenEntity): UserSessionEntity => refreshToken.session)
    public refreshTokens!: RefreshTokenEntity[];

    @OneToMany('AuthAuditEventEntity', (event: AuthAuditEventEntity): UserSessionEntity | null => event.session)
    public auditEvents!: AuthAuditEventEntity[];

    public override copyWith(params: Partial<ClassParams<UserSessionEntity>>): UserSessionEntity {
        return Object.assign(new UserSessionEntity(), this, params);
    }
}
