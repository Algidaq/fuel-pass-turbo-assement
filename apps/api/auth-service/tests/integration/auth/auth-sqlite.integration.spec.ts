import { createHash } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AuthService } from '../../../src/auth/services/auth.service';
import { AuditService } from '../../../src/auth/services/audit.service';
import { CurrentUserService } from '../../../src/auth/services/current-user.service';
import { RefreshTokenService } from '../../../src/auth/services/refresh-token.service';
import { SessionService } from '../../../src/auth/services/session.service';
import { AuthAuditRepository } from '../../../src/auth/repositories/auth-audit.repository';
import { CredentialRepository } from '../../../src/auth/repositories/credential.repository';
import { PermissionRepository } from '../../../src/auth/repositories/permission.repository';
import { RefreshTokenRepository } from '../../../src/auth/repositories/refresh-token.repository';
import { RoleRepository } from '../../../src/auth/repositories/role.repository';
import { SessionRepository } from '../../../src/auth/repositories/session.repository';
import { UserRepository } from '../../../src/auth/repositories/user.repository';
import { CredentialProvider, RefreshTokenStatus, SessionStatus, UserStatus } from '../../../src/auth/entities/auth.enums';
import { AuthAuditEventEntity } from '../../../src/auth/entities/auth-audit-event.entity';
import { PermissionEntity } from '../../../src/auth/entities/permission.entity';
import { RefreshTokenEntity } from '../../../src/auth/entities/refresh-token.entity';
import { RoleEntity } from '../../../src/auth/entities/role.entity';
import { RolePermissionEntity } from '../../../src/auth/entities/role-permission.entity';
import { UserCredentialEntity } from '../../../src/auth/entities/user-credential.entity';
import { UserEntity } from '../../../src/auth/entities/user.entity';
import { UserRoleEntity } from '../../../src/auth/entities/user-role.entity';
import { UserSessionEntity } from '../../../src/auth/entities/user-session.entity';
import { authDatabaseEntities } from '../../../src/configs/typeorm.config';
import type { RequestMetadata } from '../../../src/auth/types/auth-request.types';

const requestMetadata: RequestMetadata = {
    ipAddress: '127.0.0.1',
    userAgent: 'sqlite-integration-test',
    deviceName: 'jest',
};

class TestPasswordService {
    public verifyPassword(rawPassword: string, passwordHash: string): Promise<boolean> {
        return Promise.resolve(rawPassword === 'Password123!' && passwordHash === 'hashed-password');
    }
}

class TestTokenService {
    public readonly accessTokenTtlSeconds = 900;
    public readonly refreshTokenTtlDays = 7;
    private refreshTokenIndex = 0;

    public generateRefreshToken(): string {
        this.refreshTokenIndex += 1;
        return `raw-refresh-token-${this.refreshTokenIndex}`;
    }

    public hashRefreshToken(rawRefreshToken: string): string {
        return createHash('sha256').update(rawRefreshToken).digest('hex');
    }

    public generateTokenId(): string {
        return 'access-jti';
    }

    public generateAccessToken(): Promise<string> {
        return Promise.resolve('access-token');
    }
}

describe('auth persistence with SQLite', () => {
    let dataSource: DataSource;
    let authService: AuthService;
    let userRepository: UserRepository;
    let credentialRepository: CredentialRepository;
    let roleRepository: RoleRepository;
    let permissionRepository: PermissionRepository;
    let sessionRepository: SessionRepository;
    let refreshTokenRepository: RefreshTokenRepository;
    let tokenService: TestTokenService;
    let seededUser: UserEntity;

    beforeEach(async () => {
        dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            entities: authDatabaseEntities,
            synchronize: true,
            dropSchema: true,
        }).initialize();

        userRepository = new UserRepository(dataSource.getRepository(UserEntity));
        credentialRepository = new CredentialRepository(dataSource.getRepository(UserCredentialEntity));
        roleRepository = new RoleRepository(dataSource.getRepository(RoleEntity), dataSource.getRepository(UserRoleEntity));
        permissionRepository = new PermissionRepository(
            dataSource.getRepository(PermissionEntity),
            dataSource.getRepository(RolePermissionEntity)
        );
        sessionRepository = new SessionRepository(dataSource.getRepository(UserSessionEntity));
        refreshTokenRepository = new RefreshTokenRepository(dataSource.getRepository(RefreshTokenEntity));
        const authAuditRepository = new AuthAuditRepository(dataSource.getRepository(AuthAuditEventEntity));

        const sessionService = new SessionService(sessionRepository);
        tokenService = new TestTokenService();
        const refreshTokenService = new RefreshTokenService(dataSource, refreshTokenRepository, sessionService, tokenService as never);
        const currentUserService = new CurrentUserService(userRepository, roleRepository, permissionRepository, sessionService);
        const auditService = new AuditService(authAuditRepository);

        authService = new AuthService(
            userRepository,
            credentialRepository,
            new TestPasswordService() as never,
            tokenService as never,
            sessionService,
            refreshTokenService,
            currentUserService,
            auditService
        );

        seededUser = await userRepository.createUser({
            email: 'manager@fuelpass.test',
            fullName: 'Operations Manager',
            status: UserStatus.ACTIVE,
        });
        await credentialRepository.createLocalCredential(seededUser.id, 'hashed-password');

        const role = await dataSource.getRepository(RoleEntity).save({
            key: 'operations_manager',
            name: 'Operations Manager',
        });
        const permission = await dataSource.getRepository(PermissionEntity).save({
            key: 'fuel_order:read_all',
            resource: 'fuel_order',
            action: 'read_all',
        });

        await roleRepository.assignRoleToUser(seededUser.id, role.id);
        await permissionRepository.assignPermissionToRole(role.id, permission.id);
    });

    afterEach(async () => {
        if (dataSource?.isInitialized === true) {
            await dataSource.destroy();
        }
    });

    it('supports repository CRUD with seeded users, credentials, roles, and permissions', async () => {
        const user = await userRepository.findByEmail('manager@fuelpass.test');
        const credential = await credentialRepository.findLocalCredentialByUserId(seededUser.id);
        const roles = await roleRepository.findUserRoles(seededUser.id);
        const permissions = await permissionRepository.findPermissionsByUserId(seededUser.id);

        expect(user?.id).toEqual(seededUser.id);
        expect(credential?.provider).toEqual(CredentialProvider.LOCAL);
        expect(roles.map((role): string => role.key)).toEqual(['operations_manager']);
        expect(permissions.map((permission): string => permission.key)).toEqual(['fuel_order:read_all']);

        await userRepository.updateStatus(seededUser.id, UserStatus.LOCKED);

        await expect(userRepository.findById(seededUser.id)).resolves.toMatchObject({ status: UserStatus.LOCKED });
    });

    it('logs in, persists a hashed refresh token, updates last login, and returns roles and permissions', async () => {
        const result = await authService.login(' Manager@FuelPass.Test ', 'Password123!', requestMetadata);
        const sessions = await dataSource.getRepository(UserSessionEntity).findBy({ userId: seededUser.id });
        const refreshTokens = await dataSource.getRepository(RefreshTokenEntity).findBy({ userId: seededUser.id });
        const reloadedUser = await userRepository.findById(seededUser.id);

        expect(result).toMatchObject({
            accessToken: 'access-token',
            refreshToken: 'raw-refresh-token-1',
            expiresIn: 900,
            tokenType: 'Bearer',
            user: {
                id: seededUser.id,
                roles: ['operations_manager'],
                permissions: ['fuel_order:read_all'],
            },
        });
        expect(sessions).toHaveLength(1);
        expect(sessions[0]?.status).toEqual(SessionStatus.ACTIVE);
        expect(refreshTokens).toHaveLength(1);
        expect(refreshTokens[0]?.tokenHash).toEqual(tokenService.hashRefreshToken('raw-refresh-token-1'));
        expect(refreshTokens[0]?.tokenHash).not.toEqual('raw-refresh-token-1');
        expect(reloadedUser?.lastLoginAt).toBeInstanceOf(Date);
    });

    it('refreshes by rotating refresh tokens and marking the old token as rotated', async () => {
        await authService.login(seededUser.email, 'Password123!', requestMetadata);

        const result = await authService.refresh('raw-refresh-token-1', requestMetadata);
        const oldToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-1'));
        const newToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-2'));

        expect(result.refreshToken).toEqual('raw-refresh-token-2');
        expect(oldToken).toMatchObject({
            status: RefreshTokenStatus.ROTATED,
            rotatedToTokenId: newToken?.id,
        });
        expect(oldToken?.usedAt).toBeInstanceOf(Date);
        expect(newToken).toMatchObject({ status: RefreshTokenStatus.ACTIVE });
    });

    it('revokes the refresh-token family and session when a rotated token is reused', async () => {
        await authService.login(seededUser.email, 'Password123!', requestMetadata);
        await authService.refresh('raw-refresh-token-1', requestMetadata);

        await expect(authService.refresh('raw-refresh-token-1', requestMetadata)).rejects.toMatchObject({ key: 'InvalidToken' });

        const oldToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-1'));
        const rotatedToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-2'));
        const sessions = await dataSource.getRepository(UserSessionEntity).findBy({ userId: seededUser.id });

        expect(oldToken).toMatchObject({
            status: RefreshTokenStatus.REVOKED,
            revokedReason: 'refresh_token_reuse_detected',
        });
        expect(rotatedToken).toMatchObject({
            status: RefreshTokenStatus.REVOKED,
            revokedReason: 'refresh_token_reuse_detected',
        });
        expect(sessions[0]).toMatchObject({
            status: SessionStatus.REVOKED,
            revokedReason: 'refresh_token_reuse_detected',
        });
    });

    it('logs out by revoking the active session and refresh tokens', async () => {
        await authService.login(seededUser.email, 'Password123!', requestMetadata);
        const session = await dataSource.getRepository(UserSessionEntity).findOneByOrFail({ userId: seededUser.id });

        await expect(
            authService.logout(
                {
                    userId: seededUser.id,
                    sessionId: session.id,
                    email: seededUser.email,
                    roles: ['operations_manager'],
                    permissions: ['fuel_order:read_all'],
                    jti: 'access-jti',
                },
                'raw-refresh-token-1',
                requestMetadata
            )
        ).resolves.toEqual({ success: true });

        const refreshedSession = await dataSource.getRepository(UserSessionEntity).findOneByOrFail({ id: session.id });
        const refreshToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-1'));

        expect(refreshedSession).toMatchObject({
            status: SessionStatus.REVOKED,
            revokedReason: 'logout',
        });
        expect(refreshToken).toMatchObject({
            status: RefreshTokenStatus.REVOKED,
            revokedReason: 'logout',
        });
    });
});
