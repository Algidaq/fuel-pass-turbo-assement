import type {
    CreateFuelOrderRequestDto,
    FuelOrderResponseDto,
    ListFuelOrdersQueryDto,
    ListFuelOrdersResponseDto,
    UpdateFuelOrderStatusRequestDto,
} from '@fuel-pass/contracts';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { FuelOrderEntity } from '../entities/fuel-order.entity';
import { FuelOrderStatus, VolumeUnit } from '../entities/order.enums';
import { mapFuelOrderToResponse } from '../mappers/fuel-order.mapper';
import { OrderFailure } from '../orders.errors';
import { FuelOrderRepository } from '../repositories/fuel-order.repository';

export interface UpdateFuelOrderStatusCommand {
    id: string;
    body: Partial<UpdateFuelOrderStatusRequestDto>;
    userId?: string | null;
}

const ALLOWED_TRANSITIONS: Record<FuelOrderStatus, FuelOrderStatus[]> = {
    [FuelOrderStatus.PENDING]: [FuelOrderStatus.CONFIRMED],
    [FuelOrderStatus.CONFIRMED]: [FuelOrderStatus.COMPLETED],
    [FuelOrderStatus.COMPLETED]: [],
};

@Injectable()
export class FuelOrdersService {
    public constructor(
        private readonly fuelOrderRepository: FuelOrderRepository,
        private readonly dataSource: DataSource
    ) {}

    public async createFuelOrder(
        body: Partial<CreateFuelOrderRequestDto>,
        userId?: string | null
    ): Promise<FuelOrderResponseDto> {
        const command = this.toCreateCommand(body);
        const createdFuelOrder = await this.dataSource.transaction(async (manager): Promise<FuelOrderEntity> => {
            const fuelOrder = await this.fuelOrderRepository.createFuelOrder(
                {
                    ...command,
                    status: FuelOrderStatus.PENDING,
                    volumeUnit: VolumeUnit.LITERS,
                    submittedByUserId: userId ?? null,
                    lastStatusChangedByUserId: userId ?? null,
                },
                manager
            );

            await this.fuelOrderRepository.createStatusHistory(
                {
                    fuelOrderId: fuelOrder.id,
                    fromStatus: null,
                    toStatus: FuelOrderStatus.PENDING,
                    changedByUserId: userId ?? null,
                },
                manager
            );

            return fuelOrder;
        });

        return mapFuelOrderToResponse(createdFuelOrder);
    }

    public async listFuelOrders(query: ListFuelOrdersQueryDto): Promise<ListFuelOrdersResponseDto> {
        const normalizedQuery = this.toListQuery(query);
        const [items, totalItems] = await this.fuelOrderRepository.findManyAndCount({
            airportIcaoCode: normalizedQuery.airportIcaoCode,
            status: normalizedQuery.status,
            page: normalizedQuery.page,
            pageSize: normalizedQuery.pageSize,
        });
        const totalPages = Math.ceil(totalItems / normalizedQuery.pageSize);

        return {
            items: items.map(mapFuelOrderToResponse),
            pagination: {
                page: normalizedQuery.page,
                pageSize: normalizedQuery.pageSize,
                totalItems,
                totalPages,
            },
        };
    }

    public async getFuelOrderById(id: string): Promise<FuelOrderResponseDto> {
        if (!isUuid(id)) {
            throw new OrderFailure('InvalidRequest');
        }

        const fuelOrder = await this.fuelOrderRepository.findById(id);

        if (fuelOrder === null) {
            throw new OrderFailure('FuelOrderNotFound');
        }

        return mapFuelOrderToResponse(fuelOrder);
    }

    public async updateFuelOrderStatus(command: UpdateFuelOrderStatusCommand): Promise<FuelOrderResponseDto> {
        if (!isUuid(command.id) || !isFuelOrderStatus(command.body.status)) {
            throw new OrderFailure('InvalidRequest');
        }

        const status = command.body.status;
        const note = command.body.note;

        if (note !== undefined && typeof note !== 'string') {
            throw new OrderFailure('InvalidRequest');
        }

        const updatedFuelOrder = await this.dataSource.transaction(async (manager): Promise<FuelOrderEntity> => {
            const fuelOrder = await this.fuelOrderRepository.findById(command.id, manager);

            if (fuelOrder === null) {
                throw new OrderFailure('FuelOrderNotFound');
            }

            if (fuelOrder.status === status) {
                return fuelOrder;
            }

            if (!ALLOWED_TRANSITIONS[fuelOrder.status].includes(status)) {
                throw new OrderFailure('InvalidStatusTransition');
            }

            const updated = await this.fuelOrderRepository.updateStatusIfCurrent(
                {
                    fuelOrderId: fuelOrder.id,
                    currentStatus: fuelOrder.status,
                    status,
                    changedByUserId: command.userId ?? null,
                },
                manager
            );

            if (!updated) {
                throw new OrderFailure('InvalidStatusTransition');
            }

            await this.fuelOrderRepository.createStatusHistory(
                {
                    fuelOrderId: fuelOrder.id,
                    fromStatus: fuelOrder.status,
                    toStatus: status,
                    changedByUserId: command.userId ?? null,
                    note: note?.trim() === '' ? null : note,
                },
                manager
            );

            const reloadedFuelOrder = await this.fuelOrderRepository.findById(fuelOrder.id, manager);

            if (reloadedFuelOrder === null) {
                throw new OrderFailure('FuelOrderNotFound');
            }

            return reloadedFuelOrder;
        });

        return mapFuelOrderToResponse(updatedFuelOrder);
    }

    private toCreateCommand(body: Partial<CreateFuelOrderRequestDto>): {
        tailNumber: string;
        airportIcaoCode: string;
        requestedFuelVolume: string;
        deliveryWindowStartAt: Date;
        deliveryWindowEndAt: Date;
    } {
        if (
            typeof body.tailNumber !== 'string' ||
            typeof body.airportIcaoCode !== 'string' ||
            (typeof body.requestedFuelVolume !== 'number' && typeof body.requestedFuelVolume !== 'string') ||
            typeof body.deliveryWindowStartAt !== 'string' ||
            typeof body.deliveryWindowEndAt !== 'string'
        ) {
            throw new OrderFailure('InvalidRequest');
        }

        const tailNumber = body.tailNumber.trim().toUpperCase();
        const airportIcaoCode = body.airportIcaoCode.trim().toUpperCase();
        const requestedFuelVolume = normalizePositiveVolume(body.requestedFuelVolume);
        const deliveryWindowStartAt = parseIsoDate(body.deliveryWindowStartAt);
        const deliveryWindowEndAt = parseIsoDate(body.deliveryWindowEndAt);

        if (
            tailNumber.length === 0 ||
            !isAirportIcaoCode(airportIcaoCode) ||
            requestedFuelVolume === null ||
            deliveryWindowStartAt === null ||
            deliveryWindowEndAt === null ||
            deliveryWindowEndAt.getTime() <= deliveryWindowStartAt.getTime()
        ) {
            throw new OrderFailure('InvalidRequest');
        }

        return {
            tailNumber,
            airportIcaoCode,
            requestedFuelVolume,
            deliveryWindowStartAt,
            deliveryWindowEndAt,
        };
    }

    private toListQuery(query: ListFuelOrdersQueryDto): {
        airportIcaoCode?: string;
        status?: FuelOrderStatus;
        page: number;
        pageSize: number;
    } {
        const airportIcaoCode = query.airportIcaoCode?.trim().toUpperCase();
        const page = normalizeInteger(query.page, 1);
        const pageSize = normalizeInteger(query.pageSize, 20);
        const status = query.status;

        if (
            (airportIcaoCode !== undefined && !isAirportIcaoCode(airportIcaoCode)) ||
            (status !== undefined && !isFuelOrderStatus(status)) ||
            page === null ||
            pageSize === null ||
            page < 1 ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            throw new OrderFailure('InvalidRequest');
        }

        return {
            airportIcaoCode,
            status,
            page,
            pageSize,
        };
    }
}

function isAirportIcaoCode(value: string): boolean {
    return /^[A-Z]{4}$/u.test(value);
}

function isFuelOrderStatus(value: unknown): value is FuelOrderStatus {
    return typeof value === 'string' && Object.values(FuelOrderStatus).includes(value as FuelOrderStatus);
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function normalizeInteger(value: number | string | undefined, fallback: number): number | null {
    if (value === undefined) {
        return fallback;
    }

    const parsedValue = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(parsedValue)) {
        return null;
    }

    return parsedValue;
}

function normalizePositiveVolume(value: number | string): string | null {
    const normalizedValue = typeof value === 'number' ? value.toString() : value.trim();
    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return null;
    }

    return parsedValue.toFixed(2);
}

function parseIsoDate(value: string): Date | null {
    const date = new Date(value);

    if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
        return null;
    }

    return date;
}
