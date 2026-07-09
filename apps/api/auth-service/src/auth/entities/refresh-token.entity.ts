/* eslint-disable @typescript-eslint/member-ordering */
import { BaseModel, type ClassParams } from '@fuel-pass/node-commons';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RefreshTokenStatus } from './auth.enums';
import type { UserSessionEntity } from './user-session.entity';
import type { UserEntity } from './user.entity';

@Entity({ name: 'refresh_tokens' })
@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_session_id', ['sessionId'])
@Index('idx_refresh_tokens_family_id', ['familyId'])
@Index('idx_refresh_tokens_status', ['status'])
@Index('uq_refresh_tokens_token_hash', ['tokenHash'], { unique: true })
export class RefreshTokenEntity extends BaseModel<RefreshTokenEntity> {
    public static create(params: Omit<ClassParams<RefreshTokenEntity>, 'user' | 'session' | 'rotatedToToken'>): RefreshTokenEntity {
        const entity = Object.assign(new RefreshTokenEntity(), params);
        return entity;
    }

    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    public userId!: string;

    @Column({ name: 'session_id', type: 'uuid' })
    public sessionId!: string;

    @Column({ name: 'token_hash', type: 'text' })
    public tokenHash!: string;

    @Column({ name: 'family_id', type: 'uuid' })
    public familyId!: string;

    @Column({
        name: 'status',
        type: 'simple-enum',
        enum: RefreshTokenStatus,
        default: RefreshTokenStatus.ACTIVE,
    })
    public status!: RefreshTokenStatus;

    @Column({ name: 'issued_at', type: Date, default: (): string => 'CURRENT_TIMESTAMP' })
    public issuedAt!: Date;

    @Column({ name: 'expires_at', type: Date })
    public expiresAt!: Date;

    @Column({ name: 'used_at', type: Date, nullable: true })
    public usedAt!: Date | null;

    @Column({ name: 'rotated_to_token_id', type: 'uuid', nullable: true })
    public rotatedToTokenId!: string | null;

    @Column({ name: 'revoked_at', type: Date, nullable: true })
    public revokedAt!: Date | null;

    @Column({ name: 'revoked_reason', type: 'varchar', length: 255, nullable: true })
    public revokedReason!: string | null;

    @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
    public ipAddress!: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    public userAgent!: string | null;

    @ManyToOne('UserEntity', (user: UserEntity): RefreshTokenEntity[] => user.refreshTokens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    public user!: UserEntity;

    @ManyToOne('UserSessionEntity', (session: UserSessionEntity): RefreshTokenEntity[] => session.refreshTokens, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'session_id' })
    public session!: UserSessionEntity;

    @OneToOne('RefreshTokenEntity', { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'rotated_to_token_id' })
    public rotatedToToken!: RefreshTokenEntity | null;

    public override copyWith(params: Partial<ClassParams<RefreshTokenEntity>>): RefreshTokenEntity {
        return Object.assign(new RefreshTokenEntity(), this, params);
    }
}
