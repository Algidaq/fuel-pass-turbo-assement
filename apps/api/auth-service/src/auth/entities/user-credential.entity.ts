import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CredentialProvider } from './auth.enums';
import type { UserEntity } from './user.entity';

@Entity({ name: 'user_credentials' })
@Index('idx_user_credentials_user_id', ['userId'])
@Index('uq_user_credentials_provider_provider_user_id', ['provider', 'providerUserId'], {
    unique: true,
    where: 'provider_user_id IS NOT NULL',
})
export class UserCredentialEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'user_id', type: 'uuid' })
    public userId!: string;

    @Column({
        name: 'provider',
        type: 'simple-enum',
        enum: CredentialProvider,
    })
    public provider!: CredentialProvider;

    @Column({ name: 'provider_user_id', type: 'varchar', length: 255, nullable: true })
    public providerUserId!: string | null;

    @Column({ name: 'password_hash', type: 'text', nullable: true })
    public passwordHash!: string | null;

    @Column({ name: 'password_changed_at', type: Date, nullable: true })
    public passwordChangedAt!: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt!: Date;

    @ManyToOne('UserEntity', (user: UserEntity): UserCredentialEntity[] => user.credentials, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    public user!: UserEntity;
}
