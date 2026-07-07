import { AUTH_ERRORS, type AuthErrorKey } from '@fuel-pass/contracts';
import { AppHttpError } from '@fuel-pass/node-commons';
import type { HttpStatus } from '@nestjs/common';

export class AuthFailure extends Error {
    public constructor(
        public readonly key: AuthErrorKey,
        message?: string
    ) {
        super(message ?? AUTH_ERRORS[key].message);
    }
}

export class AuthException extends AppHttpError<typeof AUTH_ERRORS> {
    public constructor(httpCode: HttpStatus, key: AuthErrorKey) {
        super(httpCode, AUTH_ERRORS[key]);
    }
}
