import { Injectable, Module, type DynamicModule } from '@nestjs/common';
import pino, { type Logger, type LoggerOptions } from 'pino';
import type { ErrorLogObject, LogObject } from './app-logger';

export type PinoAppLoggerOptions = {
    level: string;
    pretty?: boolean;
    service: string;
};

type PinoLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

type MessageFirstLogFn = {
    (message: string, metadata?: Record<string, unknown>): void;
    (message: string, ...args: unknown[]): void;
    (object: object, message?: string, ...args: unknown[]): void;
};

export type TIPinoAppLogger = Omit<Logger, PinoLogLevel> & Record<PinoLogLevel, MessageFirstLogFn>;

const pinoLogLevels: PinoLogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const isLogObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const applyMessageFirstMethods = (logger: Logger): void => {
    for (const level of pinoLogLevels) {
        const log = logger[level].bind(logger);

        logger[level] = (first: unknown, second?: unknown, ...rest: unknown[]): void => {
            if (typeof first === 'string' && isLogObject(second)) {
                log(second, first, ...rest);
                return;
            }

            log(first, second as any, ...rest);
        };
    }
};

export function createPinoAppLogger({ level, pretty = false, service }: PinoAppLoggerOptions): TIPinoAppLogger {
    const loggerOptions: LoggerOptions = {
        level,
        base: {
            service,
        },
        serializers: {
            error: pino.stdSerializers.err,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    };

    if (pretty) {
        loggerOptions.transport = {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
                singleLine: true,
                translateTime: 'SYS:standard',
            },
        };
    }

    const logger = pino(loggerOptions);

    applyMessageFirstMethods(logger);

    return logger;
}
type PinoLogObj = LogObject & Record<string, unknown>;

@Injectable()
export class PinoAppLogger {
    private static _pinoLogger?: TIPinoAppLogger;

    private logger!: TIPinoAppLogger;

    private constructor(private readonly filename?: string) {
        if (!PinoAppLogger._pinoLogger) {
            throw new Error('Pino Logger was not initialized use init method');
        }
        this.logger = PinoAppLogger._pinoLogger.child({ filename });
    }

    public static init(options: PinoAppLoggerOptions): PinoAppLogger {
        if (!this._pinoLogger) {
            this._pinoLogger = createPinoAppLogger(options);
        }
        const logger = new PinoAppLogger();
        logger.logger = this._pinoLogger;
        return logger;
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    public get pino(): TIPinoAppLogger {
        return this.logger;
    }

    public child(filename?: string, extraCtx?: Record<string, any>): PinoAppLogger {
        const logger = new PinoAppLogger(filename);
        logger.logger = logger.logger.child(extraCtx ?? {});
        return logger;
    }

    public log(message: string, object?: PinoLogObj): void {
        this.info(message, object);
    }

    public info(message: string, object?: PinoLogObj): void {
        this._log('info', message, object);
    }

    public debug(message: string, object?: PinoLogObj): void {
        this._log('debug', message, object);
    }

    public error(message: string, object?: ErrorLogObject): void {
        this._log('debug', message, object);
    }

    public trace(message: string, object?: PinoLogObj): void {
        this._log('trace', message, object);
    }

    public warn(message: string, object?: PinoLogObj): void {
        this._log('warn', message, object);
    }

    private _log(logLevel: PinoLogLevel, message: string, object?: LogObject | ErrorLogObject): void {
        this.logger[logLevel](message, object);
    }
}

@Module({})
export class PinoAppLoggerModule {
    public static forRoot(options: PinoAppLoggerOptions): DynamicModule {
        const appLogger = PinoAppLogger.init(options);
        return {
            module: PinoAppLoggerModule,
            global: true,
            providers: [
                {
                    provide: PinoAppLogger,
                    useValue: appLogger,
                },
            ],
            exports: [PinoAppLogger],
        };
    }
}
