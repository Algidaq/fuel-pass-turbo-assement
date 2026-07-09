import axios from 'axios';
import {
    FuelOrderUserResDto,
    type InternalUserLookupResponseDto,
    type InternalUserLookupUserResponseDto,
} from '@fuel-pass/contracts/backend';
import { CORE_AUTH_MODULE_OPTIONS, type CoreAuthModuleOptions, PinoAppLogger, withHttpRetry } from '@fuel-pass/node-commons';
import { Inject, Injectable } from '@nestjs/common';
import type { AxiosResponse } from 'axios';

type ApiResponseEnvelope<TData> = {
    data?: TData;
};

type InternalUserLookupPayload = {
    users: InternalUserLookupUserResponseDto[];
};

@Injectable()
export class InternalAuthUsersService {
    public constructor(
        @Inject(CORE_AUTH_MODULE_OPTIONS) private readonly options: CoreAuthModuleOptions,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async lookupUsersByIds(userIds: string[]): Promise<Map<string, FuelOrderUserResDto>> {
        const msg = `${InternalAuthUsersService.name}::lookupUsersByIds`;
        this.log.info(`${msg}::started`);

        const uniqueUserIds = [...new Set(userIds)];

        if (uniqueUserIds.length === 0) {
            this.log.info(`${msg}::user-ids empty`);
            return new Map();
        }

        try {
            const response = await withHttpRetry((): Promise<AxiosResponse<unknown>> =>
                axios.post<unknown>(
                    `${this.options.internalAuthBaseUrl.replace(/\/+$/u, '')}/users/lookup`,
                    { userIds: uniqueUserIds },
                    {
                        headers: {
                            'content-type': 'application/json',
                            'x-internal-api-key': this.options.internalServiceApiKey,
                        },
                        timeout: this.options.introspectionTimeoutMs,
                    }
                )
            );
            this.log.info(`${msg}::lookup request completed`);

            const lookupResponse = this.extractData(response.data);
            this.log.info(`${msg}::lookup response mapped`);

            return new Map(
                lookupResponse.users.map((user): [string, FuelOrderUserResDto] => [
                    user.id,
                    new FuelOrderUserResDto({
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                    }),
                ])
            );
        } catch (error: unknown) {
            this.log.error(`${msg}::lookup failed`, { error });
            return new Map();
        }
    }

    private extractData(response: unknown): InternalUserLookupPayload {
        const maybeWrapped = response as ApiResponseEnvelope<InternalUserLookupResponseDto>;
        const data = maybeWrapped.data ?? response;
        const lookupResponse = data as InternalUserLookupResponseDto;

        return {
            users: lookupResponse.users.filter((user): user is InternalUserLookupUserResponseDto => user !== undefined),
        };
    }
}
