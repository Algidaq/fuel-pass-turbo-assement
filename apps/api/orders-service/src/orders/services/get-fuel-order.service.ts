import { FuelOrderResDto, type TFuelOrderIdParamDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { OrderException } from '../orders.errors';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';

@Injectable()
export class GetFuelOrderService {
    public constructor(private readonly fuelOrderRepository: FuelOrderRepository) {}

    public async getFuelOrder(params: WithAppCtx<{ id: TFuelOrderIdParamDto }>): Promise<ApiResponse<FuelOrderResDto>> {
        try {
            if (!isUuid(params.id)) {
                throw new OrderException(HttpStatus.BAD_REQUEST, 'InvalidRequest');
            }

            const fuelOrder = await this.fuelOrderRepository.findById(params.id);

            if (fuelOrder === null) {
                throw new OrderException(HttpStatus.NOT_FOUND, 'FuelOrderNotFound');
            }

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

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}
