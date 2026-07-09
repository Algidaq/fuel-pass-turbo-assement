import { constructLogMsg, type WithAppCtx } from '@fuel-pass/node-commons';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { DataSource, InsertResult, UpdateResult } from 'typeorm';
import { AuthAuditEventEntity, RefreshTokenEntity, RefreshTokenStatus, SessionStatus, UserEntity, UserSessionEntity } from '../../entities';
import type { WithEntityManager } from '../../types/utility.types';
import { AuthAuditEventType } from '../audit.service';
import { AbstractSessionCreationService } from './abstract-session-creation.service';
@Injectable()
export class SessionCreationService extends AbstractSessionCreationService {
    public readonly name = SessionCreationService.name;

    public constructor(@InjectDataSource() private dataSource: DataSource) {
        super();
    }

    public override async createSession(params: WithAppCtx<{ tokenHash: string; user: UserEntity }>): Promise<UserSessionEntity> {
        const { headers, tokenHash, user } = params;
        const _msg = constructLogMsg(this.name, 'createSession', headers);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        const manager = queryRunner.manager;

        await queryRunner.startTransaction();
        try {
            const session = await this.createSessionEntry({ headers, manager, user });
            await this.createRefreshTokenEntry({ headers, manager, userId: user.id, sessionId: session.id, tokenHash });
            await this.updateUserEntity({ headers, manager, user });
            await this.addAuthAuditEntry({ headers, manager, sessionId: session.id, userId: user.id });
            await queryRunner.commitTransaction();
            await queryRunner.release();
            return session;
        } catch (e: unknown) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e;
        }
    }

    public createSessionEntry(params: WithEntityManager<{ user: UserEntity }>): Promise<UserSessionEntity> {
        const { headers, user, manager } = params;
        const repo = manager.getRepository(UserSessionEntity);
        const sessionEntity = repo.create({
            userId: user.id,
            ipAddress: headers.clientIp,
            userAgent: headers.userAgent,
            status: SessionStatus.ACTIVE,
            expiresAt: this.getSessionExpiryAt(),
            createdAt: new Date(),
        });
        return repo.save(sessionEntity);
    }

    public createRefreshTokenEntry(
        params: WithEntityManager<{ userId: string; sessionId: string; tokenHash: string }>
    ): Promise<InsertResult> {
        const { headers, manager, tokenHash, sessionId, userId } = params;
        const repo = manager.getRepository(RefreshTokenEntity);

        const entity = RefreshTokenEntity.create({
            familyId: this.getRefreshTokenFamilyId(),
            userId,
            sessionId,
            tokenHash,
            expiresAt: this.getRefreshTokenExpiryAt(),
            ipAddress: headers.clientIp,
            userAgent: headers.userAgent,
            status: RefreshTokenStatus.ACTIVE,
            revokedAt: null,
            revokedReason: null,
            issuedAt: new Date(),
            usedAt: null,
            rotatedToTokenId: null,
        });

        return repo.save(entity) as any;
    }

    public updateUserEntity(params: WithEntityManager<{ user: UserEntity }>): Promise<UpdateResult> {
        const { manager, user } = params;
        const repo = manager.getRepository(UserEntity);

        return repo.update({ id: user.id }, { lastLoginAt: new Date() });
    }

    public addAuthAuditEntry(params: WithEntityManager<{ userId: string; sessionId: string }>): Promise<AuthAuditEventEntity> {
        const { headers, manager, userId, sessionId } = params;
        const repo = manager.getRepository(AuthAuditEventEntity);

        const entity = AuthAuditEventEntity.create({
            eventType: AuthAuditEventType.LOGIN_SUCCESS,
            failureReason: null,
            userId,
            sessionId,
            ipAddress: headers.clientIp,
            userAgent: headers.userAgent,
            success: true,
            metadata: null,
            createdAt: new Date(),
        });

        return repo.save(entity);
    }
}
