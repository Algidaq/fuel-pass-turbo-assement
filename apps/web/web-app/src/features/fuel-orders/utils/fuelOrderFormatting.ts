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

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
});

const volumeFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const volumeUnitLabels: Record<FuelOrder['volumeUnit'], string> = {
  LITERS: 'L',
};

const formatDateTimePart = (value: string, options?: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat('en-GB', {
    hour12: false,
    ...options,
  }).format(new Date(value));

export const formatDateTime = (value: string): string => dateTimeFormatter.format(new Date(value));

export const formatFuelVolume = (order: FuelOrder): string => {
  const volume = Number(order.requestedFuelVolume);
  const formattedVolume = Number.isFinite(volume) ? volumeFormatter.format(volume) : order.requestedFuelVolume;

  return `${formattedVolume} ${volumeUnitLabels[order.volumeUnit]}`;
};

export const formatDeliveryWindow = (order: FuelOrder): string => {
  const startDate = formatDateTimePart(order.deliveryWindowStartAt, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const endDate = formatDateTimePart(order.deliveryWindowEndAt, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const endTime = formatDateTimePart(order.deliveryWindowEndAt, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (startDate.startsWith(endDate)) {
    return `${startDate} - ${endTime}`;
  }

  return `${startDate} - ${formatDateTime(order.deliveryWindowEndAt)}`;
};
