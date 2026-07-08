import {
    FuelOrderStatusCountsResDto,
    ListFuelOrdersResDto,
    ORDER_PERMISSIONS,
    PaginationResDto,
    type TListFuelOrdersQueryDto,
} from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type AuthenticatedPrincipal, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { FuelOrderStatus } from '../entities/order.enums';
import { collectFuelOrderUserIds, mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';
import { InternalAuthUsersService } from './internal-auth-users.service';

@Injectable()
export class ListFuelOrdersService {
    public constructor(
        private readonly fuelOrderRepository: FuelOrderRepository,
        private readonly internalAuthUsersService: InternalAuthUsersService
    ) {}

    public async listFuelOrders(
        params: WithAppCtx<{ query: TListFuelOrdersQueryDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<ListFuelOrdersResDto>> {
        try {
            const { query } = params;
            const submittedByUserId = this.canReadAllFuelOrders(params.principal) ? undefined : params.principal.userId;
            const [items, totalItems] = await this.fuelOrderRepository.findManyAndCount({
                airportIcaoCode: query.airportIcaoCode,
                submittedByUserId,
                status: query.status as FuelOrderStatus | undefined,
                page: query.page,
                pageSize: query.pageSize,
            });
            const statusCounts =
                query.include_status === true
                    ? await this.fuelOrderRepository.countByStatus({
                          airportIcaoCode: query.airportIcaoCode,
                          submittedByUserId,
                          status: query.status as FuelOrderStatus | undefined,
                      })
                    : undefined;
            const usersById =
                query.include_user === true
                    ? await this.internalAuthUsersService.lookupUsersByIds(collectFuelOrderUserIds(items))
                    : undefined;
            const totalPages = Math.ceil(totalItems / query.pageSize);

            return ApiResponse.builder<ListFuelOrdersResDto>()
                .withSuccess({
                    status: HttpStatus.OK,
                    data: new ListFuelOrdersResDto({
                        items: items.map((item): ReturnType<typeof mapFuelOrderToResponse> => mapFuelOrderToResponse(item, { usersById })),
                        pagination: new PaginationResDto({
                            page: query.page,
                            pageSize: query.pageSize,
                            totalItems,
                            totalPages,
                        }),
                        ...(statusCounts === undefined ? {} : { statusCounts: new FuelOrderStatusCountsResDto(statusCounts) }),
                    }),
                })
                .build();
        } catch (error: unknown) {
            if (error instanceof AppHttpError) {
                return ApiResponse.fromAppError(error) as ApiResponse<ListFuelOrdersResDto>;
            }
            throw error;
        }
    }

    private canReadAllFuelOrders(principal: AuthenticatedPrincipal): boolean {
        return principal.permissions.includes(ORDER_PERMISSIONS.fuelOrderReadAll.key);
    }
}
