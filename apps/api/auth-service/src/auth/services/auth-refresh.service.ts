import { RefreshResDto, TRefreshRequestDto } from '@fuel-pass/contracts/backend';
import {
    ApiResponse,
    AppHttpError,
    constructErrorMsg,
    constructLogMsg,
    type PinoAppLogger,
    type WithAppCtx,
} from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthException, AuthFailure } from '../auth.errors';
import type { RequestMetadata } from '../types/auth-request.types';
import { AuditService, AuthAuditEventType } from './audit.service';
import { CurrentUserService } from './current-user.service';
import { RefreshTokenService } from './refresh-token.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthRefreshService {
    public constructor(
        private readonly refreshTokenService: RefreshTokenService,
        private readonly currentUserService: CurrentUserService,
        private readonly tokenService: TokenService,
        private readonly sessionService: SessionService,
        private readonly auditService: AuditService,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async refresh(params: WithAppCtx<{ body: TRefreshRequestDto }>): Promise<ApiResponse<RefreshResDto>> {
        const { headers, body } = params;
        const requestMetadata = this.toRequestMetadata(params);
        const msg = constructLogMsg(AuthRefreshService.name, 'refresh', headers);

        try {
            this.log.info(`${msg}::refresh::started`);
            const rotatedToken = await this.refreshTokenService.rotateRefreshToken(body.refreshToken, requestMetadata);
            this.log.info(`${msg}::refresh::refresh-token rotated`);

            const currentUser = await this.currentUserService.buildCurrentUser(rotatedToken.record.userId, rotatedToken.record.sessionId);
            this.log.info(`${msg}::refresh::current-user built`);

            const accessToken = await this.tokenService.generateAccessToken({
                sub: currentUser.id,
                sid: rotatedToken.record.sessionId,
                jti: this.tokenService.generateTokenId(),
                email: currentUser.email,
                roles: currentUser.roles,
                permissions: currentUser.permissions,
            });
            this.log.info(`${msg}::refresh::access-token generated`);

            await this.sessionService.updateLastSeen(rotatedToken.record.sessionId);
            this.log.info(`${msg}::refresh::session last-seen updated`);

            await this.auditService.write({
                userId: currentUser.id,
                sessionId: rotatedToken.record.sessionId,
                eventType: AuthAuditEventType.TOKEN_REFRESHED,
                success: true,
                requestMetadata,
            });
            this.log.info(`${msg}::refresh::audit written`);

            return ApiResponse.builder<RefreshResDto>()
                .withSuccess({
                    status: HttpStatus.OK,
                    data: new RefreshResDto({
                        accessToken,
                        refreshToken: rotatedToken.rawToken,
                        expiresIn: this.tokenService.accessTokenTtlSeconds,
                        tokenType: 'Bearer',
                    }),
                })
                .build();
        } catch (e: unknown) {
            if (e instanceof AuthFailure) {
                this.log.info(`${msg}::refresh::auth-failure::${e.key}`);
                await this.auditService.write({
                    eventType: AuthAuditEventType.REFRESH_TOKEN_REUSED,
                    success: false,
                    failureReason: e.key,
                    requestMetadata,
                });

                return ApiResponse.fromAppError(new AuthException(HttpStatus.UNAUTHORIZED, e.key)) as ApiResponse<RefreshResDto>;
            }

            if (e instanceof AppHttpError) {
                this.log.error(constructErrorMsg(AuthRefreshService.name, 'refresh', headers), { error: e });
                return ApiResponse.fromAppError(e) as ApiResponse<RefreshResDto>;
            }

            this.log.error(constructErrorMsg(AuthRefreshService.name, 'refresh', headers), { error: e });
            throw e;
        }
    }

    private toRequestMetadata(params: WithAppCtx): RequestMetadata {
        return {
            ipAddress: params.headers.clientIp || null,
            userAgent: params.headers.userAgent || null,
            deviceName: null,
        };
    }
}
