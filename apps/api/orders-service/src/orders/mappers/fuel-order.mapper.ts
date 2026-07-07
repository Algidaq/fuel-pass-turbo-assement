import { FuelOrderResDto } from '@fuel-pass/contracts';
import type { FuelOrderEntity } from '../entities/fuel-order.entity';

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
    });
}

function formatNumericScale(value: string, scale: number): string {
    const [integer = '0', decimal = ''] = value.split('.');
    const normalizedDecimal = decimal.padEnd(scale, '0').slice(0, scale);

    return `${integer}.${normalizedDecimal}`;
}
