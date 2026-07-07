import { ListFuelOrdersResDto, PaginationResDto, type TListFuelOrdersQueryDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { FuelOrderStatus } from '../entities/order.enums';
import { mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';

@Injectable()
export class ListFuelOrdersService {
    public constructor(private readonly fuelOrderRepository: FuelOrderRepository) {}

    public async listFuelOrders(params: WithAppCtx<{ query: TListFuelOrdersQueryDto }>): Promise<ApiResponse<ListFuelOrdersResDto>> {
        try {
            const { query } = params;
            const [items, totalItems] = await this.fuelOrderRepository.findManyAndCount({
                airportIcaoCode: query.airportIcaoCode,
                status: query.status as FuelOrderStatus | undefined,
                page: query.page,
                pageSize: query.pageSize,
            });
            const totalPages = Math.ceil(totalItems / query.pageSize);

            return ApiResponse.builder<ListFuelOrdersResDto>()
                .withSuccess({
                    status: HttpStatus.OK,
                    data: new ListFuelOrdersResDto({
                        items: items.map(mapFuelOrderToResponse),
                        pagination: new PaginationResDto({
                            page: query.page,
                            pageSize: query.pageSize,
                            totalItems,
                            totalPages,
                        }),
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
}
