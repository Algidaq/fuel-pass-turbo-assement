import { CurrentUserResDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../types/auth-request.types';
import { CurrentUserService } from './current-user.service';

@Injectable()
export class AuthCurrentUserService {
    public constructor(private readonly currentUserService: CurrentUserService) {}

    public async getCurrentUser(params: WithAppCtx<{ principal: AuthenticatedPrincipal }>): Promise<ApiResponse<CurrentUserResDto>> {
        try {
            const data = await this.currentUserService.getCurrentUser(params.principal.userId, params.principal.sessionId);

            return ApiResponse.builder<CurrentUserResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new CurrentUserResDto(data) })
                .build();
        } catch (e: unknown) {
            if (e instanceof AppHttpError) {
                return ApiResponse.fromAppError(e) as ApiResponse<CurrentUserResDto>;
            }

            throw e;
        }
    }
}
