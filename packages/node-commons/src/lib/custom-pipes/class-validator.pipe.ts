import { HttpStatus, Injectable, type ArgumentMetadata, type PipeTransform, type Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AppHttpError, CS_ERRORS } from '../standard-errors';

@Injectable()
export class ClassValidatorPipe implements PipeTransform {
    public async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToInstance(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            throw new AppHttpError(HttpStatus.BAD_REQUEST, CS_ERRORS.InvalidBody);
        }
        return value;
    }

    private toValidate(metatype: Type): boolean {
        const types = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype as any);
    }
}
