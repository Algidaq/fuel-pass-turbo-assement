import z from 'zod';

export const internalUserLookupReqDtoSchema = z.object({
    userIds: z.array(z.string().uuid('userId must be a valid UUID')).min(1).max(1000),
});

export type TInternalUserLookupRequestDto = z.infer<typeof internalUserLookupReqDtoSchema>;
export type InternalUserLookupRequestDto = TInternalUserLookupRequestDto;
