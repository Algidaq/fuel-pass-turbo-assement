import { AppHttpError, defineErrorCatalog } from '@fuel-pass/node-commons';
import type { HttpStatus } from '@nestjs/common';

export const AUTH_ERRORS = defineErrorCatalog({
    InvalidCredentials: {
        code: 'AUTH.INVALID-CREDENTIALS',
        message: 'Invalid credentials',
        description: 'The supplied email or password is invalid.',
    },
    InvalidToken: {
        code: 'AUTH.INVALID-TOKEN',
        message: 'Invalid token',
        description: 'The supplied authentication token is invalid or expired.',
    },
    InactiveUser: {
        code: 'AUTH.INACTIVE-USER',
        message: 'User is not active',
        description: 'The user is disabled, locked, or pending verification.',
    },
    InvalidRequest: {
        code: 'AUTH.INVALID-REQUEST',
        message: 'Invalid request',
        description: 'The request body is invalid.',
    },
    InternalApiKeyInvalid: {
        code: 'AUTH.INTERNAL-API-KEY-INVALID',
        message: 'Invalid internal API key',
        description: 'The internal authentication credential is missing or invalid.',
    },
    UserAlreadyExists: {
        code: 'AUTH.USER-ALREADY-EXISTS',
        message: 'User already exists',
        description: 'A user with the supplied email already exists.',
    },
});

export type AuthErrorKey = keyof typeof AUTH_ERRORS;

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
