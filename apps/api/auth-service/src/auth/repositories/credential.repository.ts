import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CredentialProvider } from '../entities/auth.enums';
import { UserCredentialEntity } from '../entities/user-credential.entity';

@Injectable()
export class CredentialRepository {
    public constructor(@InjectRepository(UserCredentialEntity) private readonly repository: Repository<UserCredentialEntity>) {}

    public findLocalCredentialByUserId(userId: string): Promise<UserCredentialEntity | null> {
        return this.repository.findOne({
            where: {
                userId,
                provider: CredentialProvider.LOCAL,
            },
        });
    }

    public findLocalCredentialByEmail(email: string): Promise<UserCredentialEntity | null> {
        return this.repository
            .createQueryBuilder('credential')
            .innerJoinAndSelect('credential.user', 'user')
            .where('credential.provider = :provider', { provider: CredentialProvider.LOCAL })
            .andWhere('user.email = :email', { email })
            .getOne();
    }

    public createLocalCredential(userId: string, passwordHash: string): Promise<UserCredentialEntity> {
        const credential = this.repository.create({
            userId,
            provider: CredentialProvider.LOCAL,
            passwordHash,
            passwordChangedAt: new Date(),
        });

        return this.repository.save(credential);
    }

    public async updatePasswordHash(userId: string, passwordHash: string, changedAt: Date): Promise<void> {
        await this.repository.update(
            {
                userId,
                provider: CredentialProvider.LOCAL,
            },
            {
                passwordHash,
                passwordChangedAt: changedAt,
            }
        );
    }
}
