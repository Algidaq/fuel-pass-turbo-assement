import { createHash } from 'node:crypto';
import { ACCESS_PERMISSIONS, ACCESS_ROLES } from '@fuel-pass/contracts/backend';
import { BaseApiHeaders } from '@fuel-pass/node-commons';
import { DataSource } from 'typeorm';
import { AuditService } from '../../../src/auth/services/audit.service';
import { AuthLoginService } from '../../../src/auth/services/auth-login.service';
import { AuthLogoutService } from '../../../src/auth/services/auth-logout.service';
import { AuthRefreshService } from '../../../src/auth/services/auth-refresh.service';
import { CurrentUserService } from '../../../src/auth/services/current-user.service';
import { RefreshTokenService } from '../../../src/auth/services/refresh-token.service';
import { SessionCreationService } from '../../../src/auth/services/session-creation-service/session-creation.service';
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

const headers = new BaseApiHeaders({
    clientIp: '127.0.0.1',
    userAgent: 'sqlite-integration-test',
});

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
    let loginService: AuthLoginService;
    let refreshService: AuthRefreshService;
    let logoutService: AuthLogoutService;
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
        const sessionCreationService = new SessionCreationService(dataSource);

        loginService = new AuthLoginService(
            sessionCreationService,
            userRepository,
            credentialRepository,
            new TestPasswordService() as never,
            currentUserService,
            tokenService as never
        );
        refreshService = new AuthRefreshService(
            refreshTokenService,
            currentUserService,
            tokenService as never,
            sessionService,
            auditService
        );
        logoutService = new AuthLogoutService(sessionService, refreshTokenService, auditService);

        seededUser = await userRepository.createUser({
            email: 'manager@fuelpass.test',
            fullName: 'Operations Manager',
            status: UserStatus.ACTIVE,
        });
        await credentialRepository.createLocalCredential(seededUser.id, 'hashed-password');

        const role = await dataSource.getRepository(RoleEntity).save({
            key: ACCESS_ROLES.operationsManager.key,
            name: ACCESS_ROLES.operationsManager.name,
        });
        const permission = await dataSource.getRepository(PermissionEntity).save({
            key: ACCESS_PERMISSIONS.fuelOrderReadAll.key,
            resource: ACCESS_PERMISSIONS.fuelOrderReadAll.resource,
            action: ACCESS_PERMISSIONS.fuelOrderReadAll.action,
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
        expect(roles.map((role): string => role.key)).toEqual([ACCESS_ROLES.operationsManager.key]);
        expect(permissions.map((permission): string => permission.key)).toEqual([ACCESS_PERMISSIONS.fuelOrderReadAll.key]);

        await userRepository.updateStatus(seededUser.id, UserStatus.LOCKED);

        await expect(userRepository.findById(seededUser.id)).resolves.toMatchObject({ status: UserStatus.LOCKED });
    });

    it('logs in, persists a hashed refresh token, updates last login, and returns roles and permissions', async () => {
        const result = await loginService.login({ headers, body: { email: 'manager@fuelpass.test', password: 'Password123!' } });
        const sessions = await dataSource.getRepository(UserSessionEntity).findBy({ userId: seededUser.id });
        const refreshTokens = await dataSource.getRepository(RefreshTokenEntity).findBy({ userId: seededUser.id });
        const reloadedUser = await userRepository.findById(seededUser.id);

        expect(result.data).toMatchObject({
            accessToken: 'access-token',
            refreshToken: 'raw-refresh-token-1',
            expiresIn: 900,
            tokenType: 'Bearer',
            user: {
                id: seededUser.id,
                roles: [ACCESS_ROLES.operationsManager.key],
                permissions: [ACCESS_PERMISSIONS.fuelOrderReadAll.key],
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
        await loginService.login({ headers, body: { email: seededUser.email, password: 'Password123!' } });

        const result = await refreshService.refresh({ headers, body: { refreshToken: 'raw-refresh-token-1' } });
        const oldToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-1'));
        const newToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-2'));

        expect(result.data?.refreshToken).toEqual('raw-refresh-token-2');
        expect(oldToken).toMatchObject({
            status: RefreshTokenStatus.ROTATED,
            rotatedToTokenId: newToken?.id,
        });
        expect(oldToken?.usedAt).toBeInstanceOf(Date);
        expect(newToken).toMatchObject({ status: RefreshTokenStatus.ACTIVE });
    });

    it('revokes the refresh-token family and session when a rotated token is reused', async () => {
        await loginService.login({ headers, body: { email: seededUser.email, password: 'Password123!' } });
        await refreshService.refresh({ headers, body: { refreshToken: 'raw-refresh-token-1' } });

        const reusedResult = await refreshService.refresh({ headers, body: { refreshToken: 'raw-refresh-token-1' } });

        const oldToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-1'));
        const rotatedToken = await refreshTokenRepository.findByTokenHash(tokenService.hashRefreshToken('raw-refresh-token-2'));
        const sessions = await dataSource.getRepository(UserSessionEntity).findBy({ userId: seededUser.id });

        expect(reusedResult.success).toBe(false);
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
        await loginService.login({ headers, body: { email: seededUser.email, password: 'Password123!' } });
        const session = await dataSource.getRepository(UserSessionEntity).findOneByOrFail({ userId: seededUser.id });

        await expect(
            logoutService.logout({
                headers,
                body: { refreshToken: 'raw-refresh-token-1' },
                principal: {
                    userId: seededUser.id,
                    sessionId: session.id,
                    email: seededUser.email,
                    roles: [ACCESS_ROLES.operationsManager.key],
                    permissions: [ACCESS_PERMISSIONS.fuelOrderReadAll.key],
                    jti: 'access-jti',
                },
            })
        ).resolves.toMatchObject({ success: true });

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
