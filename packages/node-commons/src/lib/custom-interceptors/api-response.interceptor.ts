import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { Observable, throwError, type ObservableInput } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse } from '../helpers';
import { AppHttpError } from '../standard-errors';

type JsonSerializable = {
    toJSON: () => Record<string, unknown>;
};

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const response = context.switchToHttp().getResponse<Response>();

        return next.handle().pipe(
            map(this.mapToApiResponse(response)),
            catchError((error, _caught): ObservableInput<any> => {
                if (error instanceof AppHttpError) {
                    const apiResponse = ApiResponse.fromAppError(error);
                    return Promise.resolve(this.mapToApiResponse(response)(apiResponse));
                }
                return throwError((): unknown => error);
            })
        );
    }

    public mapToApiResponse(response: Response): (content: unknown) => unknown {
        return (content): unknown => {
            if (!(content instanceof ApiResponse)) {
                return content;
            }

            response.status(content.status);

            Object.entries(content.headers ?? {}).forEach(([key, value]): void => {
                response.setHeader(key, value);
            });

            if (!content.success) {
                return {
                    errors: content.errors,
                };
            }

            return this.serializeData(content.data);
        };
    }

    private serializeData(data: unknown): unknown {
        if (Buffer.isBuffer(data)) {
            return new StreamableFile(data);
        }

        if (this.hasToJSON(data)) {
            return data.toJSON();
        }

        return data;
    }

    private hasToJSON(value: unknown): value is JsonSerializable {
        return typeof value === 'object' && value !== null && 'toJSON' in value && typeof (value as JsonSerializable).toJSON === 'function';
    }
}
