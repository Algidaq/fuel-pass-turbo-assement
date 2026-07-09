import { Logger } from '@nestjs/common';
import { AppLogger } from '../../../src';

describe('AppLogger', (): void => {
    let logger: AppLogger;
    let logSpy: jest.SpyInstance;
    let debugSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;
    let verboseSpy: jest.SpyInstance;

    beforeEach((): void => {
        logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation((): void => undefined);
        debugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation((): void => undefined);
        errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation((): void => undefined);
        verboseSpy = jest.spyOn(Logger.prototype, 'verbose').mockImplementation((): void => undefined);

        logger = new AppLogger();
    });

    afterEach((): void => {
        jest.restoreAllMocks();
    });

    it('should log info messages with structured metadata', (): void => {
        const headers = { urc: 'user-request-code', grc: 'global-request-code' };
        const body = { email: 'test@example.com' };

        logger.info('login requested', { headers, body });

        expect(logSpy).toHaveBeenCalledWith({
            message: 'login requested',
            headers,
            body,
        });
    });

    it('should log debug messages', (): void => {
        logger.debug('token generated', { tokenId: 'token-id' });

        expect(debugSpy).toHaveBeenCalledWith({
            message: 'token generated',
            tokenId: 'token-id',
        });
    });

    it('should log trace messages through the Nest verbose logger', (): void => {
        logger.trace('session lookup', { sessionId: 'session-id' });

        expect(verboseSpy).toHaveBeenCalledWith({
            message: 'session lookup',
            sessionId: 'session-id',
        });
    });

    it('should log plain messages when metadata is omitted', (): void => {
        logger.info('application started');

        expect(logSpy).toHaveBeenCalledWith('application started');
    });

    it('should log error metadata and pass the error stack to Nest Logger', (): void => {
        const cause = new Error('invalid credentials');

        logger.error('login failed', {
            headers: { urc: 'user-request-code' },
            error: cause,
        });

        expect(errorSpy).toHaveBeenCalledWith(
            {
                message: 'login failed',
                headers: { urc: 'user-request-code' },
                error: {
                    name: cause.name,
                    message: cause.message,
                    stack: cause.stack,
                },
            },
            cause.stack
        );
    });

    it('should log non-error values passed in the error field', (): void => {
        logger.error('login failed', {
            error: 'invalid credentials',
        });

        expect(errorSpy).toHaveBeenCalledWith(
            {
                message: 'login failed',
                error: 'invalid credentials',
            },
            undefined
        );
    });
});
