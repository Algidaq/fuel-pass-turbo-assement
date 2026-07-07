import type { WithAppCtx } from '@fuel-pass/node-commons';
import { envs } from '../../../configs/config';
import type { UserEntity, UserSessionEntity } from '../../entities';
export abstract class AbstractSessionCreationService {
    public refreshTokenTtlDays: number = envs.auth.refreshToken.ttlInDays;

    public getSessionExpiryAt(): Date {
        return new Date(Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
    }

    public getRefreshTokenExpiryAt(): Date {
        return new Date(Date.now() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
    }

    public getRefreshTokenFamilyId(): string {
        return envs.auth.refreshToken.familyId;
    }

    public abstract createSession(
        params: WithAppCtx<{
            tokenHash: string;
            user: UserEntity;
        }>
    ): Promise<UserSessionEntity>;
}
