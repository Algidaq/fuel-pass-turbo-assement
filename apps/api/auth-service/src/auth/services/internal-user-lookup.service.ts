import {
    InternalUserLookupResDto,
    InternalUserLookupUserResDto,
    type TInternalUserLookupRequestDto,
} from '@fuel-pass/contracts/backend';
import { ApiResponse, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class InternalUserLookupService {
    public constructor(private readonly userRepository: UserRepository) {}

    public async lookupUsers(params: WithAppCtx<{ body: TInternalUserLookupRequestDto }>): Promise<ApiResponse<InternalUserLookupResDto>> {
        const uniqueUserIds = [...new Set(params.body.userIds)];
        const users = await this.userRepository.findByIds(uniqueUserIds);

        return ApiResponse.builder<InternalUserLookupResDto>()
            .withSuccess({
                status: HttpStatus.OK,
                data: new InternalUserLookupResDto({
                    users: users.map(
                        (user): InternalUserLookupUserResDto =>
                            new InternalUserLookupUserResDto({
                                id: user.id,
                                email: user.email,
                                fullName: user.fullName,
                            })
                    ),
                }),
            })
            .build();
    }
}
