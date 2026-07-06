import {
    CurrentUserResDto,
    LogoutResDto,
    RefreshResDto,
    loginReqDtoSchema,
    logoutReqDtoSchema,
    refreshReqDtoSchema,
    type LoginResDto,
    type TLogoutRequestDto,
    type TLoginRequestDto,
    type TRefreshRequestDto,
} from '@fuel-pass/contracts';
import { ApiResponse, constructErrorMsg, CsHeaders, ZodValidationPipe, type BaseApiHeaders } from '@fuel-pass/node-commons';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthCurrentUserService } from '../services/auth-current-user.service';
import { AuthLoginService } from '../services/auth-login.service';
import { AuthLogoutService } from '../services/auth-logout.service';
import { AuthRefreshService } from '../services/auth-refresh.service';
import type { AuthenticatedRequest } from '../types/auth-request.types';
@Controller('/v1/auth')
export class AuthController {
    public constructor(
        private readonly loginService: AuthLoginService,
        private readonly refreshService: AuthRefreshService,
        private readonly logoutService: AuthLogoutService,
        private readonly currentUserEndpointService: AuthCurrentUserService
    ) {}

    @Post('login')
    public async login(
        @Body(new ZodValidationPipe(loginReqDtoSchema)) body: TLoginRequestDto,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<LoginResDto>> {
        try {
            const data = await this.loginService.login({ headers, body });
            return data;
        } catch (error: unknown) {
            const __errorMessage = constructErrorMsg(AuthController.name, 'login', headers);
            throw error;
        }
    }

    @Post('refresh')
    public async refresh(
        @Body(new ZodValidationPipe(refreshReqDtoSchema)) body: TRefreshRequestDto,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<RefreshResDto>> {
        try {
            return await this.refreshService.refresh({ headers, body });
        } catch (error: unknown) {
            const __errorMessage = constructErrorMsg(AuthController.name, 'refresh', headers);
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    public async logout(
        @Body(new ZodValidationPipe(logoutReqDtoSchema)) body: TLogoutRequestDto,
        @Req() request: AuthenticatedRequest,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<LogoutResDto>> {
        try {
            return await this.logoutService.logout({ headers, body, principal: request.auth });
        } catch (error: unknown) {
            const __errorMessage = constructErrorMsg(AuthController.name, 'logout', headers);
            throw error;
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    public async me(@Req() request: AuthenticatedRequest, @CsHeaders() headers: BaseApiHeaders): Promise<ApiResponse<CurrentUserResDto>> {
        try {
            return await this.currentUserEndpointService.getCurrentUser({ headers, principal: request.auth });
        } catch (error: unknown) {
            const __errorMessage = constructErrorMsg(AuthController.name, 'me', headers);
            throw error;
        }
    }
}
