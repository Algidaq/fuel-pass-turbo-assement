import z from 'zod';

export const createInternalUserReqDtoSchema = z.object({
    email: z.email('please provide a valid email').trim(),
    fullName: z.string().trim().min(1, 'full name is required'),
    password: z.string().min(1, 'password is required'),
    roleKeys: z.array(z.string().trim().min(1, 'role key is required')).min(1, 'at least one role is required'),
    status: z.enum(['ACTIVE', 'DISABLED', 'LOCKED', 'PENDING_VERIFICATION']).optional(),
});

export type TCreateInternalUserRequestDto = z.infer<typeof createInternalUserReqDtoSchema>;
export type CreateInternalUserRequestDto = TCreateInternalUserRequestDto;
