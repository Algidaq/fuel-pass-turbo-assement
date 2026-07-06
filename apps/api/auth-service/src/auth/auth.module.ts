import { Module } from '@nestjs/common';
import { AuthPersistenceModule } from './auth-persistence.module';
import { AuthController } from './controllers/auth.controller';
import { InternalAuthController } from './controllers/internal-auth.controller';
import { JwksController } from './controllers/jwks.controller';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditService } from './services/audit.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthService } from './services/auth.service';
import { CurrentUserService } from './services/current-user.service';
import { PasswordService } from './services/password.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { AbstractSessionCreationService } from './services/session-creation-service/abstract-session-creation.service';
import { SessionCreationService } from './services/session-creation-service/session-creation.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';

const authServices = [AuditService, AuthService, CurrentUserService, PasswordService, RefreshTokenService, SessionService, TokenService];

@Module({
    imports: [AuthPersistenceModule],
    controllers: [AuthController, JwksController, InternalAuthController],
    providers: [
        ...authServices,
        {
            provide: AbstractSessionCreationService,
            useClass: SessionCreationService,
        },
        AuthLoginService,
        JwtAuthGuard,
        InternalApiKeyGuard,
    ],
    exports: authServices,
})
export class AuthModule {}
