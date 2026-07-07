import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';
import { plainToInstance } from 'class-transformer';
import { BaseApiHeaders } from '../models';

export const CsHeaders = createParamDecorator<never>((_data: unknown, ctx: ExecutionContext): unknown => {
    const req = ctx.switchToHttp().getRequest();
    return plainToInstance(BaseApiHeaders, req.headers);
});

export const CsTransform = <T>(type: ClassConstructor<T>, key: 'headers' | 'body' | 'query'): ParameterDecorator => {
    return createParamDecorator((_, ctx): unknown => {
        const req = ctx.switchToHttp().getRequest();
        return plainToInstance(type, req[key]);
    })();
};
