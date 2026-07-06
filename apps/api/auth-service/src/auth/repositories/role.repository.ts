import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';

@Injectable()
export class RoleRepository {
    public constructor(
        @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
        @InjectRepository(UserRoleEntity) private readonly userRoleRepository: Repository<UserRoleEntity>
    ) {}

    public findByKey(key: string): Promise<RoleEntity | null> {
        return this.roleRepository.findOne({ where: { key } });
    }

    public findAll(): Promise<RoleEntity[]> {
        return this.roleRepository.find();
    }

    public async assignRoleToUser(userId: string, roleId: string): Promise<UserRoleEntity> {
        const userRole = this.userRoleRepository.create({ userId, roleId });

        return this.userRoleRepository.save(userRole);
    }

    public async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
        await this.userRoleRepository.delete({ userId, roleId });
    }

    public async findUserRoles(userId: string): Promise<RoleEntity[]> {
        const userRoles = await this.userRoleRepository.find({
            where: { userId },
            relations: { role: true },
        });

        return userRoles.map((userRole: UserRoleEntity): RoleEntity => userRole.role);
    }
}
