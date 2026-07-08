import pino, { type Logger, type LoggerOptions } from 'pino';
import { envs } from '../configs/config';

const loggerOptions: LoggerOptions = {
    level: envs.app.logLevel,
    base: {
        service: 'proxy-service',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
};

export const logger: Logger = pino(loggerOptions);
