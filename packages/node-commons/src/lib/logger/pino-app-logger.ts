import pino, { type Logger, type LoggerOptions } from 'pino';

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

export type PinoAppLogger = Omit<Logger, PinoLogLevel> & Record<PinoLogLevel, MessageFirstLogFn>;

const pinoLogLevels: PinoLogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const isLogObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const applyMessageFirstMethods = (logger: Logger): void => {
    for (const level of pinoLogLevels) {
        const log = logger[level].bind(logger) as (...args: unknown[]) => void;

        logger[level] = ((first: unknown, second?: unknown, ...rest: unknown[]): void => {
            if (typeof first === 'string' && isLogObject(second)) {
                log(second, first, ...rest);
                return;
            }

            log(first, second, ...rest);
        }) as Logger[typeof level];
    }
};

export function createPinoAppLogger({ level, pretty = false, service }: PinoAppLoggerOptions): PinoAppLogger {
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

    return logger as PinoAppLogger;
}
