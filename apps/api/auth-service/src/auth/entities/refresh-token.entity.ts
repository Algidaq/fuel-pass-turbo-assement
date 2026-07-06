import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RefreshTokenStatus } from './auth.enums';
import type { UserEntity } from './user.entity';
import type { UserSessionEntity } from './user-session.entity';

@Entity({ name: 'refresh_tokens' })
@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_session_id', ['sessionId'])
@Index('idx_refresh_tokens_family_id', ['familyId'])
@Index('idx_refresh_tokens_status', ['status'])
@Index('uq_refresh_tokens_token_hash', ['tokenHash'], { unique: true })
export class RefreshTokenEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'user_id', type: 'varchar', length: 36 })
    public userId!: string;

    @Column({ name: 'session_id', type: 'varchar', length: 36 })
    public sessionId!: string;

    @Column({ name: 'token_hash', type: 'text' })
    public tokenHash!: string;

    @Column({ name: 'family_id', type: 'varchar', length: 36 })
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

    @Column({ name: 'rotated_to_token_id', type: 'varchar', length: 36, nullable: true })
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
}
