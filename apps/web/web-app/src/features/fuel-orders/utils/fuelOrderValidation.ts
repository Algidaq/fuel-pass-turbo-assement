import type {
  CreateFuelOrderFormErrors,
  CreateFuelOrderFormValues,
  CreateFuelOrderValidationResult,
} from '../types/fuelOrder.types';
import { normalizeAirportIcaoCode, normalizeTailNumber } from './fuelOrderFormatting';

const isValidDateTimeLocal = (value: string): boolean => {
  if (!value) {
    return false;
  }

  return Number.isFinite(new Date(value).getTime());
};

export const validateCreateFuelOrderForm = (values: CreateFuelOrderFormValues): CreateFuelOrderValidationResult => {
  const errors: CreateFuelOrderFormErrors = {};
  const tailNumber = normalizeTailNumber(values.tailNumber);
  const airportIcaoCode = normalizeAirportIcaoCode(values.airportIcaoCode);
  const startTime = isValidDateTimeLocal(values.deliveryWindowStartAt) ? new Date(values.deliveryWindowStartAt).getTime() : null;
  const endTime = isValidDateTimeLocal(values.deliveryWindowEndAt) ? new Date(values.deliveryWindowEndAt).getTime() : null;

  if (!tailNumber) {
    errors.tailNumber = 'Tail number is required.';
  } else if (tailNumber.length > 32) {
    errors.tailNumber = 'Tail number must be 32 characters or fewer.';
  }

  if (!airportIcaoCode) {
    errors.airportIcaoCode = 'Airport ICAO code is required.';
  } else if (!/^[A-Z]{4}$/u.test(airportIcaoCode)) {
    errors.airportIcaoCode = 'Airport ICAO code must be exactly 4 letters.';
  }

  if (values.requestedFuelVolume === null) {
    errors.requestedFuelVolume = 'Requested fuel volume is required.';
  } else if (!Number.isFinite(values.requestedFuelVolume) || values.requestedFuelVolume <= 0) {
    errors.requestedFuelVolume = 'Requested fuel volume must be greater than 0.';
  }

  if (startTime === null) {
    errors.deliveryWindowStartAt = 'Delivery window start is required.';
  } else if (startTime < Date.now()) {
    errors.deliveryWindowStartAt = 'Delivery window start must not be in the past.';
  }

  if (endTime === null) {
    errors.deliveryWindowEndAt = 'Delivery window end is required.';
  } else if (startTime !== null && endTime <= startTime) {
    errors.deliveryWindowEndAt = 'Delivery window end must be after the start time.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
