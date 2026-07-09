import { LogoutResDto, TLogoutRequestDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, constructErrorMsg, constructLogMsg, PinoAppLogger, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal, RequestMetadata } from '../types/auth-request.types';
import { AuditService, AuthAuditEventType } from './audit.service';
import { RefreshTokenService } from './refresh-token.service';
import { SessionService } from './session.service';

@Injectable()
export class AuthLogoutService {
    public constructor(
        private readonly sessionService: SessionService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly auditService: AuditService,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async logout(
        params: WithAppCtx<{ body: TLogoutRequestDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<LogoutResDto>> {
        const { body, principal } = params;
        const requestMetadata = this.toRequestMetadata(params);
        const msg = constructLogMsg(AuthLogoutService.name, 'logout', params.headers);

        try {
            this.log.info(`${msg}::logout::started`);
            await this.sessionService.revokeSession(principal.sessionId, 'logout');
            this.log.info(`${msg}::logout::session revoked`);

            await this.refreshTokenService.revokeRefreshTokensBySession(principal.sessionId, 'logout');
            this.log.info(`${msg}::logout::session refresh-tokens revoked`);

            if (body.refreshToken !== undefined && body.refreshToken.trim().length > 0) {
                this.log.info(`${msg}::logout::request refresh-token provided`);
                await this.refreshTokenService.revokeRefreshToken(body.refreshToken, 'logout');
            } else {
                this.log.info(`${msg}::logout::request refresh-token skipped`);
            }

            await this.auditService.write({
                userId: principal.userId,
                sessionId: principal.sessionId,
                eventType: AuthAuditEventType.LOGOUT,
                success: true,
                requestMetadata,
            });
            this.log.info(`${msg}::logout::audit written`);

            return ApiResponse.builder<LogoutResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new LogoutResDto({ success: true }) })
                .build();
        } catch (e: unknown) {
            if (e instanceof AppHttpError) {
                this.log.error(constructErrorMsg(AuthLogoutService.name, 'logout', params.headers), { error: e });
                return ApiResponse.fromAppError(e) as ApiResponse<LogoutResDto>;
            }

            this.log.error(constructErrorMsg(AuthLogoutService.name, 'logout', params.headers), { error: e });
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
