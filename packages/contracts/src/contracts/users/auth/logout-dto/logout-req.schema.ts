import z from 'zod';

export const logoutReqDtoSchema = z.object({
    refreshToken: z.string().trim().optional(),
});

export type TLogoutRequestDto = z.infer<typeof logoutReqDtoSchema>;
