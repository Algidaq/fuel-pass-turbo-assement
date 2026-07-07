import z from 'zod';

export const introspectReqDtoSchema = z.object({
    token: z.string().trim().min(1, 'token is required'),
});

export type TIntroSpectRequestDto = z.infer<typeof introspectReqDtoSchema>;
export type TIntrospectRequestDto = TIntroSpectRequestDto;
export type IntrospectRequestDto = TIntrospectRequestDto;
