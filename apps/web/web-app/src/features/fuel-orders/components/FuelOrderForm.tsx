import { Alert, Button, FormField, Input, NumberInput } from '@fuel-pass/ui';
import { useState, type FormEvent } from 'react';

import { getApiErrorMessage } from '../../../services/apiErrorMessages';
import { useCreateFuelOrder } from '../hooks/useCreateFuelOrder';
import type { CreateFuelOrderFormErrors, CreateFuelOrderFormValues, FuelOrder } from '../types/fuelOrder.types';
import {
  emptyCreateFuelOrderFormValues,
  formatDeliveryWindow,
  formatFuelVolume,
  toCreateFuelOrderRequest,
} from '../utils/fuelOrderFormatting';
import { validateCreateFuelOrderForm } from '../utils/fuelOrderValidation';

const normalizeAirportInput = (value: string): string => value.trim().toUpperCase().replace(/[^A-Z]/gu, '').slice(0, 4);

const getSubmitErrorMessage = (error: unknown): string => {
  return getApiErrorMessage(error, 'Unable to submit the fuel order. Please try again.');
};

export const FuelOrderForm = () => {
  const createFuelOrder = useCreateFuelOrder();
  const [values, setValues] = useState<CreateFuelOrderFormValues>(emptyCreateFuelOrderFormValues);
  const [errors, setErrors] = useState<CreateFuelOrderFormErrors>({});
  const [createdOrder, setCreatedOrder] = useState<FuelOrder | null>(null);

  const updateField = <TField extends keyof CreateFuelOrderFormValues>(field: TField, value: CreateFuelOrderFormValues[TField]) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setCreatedOrder(null);

    if (createFuelOrder.error) {
      createFuelOrder.reset();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateCreateFuelOrderForm(values);
    setErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    try {
      const fuelOrder = await createFuelOrder.mutateAsync(toCreateFuelOrderRequest(values));

      setCreatedOrder(fuelOrder);
      setValues(emptyCreateFuelOrderFormValues);
      setErrors({});
    } catch {
      setCreatedOrder(null);
    }
  };

  return (
    <form className="fuel-order-form" noValidate onSubmit={handleSubmit}>
      {createdOrder ? (
        <Alert role="status" variant="success">
          Fuel order {createdOrder.id} was submitted with status {createdOrder.status}. Requested {formatFuelVolume(createdOrder)} for{' '}
          {createdOrder.airportIcaoCode}, {formatDeliveryWindow(createdOrder)}.
        </Alert>
      ) : null}

      {createFuelOrder.error ? (
        <Alert role="alert" variant="danger">
          {getSubmitErrorMessage(createFuelOrder.error)}
        </Alert>
      ) : null}

      <div className="fuel-order-form-grid">
        <FormField error={errors.tailNumber} label="Tail Number" required>
          <Input
            autoComplete="off"
            disabled={createFuelOrder.isPending}
            error={Boolean(errors.tailNumber)}
            name="tailNumber"
            onChange={(event) => updateField('tailNumber', event.target.value)}
            placeholder="N123AB"
            value={values.tailNumber}
          />
        </FormField>

        <FormField error={errors.airportIcaoCode} label="Airport ICAO Code" required>
          <Input
            autoComplete="off"
            disabled={createFuelOrder.isPending}
            error={Boolean(errors.airportIcaoCode)}
            maxLength={4}
            name="airportIcaoCode"
            onChange={(event) => updateField('airportIcaoCode', normalizeAirportInput(event.target.value))}
            placeholder="OMDB"
            value={values.airportIcaoCode}
          />
        </FormField>

        <FormField error={errors.requestedFuelVolume} hint="Unit: liters" label="Requested Fuel Volume" required>
          <NumberInput
            disabled={createFuelOrder.isPending}
            error={Boolean(errors.requestedFuelVolume)}
            min={0}
            name="requestedFuelVolume"
            onValueChange={(value) => updateField('requestedFuelVolume', value)}
            step="any"
            value={values.requestedFuelVolume}
          />
        </FormField>
      </div>

      <div className="fuel-order-form-grid">
        <FormField error={errors.deliveryWindowStartAt} label="Delivery Window Start" required>
          <Input
            disabled={createFuelOrder.isPending}
            error={Boolean(errors.deliveryWindowStartAt)}
            name="deliveryWindowStartAt"
            onChange={(event) => updateField('deliveryWindowStartAt', event.target.value)}
            type="datetime-local"
            value={values.deliveryWindowStartAt}
          />
        </FormField>

        <FormField error={errors.deliveryWindowEndAt} label="Delivery Window End" required>
          <Input
            disabled={createFuelOrder.isPending}
            error={Boolean(errors.deliveryWindowEndAt)}
            name="deliveryWindowEndAt"
            onChange={(event) => updateField('deliveryWindowEndAt', event.target.value)}
            type="datetime-local"
            value={values.deliveryWindowEndAt}
          />
        </FormField>
      </div>

      <div className="fuel-order-form-actions">
        <Button disabled={createFuelOrder.isPending} type="submit">
          {createFuelOrder.isPending ? 'Submitting...' : 'Submit Fuel Order'}
        </Button>
      </div>
    </form>
  );
};
