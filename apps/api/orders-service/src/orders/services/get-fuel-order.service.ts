import { FuelOrderResDto, ORDER_PERMISSIONS, type TFuelOrderIdParamDto, type TFuelOrderQueryDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type AuthenticatedPrincipal, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { collectFuelOrderUserIds, mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { OrderException } from '../orders.errors';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';
import { InternalAuthUsersService } from './internal-auth-users.service';

@Injectable()
export class GetFuelOrderService {
    public constructor(
        private readonly fuelOrderRepository: FuelOrderRepository,
        private readonly internalAuthUsersService: InternalAuthUsersService
    ) {}

    public async getFuelOrder(
        params: WithAppCtx<{ id: TFuelOrderIdParamDto; query?: TFuelOrderQueryDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<FuelOrderResDto>> {
        try {
            const fuelOrder =
                params.query?.include_status_history === true
                    ? await this.fuelOrderRepository.findByIdWithStatusHistoryOrThrow(params.id)
                    : await this.fuelOrderRepository.findByIdOrThrow(params.id);
            if (!this.canReadAllFuelOrders(params.principal) && fuelOrder.submittedByUserId !== params.principal.userId) {
                throw new OrderException(HttpStatus.NOT_FOUND, 'FuelOrderNotFound');
            }

            const usersById =
                params.query?.include_user === true
                    ? await this.internalAuthUsersService.lookupUsersByIds(collectFuelOrderUserIds([fuelOrder]))
                    : undefined;

            return ApiResponse.builder<FuelOrderResDto>()
                .withSuccess({ status: HttpStatus.OK, data: mapFuelOrderToResponse(fuelOrder, { usersById }) })
                .build();
        } catch (error: unknown) {
            if (error instanceof AppHttpError) {
                return ApiResponse.fromAppError(error) as ApiResponse<FuelOrderResDto>;
            }
            throw error;
        }
    }

    private canReadAllFuelOrders(principal: AuthenticatedPrincipal): boolean {
        return principal.permissions.includes(ORDER_PERMISSIONS.fuelOrderReadAll.key);
    }
}
