import { HttpStatus, Injectable, PipeTransform, type ArgumentMetadata } from '@nestjs/common';
import type { ZodType } from 'zod';
import { AppHttpError, CS_ERRORS, type CsStdValidationError } from '../standard-errors';
@Injectable()
export class ZodValidationPipe implements PipeTransform {
    public constructor(private schema: ZodType) {
        //
    }
    public transform(value: any, _metadata: ArgumentMetadata): unknown {
        const result = this.schema.safeParse(value);
        if (result.success) {
            return result.data;
        }

        const formattedErrors = result.error.issues.map((issue): CsStdValidationError => ({
            code: CS_ERRORS.InvalidBody.code,
            message: issue.message,
            field: typeof issue.path === 'string' ? issue.path : issue.path.join('.'),
        }));

        throw new AppHttpError(HttpStatus.BAD_REQUEST, formattedErrors);
    }
}
