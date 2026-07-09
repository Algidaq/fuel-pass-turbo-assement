import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TokenService } from '../../../src/auth/services/token.service';

jest.mock('jose', () => ({
    exportJWK: jest.fn().mockResolvedValue({
        kty: 'RSA',
        n: 'public-modulus',
        e: 'AQAB',
    }),
    importSPKI: jest.fn().mockResolvedValue({ type: 'public' }),
}));

function getEnvValue(key: string): string | number {
    const env = Object.fromEntries(
        readFileSync(join(__dirname, '../../../auth-service-dev.env'), 'utf-8')
            .split('\n')
            .filter((line: string): boolean => line.includes('='))
            .map((line: string): [string, string] => {
                const index = line.indexOf('=');
                return [
                    line.slice(0, index),
                    line
                        .slice(index + 1)
                        .replace(/^"|"$/g, '')
                        .replace(/\\n/g, '\n'),
                ];
            })
    );

    const values: Record<string, string | number> = {
        'auth.issuer': env['JWT_ISSUER'] ?? '',
        'auth.audience': env['JWT_AUDIENCE'] ?? '',
        'auth.accessTokenTtlSeconds': Number(env['JWT_ACCESS_TOKEN_TTL_SECONDS'] ?? 900),
        'auth.refreshTokenTtlDays': Number(env['REFRESH_TOKEN_TTL_DAYS'] ?? 7),
        'auth.jwtPrivateKey': env['JWT_PRIVATE_KEY'] ?? '',
        'auth.jwtPublicKey': env['JWT_PUBLIC_KEY'] ?? '',
        'auth.jwtKeyId': env['JWT_KEY_ID'] ?? '',
    };

    return values[key] ?? '';
}

describe('TokenService', () => {
    it('exports only public JWKS material', async () => {
        const configService = {
            get: jest.fn((key: string): string | number => getEnvValue(key)),
        };
        const service = new TokenService(configService as unknown as ConfigService);

        const jwks = await service.getJwks();

        expect(jwks.keys).toHaveLength(1);
        expect(jwks.keys[0]).toMatchObject({
            kty: 'RSA',
            use: 'sig',
            kid: 'fuelpass-auth-dev-1',
            alg: 'RS256',
        });
        expect(jwks.keys[0]).not.toHaveProperty('d');
        expect(jwks.keys[0]).not.toHaveProperty('p');
        expect(jwks.keys[0]).not.toHaveProperty('q');
    });
});
