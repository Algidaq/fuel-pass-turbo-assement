import { CurrentUserResDto } from '@fuel-pass/contracts/backend';
import {
    ApiResponse,
    AppHttpError,
    constructErrorMsg,
    constructLogMsg,
    type PinoAppLogger,
    type WithAppCtx,
} from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../types/auth-request.types';
import { CurrentUserService } from './current-user.service';

@Injectable()
export class AuthCurrentUserService {
    public constructor(
        private readonly currentUserService: CurrentUserService,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async getCurrentUser(params: WithAppCtx<{ principal: AuthenticatedPrincipal }>): Promise<ApiResponse<CurrentUserResDto>> {
        const msg = constructLogMsg(AuthCurrentUserService.name, 'getCurrentUser', params.headers);

        try {
            this.log.info(`${msg}::get-current-user::started`);
            const data = await this.currentUserService.getCurrentUser(params.principal.userId, params.principal.sessionId);
            this.log.info(`${msg}::get-current-user::current-user loaded`);

            return ApiResponse.builder<CurrentUserResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new CurrentUserResDto(data) })
                .build();
        } catch (e: unknown) {
            if (e instanceof AppHttpError) {
                this.log.error(constructErrorMsg(AuthCurrentUserService.name, 'getCurrentUser', params.headers), { error: e });
                return ApiResponse.fromAppError(e) as ApiResponse<CurrentUserResDto>;
            }

            this.log.error(constructErrorMsg(AuthCurrentUserService.name, 'getCurrentUser', params.headers), { error: e });
            throw e;
        }
    }
}
