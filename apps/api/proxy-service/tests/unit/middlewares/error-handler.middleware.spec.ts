import express from 'express';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { errorHandlerMiddleware } from '../../../src/middlewares/error-handler.middleware';

type RunningServer = {
    close: () => Promise<void>;
    url: string;
};

const listen = async (application: express.Express): Promise<RunningServer> => {
    const server = await new Promise<http.Server>((resolve): void => {
        const runningServer = application.listen(0, (): void => resolve(runningServer));
    });
    const address = server.address() as AddressInfo;

    return {
        url: `http://127.0.0.1:${address.port}`,
        close: () =>
            new Promise((resolve, reject): void => {
                server.close((error): void => {
                    if (error !== undefined) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            }),
    };
};

describe('errorHandlerMiddleware', () => {
    let server: RunningServer;

    afterEach(async () => {
        await server.close();
    });

    it('returns a generic 500 response for unhandled errors', async () => {
        const application = express();

        application.get('/throws', (): void => {
            throw new Error('database password leaked');
        });
        application.use(errorHandlerMiddleware);

        server = await listen(application);

        const response = await fetch(`${server.url}/throws`);
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload).toEqual({
            success: false,
            errors: [{ code: 'PROXY.INTERNAL_SERVER_ERROR', message: 'An unexpected proxy error occurred.' }],
        });
    });

    it('preserves explicit 4xx status codes and messages', async () => {
        const application = express();

        application.get('/bad-request', (_request, _response, next): void => {
            next(Object.assign(new Error('Invalid proxy request.'), { statusCode: 400 }));
        });
        application.use(errorHandlerMiddleware);

        server = await listen(application);

        const response = await fetch(`${server.url}/bad-request`);
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload).toEqual({
            success: false,
            errors: [{ code: 'PROXY.REQUEST_FAILED', message: 'Invalid proxy request.' }],
        });
    });
});
