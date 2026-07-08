import axios from 'axios';
import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AxiosResponse } from 'axios';
import { AppHttpError, CS_ERRORS } from '../standard-errors';
import { withHttpRetry } from '../http';
import { CORE_AUTH_MODULE_OPTIONS, type CoreAuthModuleOptions } from './core-auth.module';
import type { AuthenticatedPrincipal, AuthenticatedRequest, IntrospectionResponse } from './auth.types';

@Injectable()
export class JwtIntrospectionAuthGuard implements CanActivate {
    public constructor(@Inject(CORE_AUTH_MODULE_OPTIONS) private readonly options: CoreAuthModuleOptions) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractBearerToken(request);

        if (token === null) {
            throw new AppHttpError(HttpStatus.UNAUTHORIZED, CS_ERRORS.MissingAuthorizationToken);
        }

        const principal = await this.introspect(token);

        if (principal === null) {
            throw new AppHttpError(HttpStatus.UNAUTHORIZED, CS_ERRORS.InvalidAuthorizationToken);
        }

        request.auth = principal;

        return true;
    }

    private async introspect(token: string): Promise<AuthenticatedPrincipal | null> {
        try {
            const response = await withHttpRetry(
                (): Promise<AxiosResponse<unknown>> =>
                    axios.post<unknown>(
                        `${this.options.internalAuthBaseUrl.replace(/\/+$/u, '')}/introspect`,
                        { token },
                        {
                            headers: {
                                'content-type': 'application/json',
                                'x-internal-api-key': this.options.internalServiceApiKey,
                            },
                            timeout: this.options.introspectionTimeoutMs,
                        }
                    )
            );

            return this.toPrincipal(response.data);
        } catch {
            return null;
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

    private extractData(response: unknown): IntrospectionResponse {
        const maybeWrapped = response as { data?: unknown };
        const data = maybeWrapped.data ?? response;

        return data as IntrospectionResponse;
    }

    private extractBearerToken(request: AuthenticatedRequest): string | null {
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
