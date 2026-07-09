import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalApiKeyGuard } from '../../../src/auth/guards/internal-api-key.guard';

function createContext(headers: Record<string, string | undefined>): ExecutionContext {
    const request = {
        header: jest.fn((name: string): string | undefined => headers[name.toLowerCase()]),
    };

    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as unknown as ExecutionContext;
}

function createGuard(configValue: string | undefined = 'internal-key'): InternalApiKeyGuard {
    return new InternalApiKeyGuard({
        get: jest.fn((): string | undefined => configValue),
    } as unknown as ConfigService);
}

describe('InternalApiKeyGuard', () => {
    it('accepts the internal API key header', () => {
        const guard = createGuard();

        expect(
            guard.canActivate(
                createContext({
                    'x-internal-api-key': 'internal-key',
                })
            )
        ).toBe(true);
    });

    it('accepts bearer token fallback authorization', () => {
        const guard = createGuard();

        expect(
            guard.canActivate(
                createContext({
                    authorization: 'Bearer internal-key',
                })
            )
        ).toBe(true);
    });

    it('rejects missing or invalid API keys', () => {
        const guard = createGuard();

        expect(() =>
            guard.canActivate(
                createContext({
                    'x-internal-api-key': 'wrong-key',
                })
            )
        ).toThrow(UnauthorizedException);
    });

    it('ignores non-bearer authorization schemes', () => {
        const guard = createGuard();

        expect(() =>
            guard.canActivate(
                createContext({
                    authorization: 'Basic internal-key',
                })
            )
        ).toThrow(UnauthorizedException);
    });
});
