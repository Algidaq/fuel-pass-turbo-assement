import { AuthUserContextDto, LoginResDto, TLoginRequestDto } from '@fuel-pass/contracts/backend';
import {
    ApiResponse,
    AppHttpError,
    constructErrorMsg,
    constructLogMsg,
    type PinoAppLogger,
    type WithAppCtx,
} from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { envs } from '../../configs/config';
import { AuthException } from '../auth.errors';
import { UserStatus, type UserEntity } from '../entities';
import { CredentialRepository, UserRepository } from '../repositories';
import { CurrentUserService } from './current-user.service';
import { PasswordService } from './password.service';
import { AbstractSessionCreationService } from './session-creation-service/abstract-session-creation.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthLoginService {
    public readonly tokenExpiresIn = envs.auth.accessTokenTtlSeconds;
    public constructor(
        private sessionCreationService: AbstractSessionCreationService,
        private userRepo: UserRepository,
        private credentialRepo: CredentialRepository,
        private passwordService: PasswordService,
        private currentUserService: CurrentUserService,
        private tokenService: TokenService,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async login(params: WithAppCtx<{ body: TLoginRequestDto }>): Promise<ApiResponse<LoginResDto>> {
        const { headers, body } = params;

        try {
            const msg = constructLogMsg(AuthLoginService.name, 'login', headers);
            this.log.info(`${msg}::login::started`);

            const user = await this.findActiveUserOrThrow({ headers, email: body.email });

            this.log.info(`${msg}::login::user found`);

            await this.validatePasswordOrThrow({ headers, userId: user.id, password: body.password });

            this.log.info(`${msg}::login::user::password validated`);

            const currentUser = await this.currentUserService.buildCurrentUser(user.id);

            const refreshToken = this.tokenService.generateRefreshToken();
            const hashedRefreshToken = this.tokenService.hashRefreshToken(refreshToken);

            const session = await this.sessionCreationService.createSession({ headers, tokenHash: hashedRefreshToken, user });

            const accessToken = await this.generateAccessToken({ headers, currentUser, sessionId: session.id });

            this.log.info(`${msg}::login::access-token generated`);

            return ApiResponse.builder<LoginResDto>()
                .withSuccess({
                    status: HttpStatus.OK,
                    data: new LoginResDto({
                        accessToken,
                        refreshToken,
                        tokenType: 'Bearer',
                        user: currentUser,
                        expiresIn: this.tokenExpiresIn,
                    }),
                })
                .build();
        } catch (e: unknown) {
            this.log.error(constructErrorMsg(AuthLoginService.name, 'login', headers), { error: e });
            if (e instanceof AppHttpError) {
                return ApiResponse.fromAppError(e) as ApiResponse<LoginResDto>;
            }
            throw e;
        }
    }

    public async findActiveUserOrThrow(params: WithAppCtx<{ email: string }>): Promise<UserEntity> {
        const { headers, email } = params;
        const msg = constructLogMsg(AuthLoginService.name, 'findActiveUserOrThrow', headers);

        const user = await this.userRepo.findByEmail(email);

        if (user === null) {
            this.log.info(`${msg}::user with give email::not-found`);
            throw new AuthException(HttpStatus.BAD_REQUEST, 'InvalidCredentials');
        }

        if (user.status !== UserStatus.ACTIVE) {
            this.log.info(`${msg}::user status::is-inactive`);
            throw new AuthException(HttpStatus.BAD_REQUEST, 'InactiveUser');
        }

        return user;
    }

    public async validatePasswordOrThrow(params: WithAppCtx<{ userId: string; password: string }>): Promise<void> {
        const { userId, password } = params;

        const credential = await this.credentialRepo.findLocalCredentialByUserId(userId);

        if (credential?.passwordHash === null || credential?.passwordHash === undefined) {
            throw new AuthException(HttpStatus.BAD_REQUEST, 'InvalidCredentials');
        }

        const passwordMatches = await this.passwordService.verifyPassword(password, credential.passwordHash);

        if (!passwordMatches) {
            throw new AuthException(HttpStatus.BAD_REQUEST, 'InvalidCredentials');
        }
    }

    public generateAccessToken(params: WithAppCtx<{ currentUser: AuthUserContextDto; sessionId: string }>): Promise<string> {
        const { currentUser, sessionId } = params;
        return this.tokenService.generateAccessToken({
            sub: currentUser.id,
            sid: sessionId,
            jti: this.tokenService.generateTokenId(),
            email: currentUser.email,
            roles: currentUser.roles,
            permissions: currentUser.permissions,
        });
    }
}
