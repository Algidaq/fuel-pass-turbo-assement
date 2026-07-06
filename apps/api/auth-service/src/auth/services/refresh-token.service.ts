import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { RefreshTokenStatus } from '../entities/auth.enums';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { AuthFailure } from '../auth.errors';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import type { RequestMetadata } from '../types/auth-request.types';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

export interface IssuedRefreshToken {
    rawToken: string;
    record: RefreshTokenEntity;
}

@Injectable()
export class RefreshTokenService {
    public constructor(
        private readonly dataSource: DataSource,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly sessionService: SessionService,
        private readonly tokenService: TokenService
    ) {}

    public async issueRefreshToken(
        userId: string,
        sessionId: string,
        familyId: string,
        metadata: RequestMetadata,
        manager?: EntityManager
    ): Promise<IssuedRefreshToken> {
        const rawToken = this.tokenService.generateRefreshToken();
        const tokenHash = this.tokenService.hashRefreshToken(rawToken);
        const expiresAt = new Date(Date.now() + this.tokenService.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
        const record = await this.refreshTokenRepository.createRefreshToken(
            {
                userId,
                sessionId,
                tokenHash,
                familyId,
                expiresAt,
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent,
            },
            manager
        );

        return { rawToken, record };
    }

    public async validateRefreshToken(rawToken: string, manager?: EntityManager): Promise<RefreshTokenEntity> {
        const tokenHash = this.tokenService.hashRefreshToken(rawToken);
        const tokenRecord = await this.refreshTokenRepository.findByTokenHash(tokenHash, manager);

        if (tokenRecord === null) {
            throw new AuthFailure('InvalidToken');
        }

        if (tokenRecord.status !== RefreshTokenStatus.ACTIVE || tokenRecord.expiresAt.getTime() <= Date.now()) {
            await this.detectRefreshTokenReuse(tokenRecord, manager);
            throw new AuthFailure('InvalidToken');
        }

        return tokenRecord;
    }

    public async rotateRefreshToken(rawToken: string, metadata: RequestMetadata): Promise<IssuedRefreshToken> {
        const rotatedToken = await this.dataSource.transaction(async (manager: EntityManager): Promise<IssuedRefreshToken | null> => {
            let oldToken: RefreshTokenEntity;

            try {
                oldToken = await this.validateRefreshToken(rawToken, manager);
            } catch (error: unknown) {
                if (error instanceof AuthFailure) {
                    return null;
                }

                throw error;
            }

            const newToken = await this.issueRefreshToken(oldToken.userId, oldToken.sessionId, oldToken.familyId, metadata, manager);

            await this.refreshTokenRepository.markAsRotated(oldToken.id, newToken.record.id, new Date(), manager);

            return newToken;
        });

        if (rotatedToken === null) {
            throw new AuthFailure('InvalidToken');
        }

        return rotatedToken;
    }

    public async detectRefreshTokenReuse(tokenRecord: RefreshTokenEntity, manager?: EntityManager): Promise<void> {
        await this.refreshTokenRepository.markAsReused(tokenRecord.id, manager);
        await this.refreshTokenRepository.revokeByFamilyId(tokenRecord.familyId, 'refresh_token_reuse_detected', manager);
        await this.sessionService.revokeSession(tokenRecord.sessionId, 'refresh_token_reuse_detected', manager);
    }

    public revokeRefreshTokensBySession(sessionId: string, reason: string, manager?: EntityManager): Promise<void> {
        return this.refreshTokenRepository.revokeBySessionId(sessionId, reason, manager);
    }

    public revokeRefreshTokenFamily(familyId: string, reason: string, manager?: EntityManager): Promise<void> {
        return this.refreshTokenRepository.revokeByFamilyId(familyId, reason, manager);
    }

    public async revokeRefreshToken(rawToken: string, reason: string): Promise<void> {
        const tokenHash = this.tokenService.hashRefreshToken(rawToken);
        const tokenRecord = await this.refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenRecord !== null) {
            await this.refreshTokenRepository.revokeToken(tokenRecord.id, reason);
        }
    }
}
