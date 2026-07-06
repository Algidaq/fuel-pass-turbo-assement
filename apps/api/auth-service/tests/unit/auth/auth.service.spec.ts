jest.mock('../../../src/auth/repositories/credential.repository', () => ({ CredentialRepository: class CredentialRepository {} }));
jest.mock('../../../src/auth/repositories/user.repository', () => ({ UserRepository: class UserRepository {} }));
jest.mock('../../../src/auth/services/audit.service', () => ({
    AuditService: class AuditService {},
    AuthAuditEventType: {
        LOGIN_SUCCESS: 'LOGIN_SUCCESS',
        LOGIN_FAILED_INVALID_PASSWORD: 'LOGIN_FAILED_INVALID_PASSWORD',
        LOGIN_FAILED_USER_LOCKED: 'LOGIN_FAILED_USER_LOCKED',
        TOKEN_REFRESHED: 'TOKEN_REFRESHED',
        REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',
        LOGOUT: 'LOGOUT',
    },
}));
jest.mock('../../../src/auth/services/current-user.service', () => ({ CurrentUserService: class CurrentUserService {} }));
jest.mock('../../../src/auth/services/password.service', () => ({ PasswordService: class PasswordService {} }));
jest.mock('../../../src/auth/services/refresh-token.service', () => ({ RefreshTokenService: class RefreshTokenService {} }));
jest.mock('../../../src/auth/services/session.service', () => ({ SessionService: class SessionService {} }));
jest.mock('../../../src/auth/services/token.service', () => ({ TokenService: class TokenService {} }));

import { AuthFailure } from '../../../src/auth/auth.errors';
import { RefreshTokenStatus, UserStatus } from '../../../src/auth/entities/auth.enums';
import { AuthService } from '../../../src/auth/services/auth.service';
import type { AuthenticatedPrincipal, RequestMetadata } from '../../../src/auth/types/auth-request.types';

const requestMetadata: RequestMetadata = {
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    deviceName: null,
};

const activeUser = {
    id: 'user-1',
    email: 'manager@fuelpass.test',
    fullName: 'Operations Manager',
    status: UserStatus.ACTIVE,
};

const currentUser = {
    id: activeUser.id,
    email: activeUser.email,
    fullName: activeUser.fullName,
    roles: ['operations_manager'],
    permissions: ['fuel_order:read_all'],
};

describe('AuthService', () => {
    function createHarness(): {
        service: AuthService;
        userRepository: {
            findByEmail: jest.Mock;
            updateLastLogin: jest.Mock;
        };
        credentialRepository: {
            findLocalCredentialByUserId: jest.Mock;
        };
        passwordService: {
            verifyPassword: jest.Mock;
        };
        tokenService: {
            refreshTokenTtlDays: number;
            accessTokenTtlSeconds: number;
            generateTokenId: jest.Mock;
            generateAccessToken: jest.Mock;
        };
        sessionService: {
            createSession: jest.Mock;
            revokeSession: jest.Mock;
            updateLastSeen: jest.Mock;
        };
        refreshTokenService: {
            issueRefreshToken: jest.Mock;
            rotateRefreshToken: jest.Mock;
            revokeRefreshTokensBySession: jest.Mock;
            revokeRefreshToken: jest.Mock;
        };
        currentUserService: {
            buildCurrentUser: jest.Mock;
            getCurrentUser: jest.Mock;
            buildIntrospection: jest.Mock;
        };
        auditService: {
            write: jest.Mock;
        };
    } {
        const userRepository = {
            findByEmail: jest.fn(),
            updateLastLogin: jest.fn().mockResolvedValue(undefined),
        };
        const credentialRepository = {
            findLocalCredentialByUserId: jest.fn(),
        };
        const passwordService = {
            verifyPassword: jest.fn(),
        };
        const tokenService = {
            refreshTokenTtlDays: 7,
            accessTokenTtlSeconds: 900,
            generateTokenId: jest.fn().mockReturnValue('access-jti'),
            generateAccessToken: jest.fn().mockResolvedValue('access-token'),
        };
        const sessionService = {
            createSession: jest.fn().mockResolvedValue({ id: 'session-1' }),
            revokeSession: jest.fn().mockResolvedValue(undefined),
            updateLastSeen: jest.fn().mockResolvedValue(undefined),
        };
        const refreshTokenService = {
            issueRefreshToken: jest.fn().mockResolvedValue({ rawToken: 'refresh-token', record: { id: 'refresh-1' } }),
            rotateRefreshToken: jest.fn(),
            revokeRefreshTokensBySession: jest.fn().mockResolvedValue(undefined),
            revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
        };
        const currentUserService = {
            buildCurrentUser: jest.fn().mockResolvedValue(currentUser),
            getCurrentUser: jest.fn().mockResolvedValue({ user: currentUser }),
            buildIntrospection: jest
                .fn()
                .mockResolvedValue({ active: true, sub: currentUser.id, sessionId: 'session-1', user: currentUser }),
        };
        const auditService = {
            write: jest.fn().mockResolvedValue(undefined),
        };

        const service = new AuthService(
            userRepository as never,
            credentialRepository as never,
            passwordService as never,
            tokenService as never,
            sessionService as never,
            refreshTokenService as never,
            currentUserService as never,
            auditService as never
        );

        return {
            service,
            userRepository,
            credentialRepository,
            passwordService,
            tokenService,
            sessionService,
            refreshTokenService,
            currentUserService,
            auditService,
        };
    }

    it('logs in with valid local credentials', async () => {
        const harness = createHarness();
        harness.userRepository.findByEmail.mockResolvedValue(activeUser);
        harness.credentialRepository.findLocalCredentialByUserId.mockResolvedValue({ passwordHash: 'hash' });
        harness.passwordService.verifyPassword.mockResolvedValue(true);

        await expect(harness.service.login(' Manager@FuelPass.Test ', 'Password123!', requestMetadata)).resolves.toEqual({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresIn: 900,
            tokenType: 'Bearer',
            user: currentUser,
        });

        expect(harness.userRepository.findByEmail).toHaveBeenCalledWith('manager@fuelpass.test');
        expect(harness.sessionService.createSession).toHaveBeenCalledWith(activeUser.id, requestMetadata, expect.any(Date));
        expect(harness.refreshTokenService.issueRefreshToken).toHaveBeenCalledWith(
            activeUser.id,
            'session-1',
            expect.any(String),
            requestMetadata
        );
        expect(harness.userRepository.updateLastLogin).toHaveBeenCalledWith(activeUser.id, expect.any(Date));
    });

    it('rejects invalid credentials with the generic auth failure', async () => {
        const harness = createHarness();
        harness.userRepository.findByEmail.mockResolvedValue(activeUser);
        harness.credentialRepository.findLocalCredentialByUserId.mockResolvedValue({ passwordHash: 'hash' });
        harness.passwordService.verifyPassword.mockResolvedValue(false);

        await expect(harness.service.login(activeUser.email, 'wrong', requestMetadata)).rejects.toMatchObject({
            key: 'InvalidCredentials',
        });
        expect(harness.auditService.write).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'LOGIN_FAILED_INVALID_PASSWORD' }));
    });

    it('rejects disabled or locked users', async () => {
        const harness = createHarness();
        harness.userRepository.findByEmail.mockResolvedValue({ ...activeUser, status: UserStatus.LOCKED });

        await expect(harness.service.login(activeUser.email, 'Password123!', requestMetadata)).rejects.toMatchObject({
            key: 'InactiveUser',
        });
        expect(harness.auditService.write).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'LOGIN_FAILED_USER_LOCKED' }));
    });

    it('refreshes by rotating the refresh token and issuing a new access token', async () => {
        const harness = createHarness();
        harness.refreshTokenService.rotateRefreshToken.mockResolvedValue({
            rawToken: 'new-refresh-token',
            record: {
                userId: activeUser.id,
                sessionId: 'session-1',
            },
        });

        await expect(harness.service.refresh('old-refresh-token', requestMetadata)).resolves.toEqual({
            accessToken: 'access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 900,
            tokenType: 'Bearer',
        });
        expect(harness.refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith('old-refresh-token', requestMetadata);
    });

    it('audits refresh token reuse failures', async () => {
        const harness = createHarness();
        harness.refreshTokenService.rotateRefreshToken.mockRejectedValue(new AuthFailure('InvalidToken'));

        await expect(harness.service.refresh('reused-refresh-token', requestMetadata)).rejects.toMatchObject({
            key: 'InvalidToken',
        });
        expect(harness.auditService.write).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'REFRESH_TOKEN_REUSED' }));
    });

    it('revokes the current session and refresh tokens on logout', async () => {
        const harness = createHarness();
        const principal: AuthenticatedPrincipal = {
            userId: activeUser.id,
            sessionId: 'session-1',
            email: activeUser.email,
            roles: [],
            permissions: [],
            jti: 'jti',
        };

        await expect(harness.service.logout(principal, 'refresh-token', requestMetadata)).resolves.toEqual({ success: true });
        expect(harness.sessionService.revokeSession).toHaveBeenCalledWith('session-1', 'logout');
        expect(harness.refreshTokenService.revokeRefreshTokensBySession).toHaveBeenCalledWith('session-1', 'logout');
        expect(harness.refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token', 'logout');
    });

    it('returns inactive introspection for invalid tokens', async () => {
        const harness = createHarness();
        harness.tokenService.generateAccessToken.mockRejectedValue(new Error('invalid'));
        const tokenVerifier = { verifyAccessToken: jest.fn().mockRejectedValue(new Error('invalid')) };
        const service = new AuthService(
            harness.userRepository as never,
            harness.credentialRepository as never,
            harness.passwordService as never,
            tokenVerifier as never,
            harness.sessionService as never,
            harness.refreshTokenService as never,
            harness.currentUserService as never,
            harness.auditService as never
        );

        await expect(service.introspect('bad-token')).resolves.toEqual({ active: false });
    });
});

describe('RefreshTokenStatus coverage', () => {
    it('keeps reuse status available for refresh-token service tests', () => {
        expect(RefreshTokenStatus.REUSED).toEqual('REUSED');
    });
});
