import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { getAuthRuntimeConfig } from '../../configs/auth.config';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
    public constructor(private readonly configService: ConfigService) {}

    private get internalApiKey(): string {
        return this.configService.get<string>('auth.internalServiceApiKey') ?? getAuthRuntimeConfig().internalServiceApiKey;
    }

    public canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.header('x-internal-api-key') ?? this.extractBearerToken(request);

        if (apiKey === this.internalApiKey) {
            return true;
        }

        throw new UnauthorizedException('Invalid internal API key.');
    }

    private extractBearerToken(request: Request): string | undefined {
        const authorization = request.header('authorization');
        const [scheme, token] = authorization?.split(' ') ?? [];

        if (scheme?.toLowerCase() !== 'bearer') {
            return undefined;
        }

        return token;
    }
}
