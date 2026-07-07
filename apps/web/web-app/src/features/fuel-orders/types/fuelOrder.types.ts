import type { FuelOrderResDto, TCreateFuelOrderRequestDto } from '@fuel-pass/contracts/backend';

export type CreateFuelOrderRequest = TCreateFuelOrderRequestDto;

export type FuelOrder = FuelOrderResDto;

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
