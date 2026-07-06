import type {
    CurrentUserResponseDto,
    LoginRequestDto,
    LoginResponseDto,
    LogoutRequestDto,
    LogoutResponseDto,
    RefreshRequestDto,
    RefreshResponseDto,
} from '@fuel-pass/contracts';
import { ApiResponse } from '@fuel-pass/node-commons';
import { Body, Controller, Get, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_ERRORS, AuthFailure } from '../auth.errors';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';
import type { AuthenticatedRequest } from '../types/auth-request.types';
import { requestMetadataFromRequest } from '../types/auth-request.types';

@Controller('auth')
export class AuthController {
    public constructor(private readonly authService: AuthService) {}

    @Post('login')
    public async login(@Body() body: Partial<LoginRequestDto>, @Req() request: Request): Promise<ApiResponse<LoginResponseDto>> {
        if (
            typeof body.email !== 'string' ||
            typeof body.password !== 'string' ||
            body.email.trim().length === 0 ||
            body.password.length === 0
        ) {
            return this.failure<LoginResponseDto>('InvalidRequest', HttpStatus.BAD_REQUEST);
        }

        try {
            const data = await this.authService.login(body.email, body.password, requestMetadataFromRequest(request));

            return ApiResponse.builder<LoginResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
        } catch (error: unknown) {
            return this.authFailure<LoginResponseDto>(error);
        }
    }

    @Post('refresh')
    public async refresh(@Body() body: Partial<RefreshRequestDto>, @Req() request: Request): Promise<ApiResponse<RefreshResponseDto>> {
        if (typeof body.refreshToken !== 'string' || body.refreshToken.trim().length === 0) {
            return this.failure<RefreshResponseDto>('InvalidRequest', HttpStatus.BAD_REQUEST);
        }

        try {
            const data = await this.authService.refresh(body.refreshToken, requestMetadataFromRequest(request));

            return ApiResponse.builder<RefreshResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
        } catch (error: unknown) {
            return this.authFailure<RefreshResponseDto>(error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    public async logout(
        @Body() body: Partial<LogoutRequestDto>,
        @Req() request: AuthenticatedRequest
    ): Promise<ApiResponse<LogoutResponseDto>> {
        const data = await this.authService.logout(request.auth, body.refreshToken, requestMetadataFromRequest(request));

        return ApiResponse.builder<LogoutResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    public async me(@Req() request: AuthenticatedRequest): Promise<ApiResponse<CurrentUserResponseDto>> {
        try {
            const data = await this.authService.getCurrentUser(request.auth);

            return ApiResponse.builder<CurrentUserResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
        } catch (error: unknown) {
            return this.authFailure<CurrentUserResponseDto>(error);
        }
    }

    private authFailure<T>(error: unknown): ApiResponse<T> {
        if (error instanceof AuthFailure) {
            const status = error.key === 'InactiveUser' ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;

            return this.failure<T>(error.key, status);
        }

        throw error;
    }

    private failure<T>(key: keyof typeof AUTH_ERRORS, status: HttpStatus): ApiResponse<T> {
        return ApiResponse.builder<T>().withFailure({ status, errors: AUTH_ERRORS[key] }).build();
    }
}
