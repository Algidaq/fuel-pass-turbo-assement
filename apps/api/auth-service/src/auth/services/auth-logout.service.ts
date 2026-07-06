import { LogoutResDto, TLogoutRequestDto } from '@fuel-pass/contracts';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
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
        private readonly auditService: AuditService
    ) {}

    public async logout(
        params: WithAppCtx<{ body: TLogoutRequestDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<LogoutResDto>> {
        const { body, principal } = params;
        const requestMetadata = this.toRequestMetadata(params);

        try {
            await this.sessionService.revokeSession(principal.sessionId, 'logout');
            await this.refreshTokenService.revokeRefreshTokensBySession(principal.sessionId, 'logout');

            if (body.refreshToken !== undefined && body.refreshToken.trim().length > 0) {
                await this.refreshTokenService.revokeRefreshToken(body.refreshToken, 'logout');
            }

            await this.auditService.write({
                userId: principal.userId,
                sessionId: principal.sessionId,
                eventType: AuthAuditEventType.LOGOUT,
                success: true,
                requestMetadata,
            });

            return ApiResponse.builder<LogoutResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new LogoutResDto({ success: true }) })
                .build();
        } catch (e: unknown) {
            if (e instanceof AppHttpError) {
                return ApiResponse.fromAppError(e) as ApiResponse<LogoutResDto>;
            }

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
