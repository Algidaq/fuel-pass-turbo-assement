import z from 'zod';

const strictIsoDateSchema = z.string().refine(
    (value): boolean => {
        const date = new Date(value);
        return Number.isFinite(date.getTime()) && date.toISOString() === value;
    },
    { message: 'please provide a valid ISO date' }
);

const positiveFuelVolumeSchema = z.union([z.number(), z.string().trim()]).transform((value, ctx): string => {
    const normalizedValue = typeof value === 'number' ? value.toString() : value;
    const parsedValue = Number(normalizedValue);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        ctx.addIssue({
            code: 'custom',
            message: 'requestedFuelVolume must be a positive number',
        });
        return z.NEVER;
    }

    return parsedValue.toFixed(2);
});

export const createFuelOrderReqDtoSchema = z
    .object({
        tailNumber: z
            .string()
            .trim()
            .min(1, 'tailNumber is required')
            .max(32, 'tailNumber is too long')
            .transform((value): string => value.toUpperCase()),
        airportIcaoCode: z
            .string()
            .trim()
            .transform((value): string => value.toUpperCase())
            .refine((value): boolean => /^[A-Z]{4}$/u.test(value), 'airportIcaoCode must be a valid ICAO code'),
        requestedFuelVolume: positiveFuelVolumeSchema,
        deliveryWindowStartAt: strictIsoDateSchema,
        deliveryWindowEndAt: strictIsoDateSchema,
    })
    .refine((value): boolean => new Date(value.deliveryWindowEndAt).getTime() > new Date(value.deliveryWindowStartAt).getTime(), {
        message: 'deliveryWindowEndAt must be after deliveryWindowStartAt',
        path: ['deliveryWindowEndAt'],
    });

export type TCreateFuelOrderRequestDto = z.infer<typeof createFuelOrderReqDtoSchema>;
export type CreateFuelOrderRequestDto = TCreateFuelOrderRequestDto;
