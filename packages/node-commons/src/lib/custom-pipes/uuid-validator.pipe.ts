import { type ArgumentMetadata, HttpStatus, Injectable, type PipeTransform } from '@nestjs/common';
import { uuid } from 'zod';
import { AppHttpError, CS_ERRORS } from '../standard-errors';

type UuidVersions = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8';

@Injectable()
export class UuidValidatorPipe implements PipeTransform {
    public constructor(public readonly version: UuidVersions = 'v4') {
        //
    }
    public transform(value: any, metadata: ArgumentMetadata): unknown {
        if (metadata.type !== 'param') {
            return value;
        }
        const result = uuid({ version: this.version }).safeParse(value);

        if (result.success) {
            return result.data;
        }

        throw new AppHttpError(HttpStatus.BAD_REQUEST, CS_ERRORS.InvalidParams);
    }
}
