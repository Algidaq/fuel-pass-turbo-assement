import { Injectable, Logger } from '@nestjs/common';
import type { BaseApiHeaders } from '../models';

export type LogObject = { headers?: BaseApiHeaders; data?: Record<string, unknown> };
export type ErrorLogObject = LogObject & { error: unknown };

@Injectable()
export class AppLogger {
    private readonly logger: Logger = new Logger(AppLogger.name);

    public info(message: string, object?: LogObject): void {
        this.logger.log(message, object);
    }

    public debug(message: string, object?: LogObject): void {
        this.logger.debug(message, object);
    }

    public error(message: string, object?: ErrorLogObject): void {
        const error = object?.error;
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(message, object, stack);
    }

    public trace(message: string, object?: LogObject): void {
        this.logger.verbose(message, object);
    }
}
