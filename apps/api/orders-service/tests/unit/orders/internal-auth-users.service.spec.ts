import axios from 'axios';
import { FuelOrderUserResDto } from '@fuel-pass/contracts/backend';
import { withHttpRetry, type CoreAuthModuleOptions } from '@fuel-pass/node-commons';
import { InternalAuthUsersService } from '../../../src/orders/services/internal-auth-users.service';

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
}));

jest.mock('@fuel-pass/node-commons', () => {
    const actual = jest.requireActual('@fuel-pass/node-commons');

    return {
        ...actual,
        withHttpRetry: jest.fn((callback: () => Promise<unknown>): Promise<unknown> => callback()),
    };
});

const axiosMock = axios as jest.Mocked<typeof axios>;
const withHttpRetryMock = withHttpRetry as jest.MockedFunction<typeof withHttpRetry>;

function createLoggerMock(): { child: jest.Mock; info: jest.Mock; error: jest.Mock } {
    const logger = {
        child: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    };
    logger.child.mockReturnValue(logger);
    return logger;
}

function createService(): { service: InternalAuthUsersService; logger: ReturnType<typeof createLoggerMock> } {
    const logger = createLoggerMock();
    const options: CoreAuthModuleOptions = {
        internalAuthBaseUrl: 'http://auth.test/api/internal/auth/',
        internalServiceApiKey: 'internal-key',
        introspectionTimeoutMs: 2500,
    };

    return {
        service: new InternalAuthUsersService(options, logger as never),
        logger,
    };
}

describe('InternalAuthUsersService', () => {
    beforeEach(() => {
        axiosMock.post.mockReset();
        withHttpRetryMock.mockClear();
    });

    it('returns an empty map without calling auth when no user IDs are provided', async () => {
        const { service } = createService();

        await expect(service.lookupUsersByIds([])).resolves.toEqual(new Map());
        expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('deduplicates user IDs and maps wrapped lookup responses', async () => {
        axiosMock.post.mockResolvedValue({
            data: {
                data: {
                    users: [
                        {
                            id: 'user-1',
                            email: 'user-1@fuelpass.test',
                            fullName: 'User One',
                        },
                        undefined,
                    ],
                },
            },
        });
        const { service } = createService();

        const result = await service.lookupUsersByIds(['user-1', 'user-1']);

        expect(withHttpRetryMock).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith(
            'http://auth.test/api/internal/auth/users/lookup',
            { userIds: ['user-1'] },
            {
                headers: {
                    'content-type': 'application/json',
                    'x-internal-api-key': 'internal-key',
                },
                timeout: 2500,
            }
        );
        expect(result.get('user-1')).toBeInstanceOf(FuelOrderUserResDto);
        expect(result.get('user-1')).toMatchObject({
            id: 'user-1',
            email: 'user-1@fuelpass.test',
            fullName: 'User One',
        });
    });

    it('maps unwrapped lookup responses', async () => {
        axiosMock.post.mockResolvedValue({
            data: {
                users: [
                    {
                        id: 'user-2',
                        email: 'user-2@fuelpass.test',
                        fullName: 'User Two',
                    },
                ],
            },
        });
        const { service } = createService();

        const result = await service.lookupUsersByIds(['user-2']);

        expect(result.get('user-2')).toMatchObject({
            id: 'user-2',
            email: 'user-2@fuelpass.test',
            fullName: 'User Two',
        });
    });

    it('logs and returns an empty map when auth lookup fails', async () => {
        axiosMock.post.mockRejectedValue(new Error('auth unavailable'));
        const { service, logger } = createService();

        await expect(service.lookupUsersByIds(['user-1'])).resolves.toEqual(new Map());
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('lookup failed'), { error: expect.any(Error) });
    });
});
