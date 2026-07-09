import z from 'zod';
import { type FuelOrderStatusDto } from './fuel-order-res.dto';

const fuelOrderStatusValues = ['PENDING', 'CONFIRMED', 'COMPLETED'] as const satisfies readonly FuelOrderStatusDto[];

export const updateFuelOrderStatusReqDtoSchema = z.object({
    status: z.enum(fuelOrderStatusValues),
    note: z
        .string()
        .transform((value): string | null => (value.trim() === '' ? null : value))
        .optional(),
});

export type TUpdateFuelOrderStatusRequestDto = z.infer<typeof updateFuelOrderStatusReqDtoSchema>;
export type UpdateFuelOrderStatusRequestDto = TUpdateFuelOrderStatusRequestDto;
