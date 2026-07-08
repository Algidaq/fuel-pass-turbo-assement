import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';

export type FuelOrderStatusDto = 'PENDING' | 'CONFIRMED' | 'COMPLETED';

export type FuelOrderVolumeUnitDto = 'LITERS';

export class FuelOrderStatusHistoryResDto extends BaseResModel<FuelOrderStatusHistoryResDto> {
    public readonly id!: string;
    public readonly fromStatus!: FuelOrderStatusDto | null;
    public readonly toStatus!: FuelOrderStatusDto;
    public readonly changedByUserId!: string | null;
    public readonly changedAt!: string;
    public readonly note!: string | null;

    public constructor(params?: Partial<ClassParams<FuelOrderStatusHistoryResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<FuelOrderStatusHistoryResDto>>): FuelOrderStatusHistoryResDto {
        return Object.assign(new FuelOrderStatusHistoryResDto(), this, params);
    }
}

export class FuelOrderResDto extends BaseResModel<FuelOrderResDto> {
    public readonly id!: string;
    public readonly tailNumber!: string;
    public readonly airportIcaoCode!: string;
    public readonly requestedFuelVolume!: string;
    public readonly volumeUnit!: FuelOrderVolumeUnitDto;
    public readonly deliveryWindowStartAt!: string;
    public readonly deliveryWindowEndAt!: string;
    public readonly status!: FuelOrderStatusDto;
    public readonly createdAt!: string;
    public readonly updatedAt!: string;
    public readonly statusHistory?: FuelOrderStatusHistoryResDto[];

    public constructor(params?: Partial<ClassParams<FuelOrderResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<FuelOrderResDto>>): FuelOrderResDto {
        return Object.assign(new FuelOrderResDto(), this, params);
    }
}

export type FuelOrderResponseDto = FuelOrderResDto;
