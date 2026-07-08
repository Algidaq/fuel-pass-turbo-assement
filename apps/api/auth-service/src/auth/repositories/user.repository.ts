import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserStatus } from '../entities/auth.enums';
import { UserEntity } from '../entities/user.entity';

export interface CreateUserData {
    email: string;
    fullName: string;
    status?: UserStatus;
    emailVerifiedAt?: Date | null;
}

@Injectable()
export class UserRepository {
    public constructor(@InjectRepository(UserEntity) private readonly repository: Repository<UserEntity>) {}

    public findById(id: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { id } });
    }

    public findByEmail(email: string): Promise<UserEntity | null> {
        return this.repository.findOne({ where: { email } });
    }

    public findByIds(ids: string[]): Promise<UserEntity[]> {
        return this.repository.find({
            where: {
                id: In(ids),
            },
        });
    }

    public createUser(data: CreateUserData): Promise<UserEntity> {
        const user = this.repository.create(data);

        return this.repository.save(user);
    }

    public async updateLastLogin(userId: string, date: Date): Promise<void> {
        await this.repository.update({ id: userId }, { lastLoginAt: date });
    }

    public async updateStatus(userId: string, status: UserStatus): Promise<void> {
        await this.repository.update({ id: userId }, { status });
    }
}
