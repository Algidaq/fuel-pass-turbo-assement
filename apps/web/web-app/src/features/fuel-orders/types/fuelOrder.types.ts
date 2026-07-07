import type {
  FuelOrderResDto,
  FuelOrderStatusDto,
  TCreateFuelOrderRequestDto,
  TListFuelOrdersQueryDto,
  TUpdateFuelOrderStatusRequestDto,
} from '@fuel-pass/contracts/backend';

export type CreateFuelOrderRequest = TCreateFuelOrderRequestDto;

export type FuelOrder = FuelOrderResDto;

export type FuelOrderStatus = FuelOrderStatusDto;

export type FuelOrderFilters = Pick<TListFuelOrdersQueryDto, 'airportIcaoCode'>;

export type UpdateFuelOrderStatusRequest = TUpdateFuelOrderStatusRequestDto;

export type CreateFuelOrderFormValues = {
  tailNumber: string;
  airportIcaoCode: string;
  requestedFuelVolume: number | null;
  deliveryWindowStartAt: string;
  deliveryWindowEndAt: string;
};

export type CreateFuelOrderFormErrors = Partial<Record<keyof CreateFuelOrderFormValues, string>>;

export type CreateFuelOrderValidationResult = {
  errors: CreateFuelOrderFormErrors;
  isValid: boolean;
};
