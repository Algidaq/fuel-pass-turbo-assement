import type {
    CreateInternalUserResDto,
    IntrospectResDto,
    TCreateInternalUserRequestDto,
    TIntrospectRequestDto,
} from '@fuel-pass/contracts/backend';
import { createInternalUserReqDtoSchema, introspectReqDtoSchema } from '@fuel-pass/contracts/backend';
import { ApiResponse, CsHeaders, ZodValidationPipe, type BaseApiHeaders } from '@fuel-pass/node-commons';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../guards/internal-api-key.guard';
import { AuthIntrospectionService } from '../services/auth-introspection.service';
import { InternalUserCreationService } from '../services/internal-user-creation.service';

@Controller('internal/auth')
export class InternalAuthController {
    public constructor(
        private readonly introspectionService: AuthIntrospectionService,
        private readonly internalUserCreationService: InternalUserCreationService
    ) {}

    @UseGuards(InternalApiKeyGuard)
    @Post('introspect')
    public introspect(
        @Body(new ZodValidationPipe(introspectReqDtoSchema)) body: TIntrospectRequestDto,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<IntrospectResDto>> {
        return this.introspectionService.introspect({ headers, body });
    }

    @UseGuards(InternalApiKeyGuard)
    @Post('users')
    public async createUser(
        @Body(new ZodValidationPipe(createInternalUserReqDtoSchema)) body: TCreateInternalUserRequestDto,
        @CsHeaders() headers: BaseApiHeaders
    ): Promise<ApiResponse<CreateInternalUserResDto>> {
        return this.internalUserCreationService.createUser({ headers, body });
    }
}
