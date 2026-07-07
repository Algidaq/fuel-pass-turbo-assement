import { Button, Card, CardBody, FormField, Input } from '@fuel-pass/ui';
import { useState, type FormEvent } from 'react';

import type { FuelOrderFilters } from '../types/fuelOrder.types';
import { normalizeAirportIcaoCode } from '../utils/fuelOrderFormatting';

type OrderFiltersProps = {
  filters: FuelOrderFilters;
  onApply: (filters: FuelOrderFilters) => void;
};

const normalizeAirportInput = (value: string): string => normalizeAirportIcaoCode(value).replace(/[^A-Z]/gu, '').slice(0, 4);

export const OrderFilters = ({ filters, onApply }: OrderFiltersProps) => {
  const [airportIcaoCode, setAirportIcaoCode] = useState(filters.airportIcaoCode ?? '');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextAirportIcaoCode = normalizeAirportInput(airportIcaoCode);

    onApply(nextAirportIcaoCode ? { airportIcaoCode: nextAirportIcaoCode } : {});
  };

  const handleClear = () => {
    setAirportIcaoCode('');
    onApply({});
  };

  return (
    <Card>
      <CardBody>
        <form className="orders-filter-form" noValidate onSubmit={handleSubmit}>
          <FormField label="Airport ICAO Code">
            <Input
              autoComplete="off"
              maxLength={4}
              name="airportIcaoCode"
              onChange={(event) => setAirportIcaoCode(normalizeAirportInput(event.target.value))}
              placeholder="OMDB"
              value={airportIcaoCode}
            />
          </FormField>
          <div className="orders-filter-actions">
            <Button type="submit">Apply</Button>
            <Button onClick={handleClear} type="button" variant="secondary">
              Clear
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};
