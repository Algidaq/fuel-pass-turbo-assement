import { FuelOrderResDto, type TCreateFuelOrderRequestDto } from '@fuel-pass/contracts/backend';
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
import { DataSource } from 'typeorm';
import type { FuelOrderEntity } from '../entities/fuel-order.entity';
import { FuelOrderStatus, VolumeUnit } from '../entities/order.enums';
import { mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';

@Injectable()
export class CreateFuelOrderService {
    public constructor(
        private readonly fuelOrderRepository: FuelOrderRepository,
        private readonly dataSource: DataSource,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async createFuelOrder(
        params: WithAppCtx<{ body: TCreateFuelOrderRequestDto; principal: AuthenticatedPrincipal }>
    ): Promise<ApiResponse<FuelOrderResDto>> {
        const msg = constructLogMsg(CreateFuelOrderService.name, 'createFuelOrder', params.headers);

        try {
            this.log.info(`${msg}::create-fuel-order::started`);
            const { body, principal } = params;
            const userId = principal.userId ?? null;
            const createdFuelOrder = await this.dataSource.transaction(async (manager): Promise<FuelOrderEntity> => {
                this.log.info(`${msg}::create-fuel-order::transaction started`);
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
                this.log.info(`${msg}::create-fuel-order::fuel-order created`);

                await this.fuelOrderRepository.createStatusHistory(
                    {
                        fuelOrderId: fuelOrder.id,
                        fromStatus: null,
                        toStatus: FuelOrderStatus.PENDING,
                        changedByUserId: userId,
                    },
                    manager
                );
                this.log.info(`${msg}::create-fuel-order::initial status-history created`);

                return fuelOrder;
            });
            this.log.info(`${msg}::create-fuel-order::transaction completed`);

            return ApiResponse.builder<FuelOrderResDto>()
                .withSuccess({ status: HttpStatus.CREATED, data: mapFuelOrderToResponse(createdFuelOrder) })
                .build();
        } catch (error: unknown) {
            if (error instanceof AppHttpError) {
                this.log.error(constructErrorMsg(CreateFuelOrderService.name, 'createFuelOrder', params.headers), { error });
                return ApiResponse.fromAppError(error) as ApiResponse<FuelOrderResDto>;
            }
            this.log.error(constructErrorMsg(CreateFuelOrderService.name, 'createFuelOrder', params.headers), { error });
            throw error;
        }
    }
}
