import { ORDER_ERRORS, type OrderErrorKey } from '@fuel-pass/contracts';
import { AppHttpError } from '@fuel-pass/node-commons';
import type { HttpStatus } from '@nestjs/common';

export class OrderFailure extends Error {
    public constructor(
        public readonly key: OrderErrorKey,
        message?: string
    ) {
        super(message ?? ORDER_ERRORS[key].message);
    }
}

export class OrderException extends AppHttpError<typeof ORDER_ERRORS> {
    public constructor(httpCode: HttpStatus, key: OrderErrorKey) {
        super(httpCode, ORDER_ERRORS[key]);
    }
}
