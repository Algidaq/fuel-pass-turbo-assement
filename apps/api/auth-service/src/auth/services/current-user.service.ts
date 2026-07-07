import {
    CurrentUserResDto,
    type AuthUserContextDto,
    type CurrentUserResponseDto,
    type IntrospectActiveResponseDto,
} from '@fuel-pass/contracts/backend';
import { Injectable } from '@nestjs/common';
import { AuthFailure } from '../auth.errors';
import { UserStatus } from '../entities/auth.enums';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';

@Injectable()
export class CurrentUserService {
    public constructor(
        private readonly userRepository: UserRepository,
        private readonly roleRepository: RoleRepository,
        private readonly permissionRepository: PermissionRepository,
        private readonly sessionService: SessionService
    ) {}

    public async buildCurrentUser(userId: string, sessionId?: string): Promise<AuthUserContextDto> {
        const user = await this.userRepository.findById(userId);

        if (user === null) {
            throw new AuthFailure('InvalidToken');
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new AuthFailure('InactiveUser');
        }

        if (sessionId !== undefined) {
            const session = await this.sessionService.validateActiveSession(sessionId);

            if (session === null || session.userId !== userId) {
                throw new AuthFailure('InvalidToken');
            }
        }

        const [roles, permissions] = await Promise.all([
            this.roleRepository.findUserRoles(userId),
            this.permissionRepository.findPermissionsByUserId(userId),
        ]);

        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            roles: roles.map((role): string => role.key),
            permissions: permissions.map((permission): string => permission.key),
        };
    }

    public async getCurrentUser(userId: string, sessionId: string): Promise<CurrentUserResponseDto> {
        return new CurrentUserResDto({ user: await this.buildCurrentUser(userId, sessionId) });
    }

    public async buildIntrospection(userId: string, sessionId: string): Promise<IntrospectActiveResponseDto> {
        const user = await this.buildCurrentUser(userId, sessionId);

        return {
            active: true,
            sub: user.id,
            sessionId,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions,
            user,
        };
    }
}
