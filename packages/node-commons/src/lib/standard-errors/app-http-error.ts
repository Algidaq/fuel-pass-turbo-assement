import type { HttpStatus } from '@nestjs/common';
import type { CsStdError, ErrorCatalog } from './standard-error.types';
export class AppHttpError<T extends ErrorCatalog> {
    public readonly errors: CsStdError[];
    public readonly httpCode: HttpStatus;
    public constructor(httpCode: HttpStatus, errorCode: keyof T);
    public constructor(httpCode: HttpStatus, errors: CsStdError | CsStdError[]);

    public constructor(httpCode: HttpStatus, error: keyof T | CsStdError | CsStdError[]) {
        this.httpCode = httpCode;
        this.errors = this.mapToStdError(error);
    }

    private mapToStdError(error: keyof T | CsStdError | CsStdError[]): CsStdError[] {
        if (typeof error === 'object') {
            return Array.isArray(error) ? error : [error];
        }
        return [];
    }
}
