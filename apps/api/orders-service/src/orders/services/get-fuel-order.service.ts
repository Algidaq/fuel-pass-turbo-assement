import { FuelOrderResDto, type TFuelOrderIdParamDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';

@Injectable()
export class GetFuelOrderService {
    public constructor(private readonly fuelOrderRepository: FuelOrderRepository) {}

    public async getFuelOrder(params: WithAppCtx<{ id: TFuelOrderIdParamDto }>): Promise<ApiResponse<FuelOrderResDto>> {
        try {
            const fuelOrder = await this.fuelOrderRepository.findByIdOrThrow(params.id);

            return ApiResponse.builder<FuelOrderResDto>()
                .withSuccess({ status: HttpStatus.OK, data: mapFuelOrderToResponse(fuelOrder) })
                .build();
        } catch (error: unknown) {
            if (error instanceof AppHttpError) {
                return ApiResponse.fromAppError(error) as ApiResponse<FuelOrderResDto>;
            }
            throw error;
        }
    }
}
