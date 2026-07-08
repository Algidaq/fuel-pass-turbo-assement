import { FuelOrderResDto, FuelOrderStatusHistoryResDto, FuelOrderUserResDto } from '@fuel-pass/contracts/backend';
import type { FuelOrderEntity } from '../entities/fuel-order.entity';
import type { FuelOrderStatusHistoryEntity } from '../entities/fuel-order-status-history.entity';

export interface FuelOrderMappingOptions {
    usersById?: ReadonlyMap<string, FuelOrderUserResDto>;
}

export function mapFuelOrderToResponse(fuelOrder: FuelOrderEntity, options: FuelOrderMappingOptions = {}): FuelOrderResDto {
    return new FuelOrderResDto({
        id: fuelOrder.id,
        tailNumber: fuelOrder.tailNumber,
        airportIcaoCode: fuelOrder.airportIcaoCode,
        requestedFuelVolume: formatNumericScale(fuelOrder.requestedFuelVolume, 2),
        volumeUnit: fuelOrder.volumeUnit,
        deliveryWindowStartAt: fuelOrder.deliveryWindowStartAt.toISOString(),
        deliveryWindowEndAt: fuelOrder.deliveryWindowEndAt.toISOString(),
        status: fuelOrder.status,
        createdAt: fuelOrder.createdAt.toISOString(),
        updatedAt: fuelOrder.updatedAt.toISOString(),
        submittedByUser: getUserById(options.usersById, fuelOrder.submittedByUserId),
        lastStatusChangedByUser: getUserById(options.usersById, fuelOrder.lastStatusChangedByUserId),
        statusHistory: fuelOrder.statusHistory?.map((statusHistory): FuelOrderStatusHistoryResDto =>
            mapFuelOrderStatusHistoryToResponse(statusHistory, options)
        ),
    });
}

export function collectFuelOrderUserIds(fuelOrders: FuelOrderEntity[]): string[] {
    const userIds = new Set<string>();

    for (const fuelOrder of fuelOrders) {
        addUserId(userIds, fuelOrder.submittedByUserId);
        addUserId(userIds, fuelOrder.lastStatusChangedByUserId);

        for (const statusHistory of fuelOrder.statusHistory ?? []) {
            addUserId(userIds, statusHistory.changedByUserId);
        }
    }

    return [...userIds];
}

function mapFuelOrderStatusHistoryToResponse(
    statusHistory: FuelOrderStatusHistoryEntity,
    options: FuelOrderMappingOptions
): FuelOrderStatusHistoryResDto {
    return new FuelOrderStatusHistoryResDto({
        id: statusHistory.id,
        fromStatus: statusHistory.fromStatus,
        toStatus: statusHistory.toStatus,
        changedByUserId: statusHistory.changedByUserId,
        changedByUser: getUserById(options.usersById, statusHistory.changedByUserId),
        changedAt: statusHistory.changedAt.toISOString(),
        note: statusHistory.note,
    });
}

function addUserId(userIds: Set<string>, userId: string | null | undefined): void {
    if (userId !== null && userId !== undefined) {
        userIds.add(userId);
    }
}

function getUserById(usersById: ReadonlyMap<string, FuelOrderUserResDto> | undefined, userId: string | null | undefined): FuelOrderUserResDto | undefined {
    if (userId === null || userId === undefined) {
        return undefined;
    }

    return usersById?.get(userId);
}

function formatNumericScale(value: string | number, scale: number): string {
    const [integer = '0', decimal = ''] = `${value}`.split('.');
    const normalizedDecimal = decimal.padEnd(scale, '0').slice(0, scale);
    return `${integer}.${normalizedDecimal}`;
}
