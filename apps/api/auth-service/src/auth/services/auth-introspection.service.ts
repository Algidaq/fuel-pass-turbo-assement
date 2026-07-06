import { IntrospectResDto, TIntrospectRequestDto } from '@fuel-pass/contracts';
import { ApiResponse, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CurrentUserService } from './current-user.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthIntrospectionService {
    public constructor(
        private readonly tokenService: TokenService,
        private readonly currentUserService: CurrentUserService
    ) {}

    public async introspect(params: WithAppCtx<{ body: TIntrospectRequestDto }>): Promise<ApiResponse<IntrospectResDto>> {
        try {
            const claims = await this.tokenService.verifyAccessToken(params.body.token);
            const data = await this.currentUserService.buildIntrospection(claims.sub, claims.sid);

            return ApiResponse.builder<IntrospectResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new IntrospectResDto(data) })
                .build();
        } catch {
            return ApiResponse.builder<IntrospectResDto>()
                .withSuccess({ status: HttpStatus.OK, data: new IntrospectResDto({ active: false }) })
                .build();
        }
    }
}
