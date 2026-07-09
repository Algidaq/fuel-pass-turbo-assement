import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { RefreshTokenStatus } from '../entities/auth.enums';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export interface CreateRefreshTokenData {
    userId: string;
    sessionId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
}

@Injectable()
export class RefreshTokenRepository {
    public constructor(@InjectRepository(RefreshTokenEntity) private readonly repository: Repository<RefreshTokenEntity>) {}

    public createRefreshToken(data: CreateRefreshTokenData, manager?: EntityManager): Promise<RefreshTokenEntity> {
        const repository = this.getRepository(manager);
        const refreshToken = repository.create(data);

        return repository.save(refreshToken);
    }

    public findByTokenHash(tokenHash: string, manager?: EntityManager): Promise<RefreshTokenEntity | null> {
        return this.getRepository(manager).findOne({ where: { tokenHash } });
    }

    public findActiveByTokenHash(tokenHash: string, manager?: EntityManager): Promise<RefreshTokenEntity | null> {
        return this.getRepository(manager).findOne({
            where: {
                tokenHash,
                status: RefreshTokenStatus.ACTIVE,
            },
        });
    }

    public async markAsRotated(tokenId: string, rotatedToTokenId: string, usedAt: Date, manager?: EntityManager): Promise<void> {
        await this.getRepository(manager).update(
            { id: tokenId },
            {
                status: RefreshTokenStatus.ROTATED,
                rotatedToTokenId,
                usedAt,
            }
        );
    }

    public async revokeToken(tokenId: string, reason: string, manager?: EntityManager): Promise<void> {
        await this.getRepository(manager).update(
            { id: tokenId },
            {
                status: RefreshTokenStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: reason,
            }
        );
    }

    public async revokeBySessionId(sessionId: string, reason: string, manager?: EntityManager): Promise<void> {
        await this.revokeWhere({ sessionId }, reason, manager);
    }

    public async revokeByUserId(userId: string, reason: string, manager?: EntityManager): Promise<void> {
        await this.revokeWhere({ userId }, reason, manager);
    }

    public async revokeByFamilyId(familyId: string, reason: string, manager?: EntityManager): Promise<void> {
        await this.revokeWhere({ familyId }, reason, manager);
    }

    public async markAsReused(tokenId: string, manager?: EntityManager): Promise<void> {
        await this.getRepository(manager).update({ id: tokenId }, { status: RefreshTokenStatus.REUSED, usedAt: new Date() });
    }

    private async revokeWhere(
        where: Partial<Pick<RefreshTokenEntity, 'familyId' | 'sessionId' | 'userId'>>,
        reason: string,
        manager?: EntityManager
    ): Promise<void> {
        await this.getRepository(manager).update(where, {
            status: RefreshTokenStatus.REVOKED,
            revokedAt: new Date(),
            revokedReason: reason,
        });
    }

    private getRepository(manager?: EntityManager): Repository<RefreshTokenEntity> {
        return manager?.getRepository(RefreshTokenEntity) ?? this.repository;
    }
}
