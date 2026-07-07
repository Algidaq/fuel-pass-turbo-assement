import { Injectable, Logger } from '@nestjs/common';

export type LogObject = Record<string, unknown>;

@Injectable()
export class AppLogger {
    private readonly logger: Logger = new Logger(AppLogger.name);

    public info(message: string, object?: LogObject): void {
        this.logger.log(this.buildPayload(message, object));
    }

    public debug(message: string, object?: LogObject): void {
        this.logger.debug(this.buildPayload(message, object));
    }

    public error(message: string, object?: LogObject): void {
        const error = object?.['error'];
        const stack = error instanceof Error ? error.stack : undefined;

        this.logger.error(this.buildPayload(message, object), stack);
    }

    public trace(message: string, object?: LogObject): void {
        this.logger.verbose(this.buildPayload(message, object));
    }

    private buildPayload(message: string, object?: LogObject): string | LogObject {
        if (object === undefined) {
            return message;
        }

        const error = object['error'];

        if (!(error instanceof Error)) {
            return {
                message,
                ...object,
            };
        }

        return {
            message,
            ...object,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        };
    }
}
