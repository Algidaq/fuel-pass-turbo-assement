import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { PermissionEntity } from './permission.entity';
import type { RoleEntity } from './role.entity';

@Entity({ name: 'role_permissions' })
export class RolePermissionEntity {
    @PrimaryColumn({ name: 'role_id', type: 'varchar', length: 36 })
    public roleId!: string;

    @PrimaryColumn({ name: 'permission_id', type: 'varchar', length: 36 })
    public permissionId!: string;

    @CreateDateColumn({ name: 'assigned_at' })
    public assignedAt!: Date;

    @ManyToOne('RoleEntity', (role: RoleEntity): RolePermissionEntity[] => role.rolePermissions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'role_id' })
    public role!: RoleEntity;

    @ManyToOne('PermissionEntity', (permission: PermissionEntity): RolePermissionEntity[] => permission.rolePermissions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'permission_id' })
    public permission!: PermissionEntity;
}
