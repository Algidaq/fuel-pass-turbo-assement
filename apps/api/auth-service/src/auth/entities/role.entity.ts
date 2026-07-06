import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { RolePermissionEntity } from './role-permission.entity';
import type { UserRoleEntity } from './user-role.entity';

@Entity({ name: 'roles' })
@Index('uq_roles_key', ['key'], { unique: true })
export class RoleEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'key', type: 'varchar', length: 100 })
    public key!: string;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    public name!: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    public description!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date;

    @OneToMany('UserRoleEntity', (userRole: UserRoleEntity): RoleEntity => userRole.role)
    public userRoles!: UserRoleEntity[];

    @OneToMany('RolePermissionEntity', (rolePermission: RolePermissionEntity): RoleEntity => rolePermission.role)
    public rolePermissions!: RolePermissionEntity[];
}
