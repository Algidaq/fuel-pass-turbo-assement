import { InternalUserLookupResDto, InternalUserLookupUserResDto, type TInternalUserLookupRequestDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, constructErrorMsg, constructLogMsg, type PinoAppLogger, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class InternalUserLookupService {
    public constructor(
        private readonly userRepository: UserRepository,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async lookupUsers(params: WithAppCtx<{ body: TInternalUserLookupRequestDto }>): Promise<ApiResponse<InternalUserLookupResDto>> {
        const msg = constructLogMsg(InternalUserLookupService.name, 'lookupUsers', params.headers);

        try {
            this.log.info(`${msg}::lookup-users::started`);
            const uniqueUserIds = [...new Set(params.body.userIds)];
            this.log.info(`${msg}::lookup-users::user-ids deduplicated`);

            const users = await this.userRepository.findByIds(uniqueUserIds);
            this.log.info(`${msg}::lookup-users::users found`);

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
        } catch (e: unknown) {
            this.log.error(constructErrorMsg(InternalUserLookupService.name, 'lookupUsers', params.headers), { error: e });
            throw e;
        }
    }
}
