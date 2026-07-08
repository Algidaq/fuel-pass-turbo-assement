import { Module } from '@nestjs/common';
import { AuthPersistenceModule } from './auth-persistence.module';
import { AuthController } from './controllers/auth.controller';
import { InternalAuthController } from './controllers/internal-auth.controller';
import { JwksController } from './controllers/jwks.controller';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditService } from './services/audit.service';
import { AuthCurrentUserService } from './services/auth-current-user.service';
import { AuthIntrospectionService } from './services/auth-introspection.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthLogoutService } from './services/auth-logout.service';
import { AuthRefreshService } from './services/auth-refresh.service';
import { CurrentUserService } from './services/current-user.service';
import { InternalUserCreationService } from './services/internal-user-creation.service';
import { InternalUserLookupService } from './services/internal-user-lookup.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { AbstractSessionCreationService } from './services/session-creation-service/abstract-session-creation.service';
import { SessionCreationService } from './services/session-creation-service/session-creation.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';

const authServices = [AuditService, CurrentUserService, PasswordService, RefreshTokenService, SessionService, TokenService];
const authEndpointServices = [
    AuthCurrentUserService,
    AuthIntrospectionService,
    AuthLoginService,
    AuthLogoutService,
    AuthRefreshService,
    InternalUserCreationService,
    InternalUserLookupService,
];

@Module({
    imports: [AuthPersistenceModule],
    controllers: [AuthController, JwksController, InternalAuthController],
    providers: [
        ...authServices,
        {
            provide: AbstractSessionCreationService,
            useClass: SessionCreationService,
        },
        ...authEndpointServices,
        JwtAuthGuard,
        InternalApiKeyGuard,
    ],
    exports: authServices,
})
export class AuthModule {}
