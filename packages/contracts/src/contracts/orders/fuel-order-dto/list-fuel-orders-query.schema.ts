import z from 'zod';
import { type FuelOrderStatusDto } from './fuel-order-res.dto';

const fuelOrderStatusValues = ['PENDING', 'CONFIRMED', 'COMPLETED'] as const satisfies readonly FuelOrderStatusDto[];

function normalizeInteger(value: number | string | undefined, fallback: number): number {
    if (value === undefined) {
        return fallback;
    }

    const parsedValue = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(parsedValue)) {
        return Number.NaN;
    }

    return parsedValue;
}

function normalizeBoolean(value: boolean | string | undefined, fallback: boolean): boolean {
    if (value === undefined) {
        return fallback;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    return value === 'true';
}

export const listFuelOrdersQueryDtoSchema = z.object({
    airportIcaoCode: z
        .string()
        .trim()
        .transform((value): string => value.toUpperCase())
        .refine((value): boolean => /^[A-Z]{4}$/u.test(value), 'airportIcaoCode must be a valid ICAO code')
        .optional(),
    status: z.enum(fuelOrderStatusValues).optional(),
    include_status: z
        .union([z.boolean(), z.string()])
        .optional()
        .transform((value): boolean => normalizeBoolean(value, false)),
    include_user: z
        .union([z.boolean(), z.string()])
        .optional()
        .transform((value): boolean => normalizeBoolean(value, false)),
    page: z
        .union([z.number(), z.string()])
        .optional()
        .transform((value): number => normalizeInteger(value, 1))
        .refine((value): boolean => Number.isInteger(value) && value >= 1, 'page must be a positive integer'),
    pageSize: z
        .union([z.number(), z.string()])
        .optional()
        .transform((value): number => normalizeInteger(value, 20))
        .refine((value): boolean => Number.isInteger(value) && value >= 1 && value <= 100, 'pageSize must be an integer between 1 and 100'),
});

export type TListFuelOrdersQueryDto = z.infer<typeof listFuelOrdersQueryDtoSchema>;
export type ListFuelOrdersQueryDto = TListFuelOrdersQueryDto;
