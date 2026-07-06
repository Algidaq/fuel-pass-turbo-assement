import { catalogKeys, defineErrorCatalog } from './standard-error.types';

export const CS_ERRORS = defineErrorCatalog({
    InvalidBody: {
        code: 'GLOBAL.INVALID-BODY',
        message: 'Invalid body value',
        description: 'The request body is invalid.',
    },

    EmptyClientTimeStamp: {
        code: 'GLOBAL.EMPTY-CLIENT-TIMESTAMP',
        message: 'Client-Timestamp header is empty',
    },

    InvalidClientTimeStamp: {
        code: 'GLOBAL.INVALID-CLIENT-TIMESTAMP',
        message: 'Client-Timestamp header is invalid',
    },

    EmptyURC: {
        code: 'GLOBAL.EMPTY-UNIQUE-REFERENCE-CODE',
        message: 'Unique-Reference-Code header is empty',
    },

    InvalidURC: {
        code: 'GLOBAL.INVALID-UNIQUE-REFERENCE-CODE',
        message: 'Unique-Reference-Code header is invalid',
    },
});

export type CsErrorCode = keyof typeof CS_ERRORS;

export const CS_ERROR_CODES = catalogKeys(CS_ERRORS);
