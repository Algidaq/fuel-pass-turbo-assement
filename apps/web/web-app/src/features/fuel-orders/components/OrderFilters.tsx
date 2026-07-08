import { Button, Card, CardBody, FormField, Input } from '@fuel-pass/ui';
import { useState, type ChangeEvent, type FormEvent } from 'react';

import type { FuelOrderFilters } from '../types/fuelOrder.types';
import { normalizeAirportIcaoCode } from '../utils/fuelOrderFormatting';
import styles from './OrderFilters.module.css';

type OrderFiltersProps = {
    filters: FuelOrderFilters;
    onApply: (filters: FuelOrderFilters) => void;
};

const normalizeAirportInput = (value: string): string =>
    normalizeAirportIcaoCode(value)
        .replace(/[^A-Z]/gu, '')
        .slice(0, 4);

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
        <Card className={styles.card}>
            <CardBody>
                <h2>Filter orders</h2>
                <form className={styles.form} noValidate onSubmit={handleSubmit}>
                    <FormField hint="Filter orders by 4-letter airport code." label="Airport ICAO Code">
                        <Input
                            autoComplete="off"
                            maxLength={4}
                            name="airportIcaoCode"
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                setAirportIcaoCode(normalizeAirportInput(event.target.value))
                            }
                            placeholder="OMDB"
                            value={airportIcaoCode}
                        />
                    </FormField>
                    <div className={styles.actions}>
                        <Button type="submit">Apply filter</Button>
                        <Button onClick={handleClear} type="button" variant="secondary">
                            Clear
                        </Button>
                    </div>
                </form>
            </CardBody>
        </Card>
    );
};
