import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserStatus } from './auth.enums';
import type { AuthAuditEventEntity } from './auth-audit-event.entity';
import type { RefreshTokenEntity } from './refresh-token.entity';
import type { UserCredentialEntity } from './user-credential.entity';
import type { UserRoleEntity } from './user-role.entity';
import type { UserSessionEntity } from './user-session.entity';

@Entity({ name: 'users' })
@Index('uq_users_email', ['email'], { unique: true })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'email', type: 'varchar', length: 255 })
    public email!: string;

    @Column({ name: 'full_name', type: 'varchar', length: 255 })
    public fullName!: string;

    @Column({
        name: 'status',
        type: 'simple-enum',
        enum: UserStatus,
        default: UserStatus.ACTIVE,
    })
    public status!: UserStatus;

    @Column({ name: 'email_verified_at', type: Date, nullable: true })
    public emailVerifiedAt!: Date | null;

    @Column({ name: 'last_login_at', type: Date, nullable: true })
    public lastLoginAt!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt!: Date;

    @OneToMany('UserCredentialEntity', (credential: UserCredentialEntity): UserEntity => credential.user)
    public credentials!: UserCredentialEntity[];

    @OneToMany('UserSessionEntity', (session: UserSessionEntity): UserEntity => session.user)
    public sessions!: UserSessionEntity[];

    @OneToMany('RefreshTokenEntity', (refreshToken: RefreshTokenEntity): UserEntity => refreshToken.user)
    public refreshTokens!: RefreshTokenEntity[];

    @OneToMany('UserRoleEntity', (userRole: UserRoleEntity): UserEntity => userRole.user)
    public userRoles!: UserRoleEntity[];

    @OneToMany('AuthAuditEventEntity', (event: AuthAuditEventEntity): UserEntity | null => event.user)
    public auditEvents!: AuthAuditEventEntity[];
}
