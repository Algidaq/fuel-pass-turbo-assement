import { BaseResModel, type ClassParams } from '@fuel-pass/node-commons';
import type { FuelOrderResDto } from './fuel-order-res.dto';

export class FuelOrderStatusCountsResDto extends BaseResModel<FuelOrderStatusCountsResDto> {
    public readonly PENDING!: number;
    public readonly CONFIRMED!: number;
    public readonly COMPLETED!: number;

    public constructor(params?: Partial<ClassParams<FuelOrderStatusCountsResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<FuelOrderStatusCountsResDto>>): FuelOrderStatusCountsResDto {
        return Object.assign(new FuelOrderStatusCountsResDto(), this, params);
    }
}

export class PaginationResDto extends BaseResModel<PaginationResDto> {
    public readonly page!: number;
    public readonly pageSize!: number;
    public readonly totalItems!: number;
    public readonly totalPages!: number;

    public constructor(params?: Partial<ClassParams<PaginationResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<PaginationResDto>>): PaginationResDto {
        return Object.assign(new PaginationResDto(), this, params);
    }
}

export class ListFuelOrdersResDto extends BaseResModel<ListFuelOrdersResDto> {
    public readonly items!: FuelOrderResDto[];
    public readonly pagination!: PaginationResDto;
    public readonly statusCounts?: FuelOrderStatusCountsResDto;

    public constructor(params?: Partial<ClassParams<ListFuelOrdersResDto>>) {
        super(params);
    }

    public override copyWith(params: Partial<ClassParams<ListFuelOrdersResDto>>): ListFuelOrdersResDto {
        return Object.assign(new ListFuelOrdersResDto(), this, params);
    }
}

export type PaginationResponseDto = PaginationResDto;
export type FuelOrderStatusCountsResponseDto = FuelOrderStatusCountsResDto;
export type ListFuelOrdersResponseDto = ListFuelOrdersResDto;
