import { FuelOrderResDto, type TUpdateFuelOrderStatusRequestDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { FuelOrderEntity } from '../entities/fuel-order.entity';
import { FuelOrderStatus } from '../entities/order.enums';
import { mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { OrderException } from '../orders.errors';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';
import type { AuthenticatedPrincipal } from '../types/auth-request.types';

const ALLOWED_TRANSITIONS: Record<FuelOrderStatus, FuelOrderStatus[]> = {
    [FuelOrderStatus.PENDING]: [FuelOrderStatus.CONFIRMED],
    [FuelOrderStatus.CONFIRMED]: [FuelOrderStatus.COMPLETED],
    [FuelOrderStatus.COMPLETED]: [],
};

@Injectable()
export class UpdateFuelOrderStatusService {
    public constructor(
        private readonly fuelOrderRepository: FuelOrderRepository,
        private readonly dataSource: DataSource
    ) {}

    public async updateFuelOrderStatus(
        params: WithAppCtx<{ id: string; body: TUpdateFuelOrderStatusRequestDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<FuelOrderResDto>> {
        try {
            if (!isUuid(params.id)) {
                throw new OrderException(HttpStatus.BAD_REQUEST, 'InvalidRequest');
            }

            const status = params.body.status as FuelOrderStatus;
            const userId = params.principal.userId ?? null;

            const updatedFuelOrder = await this.dataSource.transaction(async (manager): Promise<FuelOrderEntity> => {
                const fuelOrder = await this.fuelOrderRepository.findById(params.id, manager);

                if (fuelOrder === null) {
                    throw new OrderException(HttpStatus.NOT_FOUND, 'FuelOrderNotFound');
                }

                if (fuelOrder.status === status) {
                    return fuelOrder;
                }

                if (!ALLOWED_TRANSITIONS[fuelOrder.status].includes(status)) {
                    throw new OrderException(HttpStatus.CONFLICT, 'InvalidStatusTransition');
                }

                const updated = await this.fuelOrderRepository.updateStatusIfCurrent(
                    {
                        fuelOrderId: fuelOrder.id,
                        currentStatus: fuelOrder.status,
                        status,
                        changedByUserId: userId,
                    },
                    manager
                );

                if (!updated) {
                    throw new OrderException(HttpStatus.CONFLICT, 'InvalidStatusTransition');
                }

                await this.fuelOrderRepository.createStatusHistory(
                    {
                        fuelOrderId: fuelOrder.id,
                        fromStatus: fuelOrder.status,
                        toStatus: status,
                        changedByUserId: userId,
                        note: params.body.note ?? null,
                    },
                    manager
                );

                const reloadedFuelOrder = await this.fuelOrderRepository.findById(fuelOrder.id, manager);

                if (reloadedFuelOrder === null) {
                    throw new OrderException(HttpStatus.NOT_FOUND, 'FuelOrderNotFound');
                }

                return reloadedFuelOrder;
            });

            return ApiResponse.builder<FuelOrderResDto>()
                .withSuccess({ status: HttpStatus.OK, data: mapFuelOrderToResponse(updatedFuelOrder) })
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
