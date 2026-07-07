import type { IntrospectResponseDto } from '@fuel-pass/contracts/backend';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { getAuthRuntimeConfig } from '../../configs/orders-auth.config';
import type { AuthenticatedPrincipal, AuthenticatedRequest } from '../types/auth-request.types';

@Injectable()
export class OrdersJwtAuthGuard implements CanActivate {
    public constructor(private readonly configService: ConfigService) {}

    private get internalAuthBaseUrl(): string {
        return this.configService.get<string>('auth.internalAuthBaseUrl') ?? getAuthRuntimeConfig().internalAuthBaseUrl;
    }

    private get internalServiceApiKey(): string {
        return this.configService.get<string>('auth.internalServiceApiKey') ?? getAuthRuntimeConfig().internalServiceApiKey;
    }

    private get introspectionTimeoutMs(): number {
        return this.configService.get<number>('auth.introspectionTimeoutMs') ?? getAuthRuntimeConfig().introspectionTimeoutMs;
    }

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractBearerToken(request);

        if (token === null) {
            throw new UnauthorizedException('Missing bearer token.');
        }

        const principal = await this.introspect(token);

        if (principal === null) {
            throw new UnauthorizedException('Invalid bearer token.');
        }

        request.auth = principal;

        return true;
    }

    private async introspect(token: string): Promise<AuthenticatedPrincipal | null> {
        const controller = new AbortController();
        const timeout = setTimeout((): void => controller.abort(), this.introspectionTimeoutMs);

        try {
            const response = await fetch(`${this.internalAuthBaseUrl.replace(/\/+$/u, '')}/introspect`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-internal-api-key': this.internalServiceApiKey,
                },
                body: JSON.stringify({ token }),
                signal: controller.signal,
            });

            if (!response.ok) {
                return null;
            }

            return this.toPrincipal((await response.json()) as unknown);
        } catch {
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    private toPrincipal(response: unknown): AuthenticatedPrincipal | null {
        const data = this.extractData(response);

        if (data.active !== true || data.user === undefined) {
            return null;
        }

        return {
            userId: data.sub,
            sessionId: data.sessionId,
            email: data.email,
            roles: data.roles,
            permissions: data.permissions,
            jti: '',
        };
    }

    private extractData(response: unknown): IntrospectResponseDto {
        const maybeWrapped = response as { data?: unknown };
        const data = maybeWrapped.data ?? response;

        return data as IntrospectResponseDto;
    }

    private extractBearerToken(request: Request): string | null {
        const authorization = request.header('authorization');

        if (authorization === undefined) {
            return null;
        }

        const [scheme, token] = authorization.split(' ');

        if (scheme?.toLowerCase() !== 'bearer' || token === undefined || token.trim().length === 0) {
            return null;
        }

        return token;
    }
}
