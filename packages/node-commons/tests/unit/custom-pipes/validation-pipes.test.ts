import { HttpStatus, type ArgumentMetadata } from '@nestjs/common';
import { z } from 'zod';
import { AppHttpError, CS_ERRORS, UuidValidatorPipe, ZodValidationPipe } from '../../../src';

describe('validation pipes', () => {
    it('returns parsed Zod data on success', () => {
        const pipe = new ZodValidationPipe(
            z.object({
                count: z.coerce.number(),
            })
        );

        expect(pipe.transform({ count: '3' }, {} as ArgumentMetadata)).toEqual({ count: 3 });
    });

    it('throws AppHttpError with field paths for invalid Zod data', () => {
        const pipe = new ZodValidationPipe(
            z.object({
                order: z.object({
                    id: z.string().min(3),
                }),
            })
        );

        expect(() => pipe.transform({ order: { id: 'x' } }, {} as ArgumentMetadata)).toThrow(AppHttpError);

        try {
            pipe.transform({ order: { id: 'x' } }, {} as ArgumentMetadata);
        } catch (error) {
            expect(error).toMatchObject({
                httpCode: HttpStatus.BAD_REQUEST,
                errors: [
                    expect.objectContaining({
                        code: CS_ERRORS.InvalidBody.code,
                        field: 'order.id',
                    }),
                ],
            });
        }
    });

    it('validates UUID params and ignores non-param metadata', () => {
        const pipe = new UuidValidatorPipe();
        const uuid = '3bd3f1fe-0582-4379-99f5-d2f1240eaa7c';

        expect(pipe.transform(uuid, { type: 'param' } as ArgumentMetadata)).toBe(uuid);
        expect(pipe.transform('not-a-uuid', { type: 'body' } as ArgumentMetadata)).toBe('not-a-uuid');
        expect(() => pipe.transform('not-a-uuid', { type: 'param' } as ArgumentMetadata)).toThrow(
            expect.objectContaining({
                httpCode: HttpStatus.BAD_REQUEST,
                errors: [CS_ERRORS.InvalidParams],
            })
        );
    });
});
