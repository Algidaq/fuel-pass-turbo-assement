import z from 'zod';

export const fuelOrderIdParamSchema = z.string().uuid('id must be a valid UUID');

export const fuelOrderParamsDtoSchema = z.object({
    id: fuelOrderIdParamSchema,
});

export type TFuelOrderIdParamDto = z.infer<typeof fuelOrderIdParamSchema>;
export type TFuelOrderParamsDto = z.infer<typeof fuelOrderParamsDtoSchema>;
