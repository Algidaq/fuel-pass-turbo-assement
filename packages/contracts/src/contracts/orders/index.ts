export type FuelOrderStatusDto = 'PENDING' | 'CONFIRMED' | 'COMPLETED';

export type FuelOrderVolumeUnitDto = 'LITERS';

export interface CreateFuelOrderRequestDto {
    tailNumber: string;
    airportIcaoCode: string;
    requestedFuelVolume: number | string;
    deliveryWindowStartAt: string;
    deliveryWindowEndAt: string;
}

export interface ListFuelOrdersQueryDto {
    airportIcaoCode?: string;
    status?: FuelOrderStatusDto;
    page?: number | string;
    pageSize?: number | string;
}

export interface UpdateFuelOrderStatusRequestDto {
    status: FuelOrderStatusDto;
    note?: string;
}

export interface FuelOrderResponseDto {
    id: string;
    tailNumber: string;
    airportIcaoCode: string;
    requestedFuelVolume: string;
    volumeUnit: FuelOrderVolumeUnitDto;
    deliveryWindowStartAt: string;
    deliveryWindowEndAt: string;
    status: FuelOrderStatusDto;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationResponseDto {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface ListFuelOrdersResponseDto {
    items: FuelOrderResponseDto[];
    pagination: PaginationResponseDto;
}
