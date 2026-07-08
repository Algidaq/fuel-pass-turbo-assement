import { FuelOrderResDto, FuelOrderStatusHistoryResDto } from '@fuel-pass/contracts/backend';
import type { FuelOrderEntity } from '../entities/fuel-order.entity';
import type { FuelOrderStatusHistoryEntity } from '../entities/fuel-order-status-history.entity';

export function mapFuelOrderToResponse(fuelOrder: FuelOrderEntity): FuelOrderResDto {
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
        statusHistory: fuelOrder.statusHistory?.map(mapFuelOrderStatusHistoryToResponse),
    });
}

function mapFuelOrderStatusHistoryToResponse(statusHistory: FuelOrderStatusHistoryEntity): FuelOrderStatusHistoryResDto {
    return new FuelOrderStatusHistoryResDto({
        id: statusHistory.id,
        fromStatus: statusHistory.fromStatus,
        toStatus: statusHistory.toStatus,
        changedByUserId: statusHistory.changedByUserId,
        changedAt: statusHistory.changedAt.toISOString(),
        note: statusHistory.note,
    });
}

function formatNumericScale(value: string | number, scale: number): string {
    const [integer = '0', decimal = ''] = `${value}`.split('.');
    const normalizedDecimal = decimal.padEnd(scale, '0').slice(0, scale);
    return `${integer}.${normalizedDecimal}`;
}
