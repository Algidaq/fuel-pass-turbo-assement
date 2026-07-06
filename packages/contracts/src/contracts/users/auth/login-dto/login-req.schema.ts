import z from 'zod';

// use zod's built-in email validation instead of a fragile custom regex
export const loginReqDtoSchema = z.object({
    email: z.email('please provide a valid email').trim(),
    password: z.string().min(8, 'password must be at least 8 characters').max(128, 'password too long').trim(),
});

export type TLoginRequestDto = z.infer<typeof loginReqDtoSchema>;
export type LoginRequestDto = TLoginRequestDto;
