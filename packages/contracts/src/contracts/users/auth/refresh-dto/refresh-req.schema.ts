import z from 'zod';

export const refreshReqDtoSchema = z.object({
    refreshToken: z.string().trim().min(1, 'refresh token is required'),
});

export type TRefreshRequestDto = z.infer<typeof refreshReqDtoSchema>;
