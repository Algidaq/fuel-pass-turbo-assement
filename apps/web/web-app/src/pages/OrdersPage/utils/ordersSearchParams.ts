import { fuelOrderPageSizeOptions, type FuelOrderFilters } from '../../../features/fuel-orders';

export const defaultPage = 1;
export const defaultPageSize = 20;

const parsePositiveInteger = (value: string | null, fallback: number): number => {
    if (!value) {
        return fallback;
    }

    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue >= 1 ? parsedValue : fallback;
};

const parsePageSize = (value: string | null): number => {
    const parsedValue = parsePositiveInteger(value, defaultPageSize);

    return fuelOrderPageSizeOptions.includes(parsedValue as (typeof fuelOrderPageSizeOptions)[number]) ? parsedValue : defaultPageSize;
};

const parseAirportIcaoCode = (value: string | null): string | undefined => {
    const normalizedValue = value?.trim().toUpperCase();

    return normalizedValue && /^[A-Z]{4}$/u.test(normalizedValue) ? normalizedValue : undefined;
};

export const getFiltersFromSearchParams = (searchParams: URLSearchParams): FuelOrderFilters => ({
    airportIcaoCode: parseAirportIcaoCode(searchParams.get('airportIcaoCode')),
    page: parsePositiveInteger(searchParams.get('page'), defaultPage),
    pageSize: parsePageSize(searchParams.get('pageSize')),
});

export const buildOrdersSearchParams = (filters: FuelOrderFilters): URLSearchParams => {
    const searchParams = new URLSearchParams();

    if (filters.airportIcaoCode) {
        searchParams.set('airportIcaoCode', filters.airportIcaoCode);
    }

    if (filters.page && filters.page > defaultPage) {
        searchParams.set('page', String(filters.page));
    }

    if (filters.pageSize && filters.pageSize !== defaultPageSize) {
        searchParams.set('pageSize', String(filters.pageSize));
    }

    return searchParams;
};
