import z from 'zod';

export const fuelOrderIdParamSchema = z.string().uuid('id must be a valid UUID');

export const fuelOrderParamsDtoSchema = z.object({
    id: fuelOrderIdParamSchema,
});

export const fuelOrderQueryDtoSchema = z.object({
    include_status_history: z
        .union([z.string(), z.boolean()])
        .optional()
        .default(false)
        .transform((value): boolean => value === true || (typeof value === 'string' && value.toLowerCase() === 'true')),
    include_user: z
        .union([z.string(), z.boolean()])
        .optional()
        .default(false)
        .transform((value): boolean => value === true || (typeof value === 'string' && value.toLowerCase() === 'true')),
});

export type TFuelOrderIdParamDto = z.infer<typeof fuelOrderIdParamSchema>;
export type TFuelOrderParamsDto = z.infer<typeof fuelOrderParamsDtoSchema>;
export type TFuelOrderQueryDto = z.infer<typeof fuelOrderQueryDtoSchema>;
