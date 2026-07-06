import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../helpers';

type JsonSerializable = {
    toJSON: () => Record<string, unknown>;
};

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const response = context.switchToHttp().getResponse<Response>();

        return next.handle().pipe(
            map((content: unknown): unknown => {
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
            })
        );
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
