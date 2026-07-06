import type {
    CreateInternalUserRequestDto,
    CreateInternalUserResponseDto,
    CurrentUserResponseDto,
    IntrospectResponseDto,
    LoginResponseDto,
    LogoutResponseDto,
    RefreshResponseDto,
} from '@fuel-pass/contracts';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, In } from 'typeorm';
import { AuthFailure } from '../auth.errors';
import { CredentialProvider, UserStatus } from '../entities/auth.enums';
import { RoleEntity } from '../entities/role.entity';
import { UserCredentialEntity } from '../entities/user-credential.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { UserEntity } from '../entities/user.entity';
import { CredentialRepository } from '../repositories/credential.repository';
import { UserRepository } from '../repositories/user.repository';
import type { AuthenticatedPrincipal, RequestMetadata } from '../types/auth-request.types';
import { AuditService, AuthAuditEventType } from './audit.service';
import { CurrentUserService } from './current-user.service';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
    public constructor(
        private readonly userRepository: UserRepository,
        private readonly credentialRepository: CredentialRepository,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
        private readonly sessionService: SessionService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly currentUserService: CurrentUserService,
        private readonly auditService: AuditService,
        private readonly dataSource: DataSource
    ) {}

    public async login(email: string, password: string, requestMetadata: RequestMetadata): Promise<LoginResponseDto> {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await this.userRepository.findByEmail(normalizedEmail);

        if (user === null) {
            await this.auditService.write({
                eventType: AuthAuditEventType.LOGIN_FAILED_INVALID_PASSWORD,
                success: false,
                failureReason: 'invalid_credentials',
                requestMetadata,
            });
            throw new AuthFailure('InvalidCredentials');
        }

        if (user.status !== UserStatus.ACTIVE) {
            await this.auditService.write({
                userId: user.id,
                eventType: AuthAuditEventType.LOGIN_FAILED_USER_LOCKED,
                success: false,
                failureReason: user.status,
                requestMetadata,
            });
            throw new AuthFailure('InactiveUser');
        }

        const credential = await this.credentialRepository.findLocalCredentialByUserId(user.id);

        if (credential?.passwordHash === null || credential?.passwordHash === undefined) {
            await this.writeInvalidPasswordAudit(user.id, requestMetadata);
            throw new AuthFailure('InvalidCredentials');
        }

        const passwordMatches = await this.passwordService.verifyPassword(password, credential.passwordHash);

        if (!passwordMatches) {
            await this.writeInvalidPasswordAudit(user.id, requestMetadata);
            throw new AuthFailure('InvalidCredentials');
        }

        const sessionExpiresAt = new Date(Date.now() + this.tokenService.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
        const session = await this.sessionService.createSession(user.id, requestMetadata, sessionExpiresAt);
        const currentUser = await this.currentUserService.buildCurrentUser(user.id);
        const accessToken = await this.tokenService.generateAccessToken({
            sub: user.id,
            sid: session.id,
            jti: this.tokenService.generateTokenId(),
            email: user.email,
            roles: currentUser.roles,
            permissions: currentUser.permissions,
        });
        const refreshToken = await this.refreshTokenService.issueRefreshToken(user.id, session.id, randomUUID(), requestMetadata);

        await this.userRepository.updateLastLogin(user.id, new Date());
        await this.auditService.write({
            userId: user.id,
            sessionId: session.id,
            eventType: AuthAuditEventType.LOGIN_SUCCESS,
            success: true,
            requestMetadata,
        });

        return {
            accessToken,
            refreshToken: refreshToken.rawToken,
            expiresIn: this.tokenService.accessTokenTtlSeconds,
            tokenType: 'Bearer',
            user: currentUser,
        };
    }

    public async refresh(rawRefreshToken: string, requestMetadata: RequestMetadata): Promise<RefreshResponseDto> {
        let rotatedToken;

        try {
            rotatedToken = await this.refreshTokenService.rotateRefreshToken(rawRefreshToken, requestMetadata);
        } catch (error: unknown) {
            if (error instanceof AuthFailure) {
                await this.auditService.write({
                    eventType: AuthAuditEventType.REFRESH_TOKEN_REUSED,
                    success: false,
                    failureReason: error.key,
                    requestMetadata,
                });
            }

            throw error;
        }

        const currentUser = await this.currentUserService.buildCurrentUser(rotatedToken.record.userId, rotatedToken.record.sessionId);
        const accessToken = await this.tokenService.generateAccessToken({
            sub: currentUser.id,
            sid: rotatedToken.record.sessionId,
            jti: this.tokenService.generateTokenId(),
            email: currentUser.email,
            roles: currentUser.roles,
            permissions: currentUser.permissions,
        });

        await this.sessionService.updateLastSeen(rotatedToken.record.sessionId);
        await this.auditService.write({
            userId: currentUser.id,
            sessionId: rotatedToken.record.sessionId,
            eventType: AuthAuditEventType.TOKEN_REFRESHED,
            success: true,
            requestMetadata,
        });

        return {
            accessToken,
            refreshToken: rotatedToken.rawToken,
            expiresIn: this.tokenService.accessTokenTtlSeconds,
            tokenType: 'Bearer',
        };
    }

    public async logout(
        principal: AuthenticatedPrincipal,
        refreshToken: string | undefined,
        requestMetadata: RequestMetadata
    ): Promise<LogoutResponseDto> {
        await this.sessionService.revokeSession(principal.sessionId, 'logout');
        await this.refreshTokenService.revokeRefreshTokensBySession(principal.sessionId, 'logout');

        if (refreshToken !== undefined && refreshToken.trim().length > 0) {
            await this.refreshTokenService.revokeRefreshToken(refreshToken, 'logout');
        }

        await this.auditService.write({
            userId: principal.userId,
            sessionId: principal.sessionId,
            eventType: AuthAuditEventType.LOGOUT,
            success: true,
            requestMetadata,
        });

        return { success: true };
    }

    public getCurrentUser(principal: AuthenticatedPrincipal): Promise<CurrentUserResponseDto> {
        return this.currentUserService.getCurrentUser(principal.userId, principal.sessionId);
    }

    public async introspect(token: string): Promise<IntrospectResponseDto> {
        try {
            const claims = await this.tokenService.verifyAccessToken(token);

            return await this.currentUserService.buildIntrospection(claims.sub, claims.sid);
        } catch {
            return { active: false };
        }
    }

    public async createInternalUser(request: CreateInternalUserRequestDto): Promise<CreateInternalUserResponseDto> {
        const email = request.email.trim().toLowerCase();
        const fullName = request.fullName.trim();
        const roleKeys = [...new Set(request.roleKeys.map((roleKey): string => roleKey.trim()).filter(Boolean))];
        const status = request.status === undefined ? UserStatus.ACTIVE : (request.status as UserStatus);

        if (
            email.length === 0 ||
            fullName.length === 0 ||
            request.password.length === 0 ||
            roleKeys.length === 0 ||
            !Object.values(UserStatus).includes(status)
        ) {
            throw new AuthFailure('InvalidRequest');
        }

        const existingUser = await this.userRepository.findByEmail(email);

        if (existingUser !== null) {
            throw new AuthFailure('UserAlreadyExists');
        }

        const passwordHash = await this.passwordService.hashPassword(request.password);
        const createdUser = await this.dataSource.transaction(async (manager): Promise<UserEntity> => {
            const roles = await manager.find(RoleEntity, {
                where: {
                    key: In(roleKeys),
                },
            });

            if (roles.length !== roleKeys.length) {
                throw new AuthFailure('InvalidRequest');
            }

            const user = await manager.save(
                manager.create(UserEntity, {
                    email,
                    fullName,
                    status,
                    emailVerifiedAt: new Date(),
                })
            );

            await manager.save(
                manager.create(UserCredentialEntity, {
                    userId: user.id,
                    provider: CredentialProvider.LOCAL,
                    passwordHash,
                    passwordChangedAt: new Date(),
                })
            );

            await manager.save(
                roles.map((role): UserRoleEntity =>
                    manager.create(UserRoleEntity, {
                        userId: user.id,
                        roleId: role.id,
                    })
                )
            );

            return user;
        });

        return { user: await this.currentUserService.buildCurrentUser(createdUser.id) };
    }

    private writeInvalidPasswordAudit(userId: string, requestMetadata: RequestMetadata): Promise<void> {
        return this.auditService.write({
            userId,
            eventType: AuthAuditEventType.LOGIN_FAILED_INVALID_PASSWORD,
            success: false,
            failureReason: 'invalid_credentials',
            requestMetadata,
        });
    }
}
