import z from 'zod';

export const fuelOrderIdParamSchema = z.string().uuid('id must be a valid UUID');

export const fuelOrderParamsDtoSchema = z.object({
    id: fuelOrderIdParamSchema,
});

export const fuelOrderQueryDtoSchema = z.object({
    include_status_history: z
        .string()
        .transform((value): boolean => value.toLowerCase() === 'true')
        .default(false)
        .optional(),
});

export type TFuelOrderIdParamDto = z.infer<typeof fuelOrderIdParamSchema>;
export type TFuelOrderParamsDto = z.infer<typeof fuelOrderParamsDtoSchema>;
export type TFuelOrderQueryDto = z.infer<typeof fuelOrderQueryDtoSchema>;
