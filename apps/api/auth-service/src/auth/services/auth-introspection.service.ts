import { IntrospectResDto, TIntrospectRequestDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, constructLogMsg, type PinoAppLogger, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CurrentUserService } from './current-user.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthIntrospectionService {
    public constructor(
        private readonly tokenService: TokenService,
        private readonly currentUserService: CurrentUserService,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async introspect(params: WithAppCtx<{ body: TIntrospectRequestDto }>): Promise<ApiResponse<IntrospectResDto>> {
        const msg = constructLogMsg(AuthIntrospectionService.name, 'introspect', params.headers);

        try {
            this.log.info(`${msg}::introspect::started`);
            const claims = await this.tokenService.verifyAccessToken(params.body.token);
            this.log.info(`${msg}::introspect::access-token verified`);

            const data = await this.currentUserService.buildIntrospection(claims.sub, claims.sid);
            this.log.info(`${msg}::introspect::active user built`);

            return ApiResponse.builder<IntrospectResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new IntrospectResDto(data) })
                .build();
        } catch {
            this.log.info(`${msg}::introspect::inactive`);
            return ApiResponse.builder<IntrospectResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new IntrospectResDto({ active: false }) })
                .build();
        }
    }
}
