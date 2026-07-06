import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { RolePermissionEntity } from './role-permission.entity';

@Entity({ name: 'permissions' })
@Index('uq_permissions_key', ['key'], { unique: true })
export class PermissionEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ name: 'key', type: 'varchar', length: 150 })
    public key!: string;

    @Column({ name: 'resource', type: 'varchar', length: 100 })
    public resource!: string;

    @Column({ name: 'action', type: 'varchar', length: 100 })
    public action!: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    public description!: string | null;

    @CreateDateColumn({ name: 'created_at' })
    public createdAt!: Date;

    @OneToMany('RolePermissionEntity', (rolePermission: RolePermissionEntity): PermissionEntity => rolePermission.permission)
    public rolePermissions!: RolePermissionEntity[];
}
