import { BaseApiHeaders } from '@fuel-pass/node-commons';
import { AuthFailure } from '../../../src/auth/auth.errors';
import { RefreshTokenStatus, UserStatus } from '../../../src/auth/entities/auth.enums';
import { AuthIntrospectionService } from '../../../src/auth/services/auth-introspection.service';
import { AuthLoginService } from '../../../src/auth/services/auth-login.service';
import { AuthLogoutService } from '../../../src/auth/services/auth-logout.service';
import { AuthRefreshService } from '../../../src/auth/services/auth-refresh.service';
import type { AuthenticatedPrincipal } from '../../../src/auth/types/auth-request.types';

const headers = new BaseApiHeaders({
    clientIp: '127.0.0.1',
    userAgent: 'jest',
});

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

describe('AuthLoginService', () => {
    function createHarness(): {
        service: AuthLoginService;
        sessionCreationService: { createSession: jest.Mock };
        userRepository: { findByEmail: jest.Mock };
        credentialRepository: { findLocalCredentialByUserId: jest.Mock };
        passwordService: { verifyPassword: jest.Mock };
        currentUserService: { buildCurrentUser: jest.Mock };
        tokenService: {
            generateRefreshToken: jest.Mock;
            hashRefreshToken: jest.Mock;
            generateTokenId: jest.Mock;
            generateAccessToken: jest.Mock;
        };
    } {
        const sessionCreationService = { createSession: jest.fn().mockResolvedValue({ id: 'session-1' }) };
        const userRepository = { findByEmail: jest.fn() };
        const credentialRepository = { findLocalCredentialByUserId: jest.fn() };
        const passwordService = { verifyPassword: jest.fn() };
        const currentUserService = { buildCurrentUser: jest.fn().mockResolvedValue(currentUser) };
        const tokenService = {
            generateRefreshToken: jest.fn().mockReturnValue('raw-refresh-token'),
            hashRefreshToken: jest.fn().mockReturnValue('hashed-refresh-token'),
            generateTokenId: jest.fn().mockReturnValue('access-jti'),
            generateAccessToken: jest.fn().mockResolvedValue('access-token'),
        };

        return {
            service: new AuthLoginService(
                sessionCreationService as never,
                userRepository as never,
                credentialRepository as never,
                passwordService as never,
                currentUserService as never,
                tokenService as never
            ),
            sessionCreationService,
            userRepository,
            credentialRepository,
            passwordService,
            currentUserService,
            tokenService,
        };
    }

    it('logs in with valid local credentials and stores only the refresh token hash', async () => {
        const harness = createHarness();
        harness.userRepository.findByEmail.mockResolvedValue(activeUser);
        harness.credentialRepository.findLocalCredentialByUserId.mockResolvedValue({ passwordHash: 'hash' });
        harness.passwordService.verifyPassword.mockResolvedValue(true);

        const result = await harness.service.login({ headers, body: { email: activeUser.email, password: 'Password123!' } });

        expect(result.data).toMatchObject({
            accessToken: 'access-token',
            refreshToken: 'raw-refresh-token',
            expiresIn: expect.any(Number),
            tokenType: 'Bearer',
            user: currentUser,
        });
        expect(harness.sessionCreationService.createSession).toHaveBeenCalledWith({
            headers,
            tokenHash: 'hashed-refresh-token',
            user: activeUser,
        });
    });

    it('returns generic invalid credentials for wrong passwords', async () => {
        const harness = createHarness();
        harness.userRepository.findByEmail.mockResolvedValue(activeUser);
        harness.credentialRepository.findLocalCredentialByUserId.mockResolvedValue({ passwordHash: 'hash' });
        harness.passwordService.verifyPassword.mockResolvedValue(false);

        const result = await harness.service.login({ headers, body: { email: activeUser.email, password: 'wrong-password' } });

        expect(result.success).toBe(false);
        expect(result.errors[0]?.code).toEqual('AUTH.INVALID-CREDENTIALS');
    });

    it('rejects disabled or locked users', async () => {
        const harness = createHarness();
        harness.userRepository.findByEmail.mockResolvedValue({ ...activeUser, status: UserStatus.LOCKED });

        const result = await harness.service.login({ headers, body: { email: activeUser.email, password: 'Password123!' } });

        expect(result.success).toBe(false);
        expect(result.errors[0]?.code).toEqual('AUTH.INACTIVE-USER');
    });
});

describe('AuthRefreshService', () => {
    function createHarness(): {
        service: AuthRefreshService;
        refreshTokenService: { rotateRefreshToken: jest.Mock };
        currentUserService: { buildCurrentUser: jest.Mock };
        tokenService: { accessTokenTtlSeconds: number; generateTokenId: jest.Mock; generateAccessToken: jest.Mock };
        sessionService: { updateLastSeen: jest.Mock };
        auditService: { write: jest.Mock };
    } {
        const refreshTokenService = {
            rotateRefreshToken: jest.fn().mockResolvedValue({
                rawToken: 'new-refresh-token',
                record: { userId: activeUser.id, sessionId: 'session-1' },
            }),
        };
        const currentUserService = { buildCurrentUser: jest.fn().mockResolvedValue(currentUser) };
        const tokenService = {
            accessTokenTtlSeconds: 900,
            generateTokenId: jest.fn().mockReturnValue('access-jti'),
            generateAccessToken: jest.fn().mockResolvedValue('access-token'),
        };
        const sessionService = { updateLastSeen: jest.fn().mockResolvedValue(undefined) };
        const auditService = { write: jest.fn().mockResolvedValue(undefined) };

        return {
            service: new AuthRefreshService(
                refreshTokenService as never,
                currentUserService as never,
                tokenService as never,
                sessionService as never,
                auditService as never
            ),
            refreshTokenService,
            currentUserService,
            tokenService,
            sessionService,
            auditService,
        };
    }

    it('rotates the refresh token and issues a new access token', async () => {
        const harness = createHarness();

        const result = await harness.service.refresh({ headers, body: { refreshToken: 'old-refresh-token' } });

        expect(result.data).toMatchObject({
            accessToken: 'access-token',
            refreshToken: 'new-refresh-token',
            expiresIn: 900,
            tokenType: 'Bearer',
        });
        expect(harness.refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
            'old-refresh-token',
            expect.objectContaining({ ipAddress: '127.0.0.1', userAgent: 'jest' })
        );
        expect(harness.sessionService.updateLastSeen).toHaveBeenCalledWith('session-1');
    });

    it('audits refresh token failures and returns an invalid-token response', async () => {
        const harness = createHarness();
        harness.refreshTokenService.rotateRefreshToken.mockRejectedValue(new AuthFailure('InvalidToken'));

        const result = await harness.service.refresh({ headers, body: { refreshToken: 'reused-refresh-token' } });

        expect(result.success).toBe(false);
        expect(result.errors[0]?.code).toEqual('AUTH.INVALID-TOKEN');
        expect(harness.auditService.write).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'REFRESH_TOKEN_REUSED' }));
    });
});

describe('AuthLogoutService', () => {
    it('revokes the current session and refresh tokens', async () => {
        const sessionService = { revokeSession: jest.fn().mockResolvedValue(undefined) };
        const refreshTokenService = {
            revokeRefreshTokensBySession: jest.fn().mockResolvedValue(undefined),
            revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
        };
        const auditService = { write: jest.fn().mockResolvedValue(undefined) };
        const service = new AuthLogoutService(sessionService as never, refreshTokenService as never, auditService as never);
        const principal: AuthenticatedPrincipal = {
            userId: activeUser.id,
            sessionId: 'session-1',
            email: activeUser.email,
            roles: [],
            permissions: [],
            jti: 'jti',
        };

        const result = await service.logout({ headers, body: { refreshToken: 'refresh-token' }, principal });

        expect(result.data).toEqual({ success: true });
        expect(sessionService.revokeSession).toHaveBeenCalledWith('session-1', 'logout');
        expect(refreshTokenService.revokeRefreshTokensBySession).toHaveBeenCalledWith('session-1', 'logout');
        expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith('refresh-token', 'logout');
    });
});

describe('AuthIntrospectionService', () => {
    it('returns inactive introspection for invalid tokens', async () => {
        const tokenService = { verifyAccessToken: jest.fn().mockRejectedValue(new Error('invalid')) };
        const currentUserService = { buildIntrospection: jest.fn() };
        const service = new AuthIntrospectionService(tokenService as never, currentUserService as never);

        await expect(service.introspect({ headers, body: { token: 'bad-token' } })).resolves.toMatchObject({
            data: { active: false },
        });
    });
});

describe('RefreshTokenStatus coverage', () => {
    it('keeps reuse status available for refresh-token service tests', () => {
        expect(RefreshTokenStatus.REUSED).toEqual('REUSED');
    });
});
