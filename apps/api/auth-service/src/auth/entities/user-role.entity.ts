import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { RoleEntity } from './role.entity';
import type { UserEntity } from './user.entity';

@Entity({ name: 'user_roles' })
export class UserRoleEntity {
    @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 36 })
    public userId!: string;

    @PrimaryColumn({ name: 'role_id', type: 'varchar', length: 36 })
    public roleId!: string;

    @CreateDateColumn({ name: 'assigned_at' })
    public assignedAt!: Date;

    @ManyToOne('UserEntity', (user: UserEntity): UserRoleEntity[] => user.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    public user!: UserEntity;

    @ManyToOne('RoleEntity', (role: RoleEntity): UserRoleEntity[] => role.userRoles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    public role!: RoleEntity;
}
