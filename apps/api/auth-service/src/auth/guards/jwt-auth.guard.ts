import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUserService } from '../services/current-user.service';
import { TokenService } from '../services/token.service';
import type { AuthenticatedPrincipal, AuthenticatedRequest } from '../types/auth-request.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    public constructor(
        private readonly tokenService: TokenService,
        private readonly currentUserService: CurrentUserService
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractBearerToken(request);

        if (token === null) {
            throw new UnauthorizedException('Missing bearer token.');
        }

        try {
            const claims = await this.tokenService.verifyAccessToken(token);
            const freshUser = await this.currentUserService.buildCurrentUser(claims.sub, claims.sid);
            const principal: AuthenticatedPrincipal = {
                userId: freshUser.id,
                sessionId: claims.sid,
                email: freshUser.email,
                roles: freshUser.roles,
                permissions: freshUser.permissions,
                jti: claims.jti,
            };

            request.auth = principal;

            return true;
        } catch {
            throw new UnauthorizedException('Invalid bearer token.');
        }
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
