import { FuelOrderResDto, ORDER_PERMISSIONS, type TFuelOrderIdParamDto, type TFuelOrderQueryDto } from '@fuel-pass/contracts/backend';
import {
    ApiResponse,
    AppHttpError,
    constructErrorMsg,
    constructLogMsg,
    PinoAppLogger,
    type AuthenticatedPrincipal,
    type WithAppCtx,
} from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { collectFuelOrderUserIds, mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { OrderException } from '../orders.errors';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';
import { InternalAuthUsersService } from './internal-auth-users.service';

@Injectable()
export class GetFuelOrderService {
    public constructor(
        private readonly fuelOrderRepository: FuelOrderRepository,
        private readonly internalAuthUsersService: InternalAuthUsersService,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async getFuelOrder(
        params: WithAppCtx<{ id: TFuelOrderIdParamDto; query?: TFuelOrderQueryDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<FuelOrderResDto>> {
        const msg = constructLogMsg(GetFuelOrderService.name, 'getFuelOrder', params.headers);

        try {
            this.log.info(`${msg}::get-fuel-order::started`);
            const fuelOrder =
                params.query?.include_status_history === true
                    ? await this.fuelOrderRepository.findByIdWithStatusHistoryOrThrow(params.id)
                    : await this.fuelOrderRepository.findByIdOrThrow(params.id);
            this.log.info(
                `${msg}::get-fuel-order::status-history ${params.query?.include_status_history === true ? 'included' : 'skipped'}`
            );

            if (!this.canReadAllFuelOrders(params.principal) && fuelOrder.submittedByUserId !== params.principal.userId) {
                this.log.info(`${msg}::get-fuel-order::read-own denied`);
                throw new OrderException(HttpStatus.NOT_FOUND, 'FuelOrderNotFound');
            }

            const usersById =
                params.query?.include_user === true
                    ? await this.internalAuthUsersService.lookupUsersByIds(collectFuelOrderUserIds([fuelOrder]))
                    : undefined;
            this.log.info(`${msg}::get-fuel-order::users ${usersById === undefined ? 'skipped' : 'included'}`);

            return ApiResponse.builder<FuelOrderResDto>()
                .withSuccess({ status: HttpStatus.OK, data: mapFuelOrderToResponse(fuelOrder, { usersById }) })
                .build();
        } catch (error: unknown) {
            if (error instanceof AppHttpError) {
                this.log.error(constructErrorMsg(GetFuelOrderService.name, 'getFuelOrder', params.headers), { error });
                return ApiResponse.fromAppError(error) as ApiResponse<FuelOrderResDto>;
            }
            this.log.error(constructErrorMsg(GetFuelOrderService.name, 'getFuelOrder', params.headers), { error });
            throw error;
        }
    }

    private canReadAllFuelOrders(principal: AuthenticatedPrincipal): boolean {
        return principal.permissions.includes(ORDER_PERMISSIONS.fuelOrderReadAll.key);
    }
}
