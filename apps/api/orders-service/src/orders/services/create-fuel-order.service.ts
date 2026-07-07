import { FuelOrderResDto, type TCreateFuelOrderRequestDto } from '@fuel-pass/contracts';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { FuelOrderEntity } from '../entities/fuel-order.entity';
import { FuelOrderStatus, VolumeUnit } from '../entities/order.enums';
import { mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';
import type { AuthenticatedPrincipal } from '../types/auth-request.types';

@Injectable()
export class CreateFuelOrderService {
    public constructor(
        private readonly fuelOrderRepository: FuelOrderRepository,
        private readonly dataSource: DataSource
    ) {}

    public async createFuelOrder(
        params: WithAppCtx<{ body: TCreateFuelOrderRequestDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<FuelOrderResDto>> {
        try {
            const { body, principal } = params;
            const userId = principal.userId ?? null;
            const createdFuelOrder = await this.dataSource.transaction(async (manager): Promise<FuelOrderEntity> => {
                const fuelOrder = await this.fuelOrderRepository.createFuelOrder(
                    {
                        tailNumber: body.tailNumber,
                        airportIcaoCode: body.airportIcaoCode,
                        requestedFuelVolume: body.requestedFuelVolume,
                        deliveryWindowStartAt: new Date(body.deliveryWindowStartAt),
                        deliveryWindowEndAt: new Date(body.deliveryWindowEndAt),
                        status: FuelOrderStatus.PENDING,
                        volumeUnit: VolumeUnit.LITERS,
                        submittedByUserId: userId,
                        lastStatusChangedByUserId: userId,
                    },
                    manager
                );

                await this.fuelOrderRepository.createStatusHistory(
                    {
                        fuelOrderId: fuelOrder.id,
                        fromStatus: null,
                        toStatus: FuelOrderStatus.PENDING,
                        changedByUserId: userId,
                    },
                    manager
                );

                return fuelOrder;
            });

            return ApiResponse.builder<FuelOrderResDto>()
                .withSuccess({ status: HttpStatus.CREATED, data: mapFuelOrderToResponse(createdFuelOrder) })
                .build();
        } catch (error: unknown) {
            if (error instanceof AppHttpError) {
                return ApiResponse.fromAppError(error) as ApiResponse<FuelOrderResDto>;
            }
            throw error;
        }
    }
}
