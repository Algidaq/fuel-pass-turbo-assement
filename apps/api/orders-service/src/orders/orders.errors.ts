import { AppHttpError, defineErrorCatalog } from '@fuel-pass/node-commons';
import type { HttpStatus } from '@nestjs/common';

export const ORDER_ERRORS = defineErrorCatalog({
    InvalidRequest: {
        code: 'ORDER.INVALID-REQUEST',
        message: 'Invalid request',
        description: 'The supplied fuel order request is invalid.',
    },
    FuelOrderNotFound: {
        code: 'ORDER.FUEL-ORDER-NOT-FOUND',
        message: 'Fuel order not found',
        description: 'No fuel order exists for the supplied identifier.',
    },
    InvalidStatusTransition: {
        code: 'ORDER.INVALID-STATUS-TRANSITION',
        message: 'Invalid status transition',
        description: 'The requested fuel order status transition is not allowed.',
    },
    Forbidden: {
        code: 'ORDER.FORBIDDEN',
        message: 'Forbidden',
        description: 'The authenticated user does not have permission to perform this action.',
    },
});

export type OrderErrorKey = keyof typeof ORDER_ERRORS;

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
