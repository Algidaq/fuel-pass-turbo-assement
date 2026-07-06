import type {
    CreateInternalUserRequestDto,
    CreateInternalUserResponseDto,
    IntrospectRequestDto,
    IntrospectResponseDto,
} from '@fuel-pass/contracts';
import { ApiResponse } from '@fuel-pass/node-commons';
import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AUTH_ERRORS, AuthFailure } from '../auth.errors';
import { UserStatus } from '../entities/auth.enums';
import { InternalApiKeyGuard } from '../guards/internal-api-key.guard';
import { AuthService } from '../services/auth.service';

@Controller('internal/auth')
export class InternalAuthController {
    public constructor(private readonly authService: AuthService) {}

    @UseGuards(InternalApiKeyGuard)
    @Post('introspect')
    public async introspect(@Body() body: Partial<IntrospectRequestDto>): Promise<ApiResponse<IntrospectResponseDto>> {
        if (typeof body.token !== 'string' || body.token.trim().length === 0) {
            return ApiResponse.builder<IntrospectResponseDto>()
                .withFailure({ status: HttpStatus.BAD_REQUEST, errors: AUTH_ERRORS.InvalidRequest })
                .build();
        }

        const data = await this.authService.introspect(body.token);

        return ApiResponse.builder<IntrospectResponseDto>().withSuccess({ status: HttpStatus.OK, data }).build();
    }

    @UseGuards(InternalApiKeyGuard)
    @Post('users')
    public async createUser(
        @Body() body: Partial<CreateInternalUserRequestDto>
    ): Promise<ApiResponse<CreateInternalUserResponseDto>> {
        if (!this.isCreateUserRequest(body)) {
            return this.failure<CreateInternalUserResponseDto>('InvalidRequest', HttpStatus.BAD_REQUEST);
        }

        try {
            const data = await this.authService.createInternalUser(body);

            return ApiResponse.builder<CreateInternalUserResponseDto>().withSuccess({ status: HttpStatus.CREATED, data }).build();
        } catch (error: unknown) {
            if (error instanceof AuthFailure) {
                const status = error.key === 'UserAlreadyExists' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;

                return this.failure<CreateInternalUserResponseDto>(error.key, status);
            }

            throw error;
        }
    }

    private isCreateUserRequest(body: Partial<CreateInternalUserRequestDto>): body is CreateInternalUserRequestDto {
        return (
            typeof body.email === 'string' &&
            body.email.trim().length > 0 &&
            typeof body.fullName === 'string' &&
            body.fullName.trim().length > 0 &&
            typeof body.password === 'string' &&
            body.password.length > 0 &&
            Array.isArray(body.roleKeys) &&
            body.roleKeys.length > 0 &&
            body.roleKeys.every((roleKey): boolean => typeof roleKey === 'string' && roleKey.trim().length > 0) &&
            (body.status === undefined || Object.values(UserStatus).includes(body.status as UserStatus))
        );
    }

    private failure<T>(key: keyof typeof AUTH_ERRORS, status: HttpStatus): ApiResponse<T> {
        return ApiResponse.builder<T>().withFailure({ status, errors: AUTH_ERRORS[key] }).build();
    }
}
