import pinoHttp from 'pino-http';
import { DEFAULT_PINO_HTTP_OPTIONS, PinoHttpMiddleware } from '../../../src';

jest.mock('pino-http', () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe('PinoHttpMiddleware', (): void => {
    const pinoHttpMock = jest.mocked(pinoHttp);
    let pinoHttpMiddlewareMock: jest.Mock;

    beforeEach((): void => {
        jest.clearAllMocks();
        pinoHttpMiddlewareMock = jest.fn();
        pinoHttpMock.mockReturnValue(pinoHttpMiddlewareMock);
    });

    it('should use default pino-http options when middleware options are omitted', (): void => {
        const middleware = new PinoHttpMiddleware({});

        middleware.use('req', 'res', jest.fn());

        expect(pinoHttpMock).toHaveBeenCalledWith(DEFAULT_PINO_HTTP_OPTIONS);
        expect(pinoHttpMiddlewareMock).toHaveBeenCalledWith('req', 'res', expect.any(Function));
    });

    it('should use configured pino-http options', (): void => {
        const options = {
            autoLogging: false,
            useLevel: 'debug' as const,
        };

        const middleware = new PinoHttpMiddleware({
            pinoHttp: {
                options,
                forRoutes: ['*'],
            },
        });

        middleware.use('req', 'res', jest.fn());

        expect(pinoHttpMock).toHaveBeenCalledWith(options);
    });
});
