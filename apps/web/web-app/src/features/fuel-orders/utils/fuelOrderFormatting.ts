import type { CreateFuelOrderFormValues, CreateFuelOrderRequest, FuelOrder } from '../types/fuelOrder.types';

export const emptyCreateFuelOrderFormValues: CreateFuelOrderFormValues = {
  tailNumber: '',
  airportIcaoCode: '',
  requestedFuelVolume: null,
  deliveryWindowStartAt: '',
  deliveryWindowEndAt: '',
};

export const normalizeAirportIcaoCode = (value: string): string => value.trim().toUpperCase();

export const normalizeTailNumber = (value: string): string => value.trim().toUpperCase();

export const toIsoDateTime = (value: string): string => new Date(value).toISOString();

export const toCreateFuelOrderRequest = (values: CreateFuelOrderFormValues): CreateFuelOrderRequest => ({
  tailNumber: normalizeTailNumber(values.tailNumber),
  airportIcaoCode: normalizeAirportIcaoCode(values.airportIcaoCode),
  requestedFuelVolume: (values.requestedFuelVolume ?? 0).toFixed(2),
  deliveryWindowStartAt: toIsoDateTime(values.deliveryWindowStartAt),
  deliveryWindowEndAt: toIsoDateTime(values.deliveryWindowEndAt),
});

export const formatFuelVolume = (order: FuelOrder): string => `${order.requestedFuelVolume} ${order.volumeUnit.toLowerCase()}`;

export const formatDeliveryWindow = (order: FuelOrder): string => {
  const start = new Date(order.deliveryWindowStartAt).toLocaleString();
  const end = new Date(order.deliveryWindowEndAt).toLocaleString();

  return `${start} to ${end}`;
};
