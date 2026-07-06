/* eslint-disable @typescript-eslint/member-ordering */

import { StatusCodes } from 'http-status-codes';
import type { AppHttpError, CsStdError, ErrorCatalog } from '../standard-errors';

export class ApiResponse<T = unknown> {
    protected _status: number = StatusCodes.OK;
    protected _headers: Record<string, string> = {};
    protected _data?: T;
    protected _errors: CsStdError[] = [];
    protected _success = true;

    protected constructor(params?: Partial<ApiResponse<T>>) {
        if (params === undefined || params === null) {
            return;
        }

        this._status = params.status || this._status;
        this._headers = params.headers || this._headers;
        this._data = params.data || this._data;
        this._success = params.success ?? this._success;
        this._errors = params.errors || this._errors;
    }

    public static builder<T = unknown>(): AbstractApiResponseBuilder<T> {
        return new ApiResponseBuilder<T>();
    }

    public static fromAppError(e: AppHttpError<ErrorCatalog>): ApiResponse<unknown> {
        return ApiResponse.builder<unknown>()
            .withFailure({
                status: e.httpCode,
                errors: e.errors,
            })
            .build();
    }

    public get success(): boolean {
        return this._success;
    }

    public get status(): number {
        return this._status;
    }

    public get headers(): Readonly<Record<string, string>> {
        return Object.freeze(this._headers);
    }

    public get data(): T | undefined {
        return this._data;
    }

    public get errors(): CsStdError[] {
        return this._errors;
    }
}

abstract class AbstractApiResponseBuilder<T = unknown> {
    public abstract withStatus(status: number): AbstractApiResponseBuilder<T>;

    public abstract withHeaders(headers: Record<string, string>): AbstractApiResponseBuilder<T>;

    public abstract withHeader(key: string, value: string): AbstractApiResponseBuilder<T>;

    public abstract withData(data?: T): AbstractApiResponseBuilder<T>;

    public abstract withErrors(errors: CsStdError[]): AbstractApiResponseBuilder<T>;

    public abstract withError(error: CsStdError): AbstractApiResponseBuilder<T>;

    public abstract withSuccess(
        success:
            | boolean
            | {
                  status: number;
                  data?: T;
                  headers?: Record<string, string>;
              }
    ): AbstractApiResponseBuilder<T>;

    public abstract withFailure(params: {
        status: number;
        errors: CsStdError | CsStdError[];
        headers?: Record<string, string>;
    }): AbstractApiResponseBuilder<T>;

    public abstract build(): ApiResponse<T>;
}

class ApiResponseBuilder<T = unknown> extends ApiResponse<T> implements AbstractApiResponseBuilder<T> {
    public constructor() {
        super();
    }

    public withFailure(params: {
        status: number;
        errors: CsStdError | CsStdError[];
        headers?: Record<string, string>;
    }): AbstractApiResponseBuilder<T> {
        return this.withSuccess(false)
            .withStatus(params.status)
            .withErrors(Array.isArray(params.errors) ? params.errors : [params.errors])
            .withHeaders(params.headers || {});
    }

    public withSuccess(
        param:
            | boolean
            | {
                  status: number;
                  data?: T;
                  headers?: Record<string, string>;
              }
    ): AbstractApiResponseBuilder<T> {
        if (typeof param === 'boolean') {
            this._success = param;
        } else {
            this._success = true;

            this.withStatus(param.status)
                .withData(param.data)
                .withHeaders(param.headers || {});
        }

        return this;
    }

    public withStatus(status: number): AbstractApiResponseBuilder<T> {
        this._status = status;
        return this;
    }

    public withHeaders(headers: Record<string, string>): AbstractApiResponseBuilder<T> {
        this._headers = headers;
        return this;
    }

    public withHeader(key: string, value: string): AbstractApiResponseBuilder<T> {
        this._headers[key] = value;
        return this;
    }

    public withData(data?: T): AbstractApiResponseBuilder<T> {
        this._data = data;
        return this;
    }

    public withErrors(errors: CsStdError[]): AbstractApiResponseBuilder<T> {
        this._success = errors.length > 0 ? false : this._success;
        this._errors = errors;
        return this;
    }

    public withError(error: CsStdError): AbstractApiResponseBuilder<T> {
        this._success = false;
        this._errors.push(error);
        return this;
    }

    public build(): ApiResponse<T> {
        return this;
    }
}
