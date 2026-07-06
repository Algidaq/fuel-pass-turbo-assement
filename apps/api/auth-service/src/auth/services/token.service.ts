import type { JwksResponseDto } from '@fuel-pass/contracts';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID, webcrypto, type KeyObject } from 'node:crypto';
import { getAuthRuntimeConfig } from '../../configs/auth.config';
import type { AccessTokenClaims } from '../types/auth-token.types';

type JwtKey = webcrypto.CryptoKey | KeyObject;

type JwtPayload = Record<string, unknown> & {
    sub?: string;
    jti?: string;
};

@Injectable()
export class TokenService {
    private privateKey?: Promise<JwtKey>;
    private publicKey?: Promise<JwtKey>;

    public constructor(private readonly configService: ConfigService) {}

    public get accessTokenTtlSeconds(): number {
        return this.configService.get<number>('auth.accessTokenTtlSeconds') ?? getAuthRuntimeConfig().accessTokenTtlSeconds;
    }

    public get refreshTokenTtlDays(): number {
        return this.configService.get<number>('auth.refreshTokenTtlDays') ?? getAuthRuntimeConfig().refreshTokenTtlDays;
    }

    private get issuer(): string {
        return this.configService.get<string>('auth.issuer') ?? getAuthRuntimeConfig().issuer;
    }

    private get audience(): string {
        return this.configService.get<string>('auth.audience') ?? getAuthRuntimeConfig().audience;
    }

    private get jwtPrivateKey(): string {
        return this.configService.get<string>('auth.jwtPrivateKey') ?? getAuthRuntimeConfig().jwtPrivateKey;
    }

    private get jwtPublicKey(): string {
        return this.configService.get<string>('auth.jwtPublicKey') ?? getAuthRuntimeConfig().jwtPublicKey;
    }

    private get jwtKeyId(): string {
        return this.configService.get<string>('auth.jwtKeyId') ?? getAuthRuntimeConfig().jwtKeyId;
    }

    public async generateAccessToken(claims: AccessTokenClaims): Promise<string> {
        const { SignJWT } = await import('jose');

        return new SignJWT({
            email: claims.email,
            roles: claims.roles,
            permissions: claims.permissions,
            sid: claims.sid,
        })
            .setProtectedHeader({ alg: 'RS256', kid: this.jwtKeyId, typ: 'JWT' })
            .setSubject(claims.sub)
            .setIssuer(this.issuer)
            .setAudience(this.audience)
            .setJti(claims.jti)
            .setIssuedAt()
            .setExpirationTime(`${this.accessTokenTtlSeconds}s`)
            .sign(await this.getPrivateKey());
    }

    public generateRefreshToken(): string {
        return randomBytes(48).toString('base64url');
    }

    public generateTokenId(): string {
        return randomUUID();
    }

    public hashRefreshToken(rawRefreshToken: string): string {
        return createHash('sha256').update(rawRefreshToken).digest('hex');
    }

    public async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
        const { jwtVerify } = await import('jose');
        const result = await jwtVerify(token, await this.getPublicKey(), {
            issuer: this.issuer,
            audience: this.audience,
            algorithms: ['RS256'],
        });

        return this.toAccessTokenClaims(result.payload);
    }

    public async getJwks(): Promise<JwksResponseDto> {
        const { exportJWK } = await import('jose');
        const jwk = await exportJWK(await this.getPublicKey());

        return {
            keys: [
                {
                    ...jwk,
                    kty: jwk.kty ?? 'RSA',
                    use: 'sig',
                    kid: this.jwtKeyId,
                    alg: 'RS256',
                },
            ],
        };
    }

    private toAccessTokenClaims(payload: JwtPayload): AccessTokenClaims {
        if (
            typeof payload.sub !== 'string' ||
            typeof payload['sid'] !== 'string' ||
            typeof payload.jti !== 'string' ||
            typeof payload['email'] !== 'string' ||
            !Array.isArray(payload['roles']) ||
            !Array.isArray(payload['permissions'])
        ) {
            throw new Error('Access token payload is invalid.');
        }

        return {
            sub: payload.sub,
            sid: payload['sid'],
            jti: payload.jti,
            email: payload['email'],
            roles: payload['roles'].filter((role: unknown): role is string => typeof role === 'string'),
            permissions: payload['permissions'].filter((permission: unknown): permission is string => typeof permission === 'string'),
        };
    }

    private async getPrivateKey(): Promise<JwtKey> {
        const { importPKCS8 } = await import('jose');
        this.privateKey ??= importPKCS8(this.jwtPrivateKey, 'RS256');
        return this.privateKey;
    }

    private async getPublicKey(): Promise<JwtKey> {
        const { importSPKI } = await import('jose');
        this.publicKey ??= importSPKI(this.jwtPublicKey, 'RS256');
        return this.publicKey;
    }
}
