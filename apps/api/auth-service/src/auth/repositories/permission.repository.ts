import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from '../entities/permission.entity';
import { RolePermissionEntity } from '../entities/role-permission.entity';

@Injectable()
export class PermissionRepository {
    public constructor(
        @InjectRepository(PermissionEntity) private readonly permissionRepository: Repository<PermissionEntity>,
        @InjectRepository(RolePermissionEntity) private readonly rolePermissionRepository: Repository<RolePermissionEntity>
    ) {}

    public findByKey(key: string): Promise<PermissionEntity | null> {
        return this.permissionRepository.findOne({ where: { key } });
    }

    public findAll(): Promise<PermissionEntity[]> {
        return this.permissionRepository.find();
    }

    public findPermissionsByUserId(userId: string): Promise<PermissionEntity[]> {
        return this.permissionRepository
            .createQueryBuilder('permission')
            .innerJoin('permission.rolePermissions', 'rolePermission')
            .innerJoin('rolePermission.role', 'role')
            .innerJoin('role.userRoles', 'userRole')
            .where('userRole.user_id = :userId', { userId })
            .getMany();
    }

    public async findPermissionsByRoleId(roleId: string): Promise<PermissionEntity[]> {
        const rolePermissions = await this.rolePermissionRepository.find({
            where: { roleId },
            relations: { permission: true },
        });

        return rolePermissions.map((rolePermission: RolePermissionEntity): PermissionEntity => rolePermission.permission);
    }

    public assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermissionEntity> {
        const rolePermission = this.rolePermissionRepository.create({ roleId, permissionId });

        return this.rolePermissionRepository.save(rolePermission);
    }

    public async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
        await this.rolePermissionRepository.delete({ roleId, permissionId });
    }
}
