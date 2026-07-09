import pino from 'pino';
import { createPinoAppLogger } from '../../../src/lib/logger/pino-app-logger';

const createMockLogger = () => ({
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
});

let mockLogger = createMockLogger();
let mockLogMethods = createMockLogger();

jest.mock('pino', () => {
    const pinoMock = jest.fn(() => {
        mockLogMethods = createMockLogger();
        mockLogger = { ...mockLogMethods };
        return mockLogger;
    });

    return {
        __esModule: true,
        default: pinoMock,
    };
});

const mockedPino = jest.mocked(pino);

describe('createPinoAppLogger', (): void => {
    beforeEach((): void => {
        mockedPino.mockClear();
        mockedPino.stdSerializers = { err: jest.fn() } as typeof pino.stdSerializers;
        mockedPino.stdTimeFunctions = { isoTime: jest.fn() } as typeof pino.stdTimeFunctions;
    });

    it('creates a structured JSON logger by default', (): void => {
        createPinoAppLogger({
            level: 'info',
            service: 'proxy-service',
        });

        expect(mockedPino).toHaveBeenCalledWith({
            level: 'info',
            base: {
                service: 'proxy-service',
            },
            serializers: {
                error: mockedPino.stdSerializers.err,
            },
            timestamp: mockedPino.stdTimeFunctions.isoTime,
        });
    });

    it('adds pino-pretty transport when pretty logs are enabled', (): void => {
        createPinoAppLogger({
            level: 'debug',
            pretty: true,
            service: 'proxy-service',
        });

        expect(mockedPino).toHaveBeenCalledWith({
            level: 'debug',
            base: {
                service: 'proxy-service',
            },
            serializers: {
                error: mockedPino.stdSerializers.err,
            },
            timestamp: mockedPino.stdTimeFunctions.isoTime,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                    singleLine: true,
                    translateTime: 'SYS:standard',
                },
            },
        });
    });

    it('accepts message first and passes structured metadata to pino', (): void => {
        const logger = createPinoAppLogger({
            level: 'info',
            service: 'proxy-service',
        });

        logger.info('Proxy service started', { port: 3100 });

        expect(mockLogMethods.info).toHaveBeenCalledWith({ port: 3100 }, 'Proxy service started');
    });

    it('keeps native pino argument order available for framework integrations', (): void => {
        const logger = createPinoAppLogger({
            level: 'info',
            service: 'proxy-service',
        });

        logger.info({ path: '/health' }, 'request completed');

        expect(mockLogMethods.info).toHaveBeenCalledWith({ path: '/health' }, 'request completed');
    });
});
