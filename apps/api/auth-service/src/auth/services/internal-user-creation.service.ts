import { CreateInternalUserResDto, TCreateInternalUserRequestDto } from '@fuel-pass/contracts/backend';
import { ApiResponse, AppHttpError, type WithAppCtx } from '@fuel-pass/node-commons';
import { HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { AuthException, AuthFailure } from '../auth.errors';
import { CredentialProvider, UserStatus } from '../entities/auth.enums';
import { RoleEntity } from '../entities/role.entity';
import { UserCredentialEntity } from '../entities/user-credential.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { CurrentUserService } from './current-user.service';
import { PasswordService } from './password.service';

@Injectable()
export class InternalUserCreationService {
    public constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordService: PasswordService,
        private readonly currentUserService: CurrentUserService,
        private readonly dataSource: DataSource
    ) {}

    public async createUser(params: WithAppCtx<{ body: TCreateInternalUserRequestDto }>): Promise<ApiResponse<CreateInternalUserResDto>> {
        try {
            const createdUser = await this.createUserOrThrow(params.body);
            const user = await this.currentUserService.buildCurrentUser(createdUser.id);

            return ApiResponse.builder<CreateInternalUserResDto>()
                .withSuccess({ status: HttpStatus.CREATED, data: new CreateInternalUserResDto({ user }) })
                .build();
        } catch (e: unknown) {
            if (e instanceof AuthFailure) {
                const status = e.key === 'UserAlreadyExists' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
                return ApiResponse.fromAppError(new AuthException(status, e.key)) as ApiResponse<CreateInternalUserResDto>;
            }

            if (e instanceof AppHttpError) {
                return ApiResponse.fromAppError(e) as ApiResponse<CreateInternalUserResDto>;
            }

            throw e;
        }
    }

    private async createUserOrThrow(request: TCreateInternalUserRequestDto): Promise<UserEntity> {
        const email = request.email.trim().toLowerCase();
        const fullName = request.fullName.trim();
        const roleKeys = [...new Set(request.roleKeys.map((roleKey): string => roleKey.trim()).filter(Boolean))];
        const status = request.status === undefined ? UserStatus.ACTIVE : (request.status as UserStatus);

        if (roleKeys.length === 0 || !Object.values(UserStatus).includes(status)) {
            throw new AuthFailure('InvalidRequest');
        }

        const existingUser = await this.userRepository.findByEmail(email);

        if (existingUser !== null) {
            throw new AuthFailure('UserAlreadyExists');
        }

        const passwordHash = await this.passwordService.hashPassword(request.password);

        return this.dataSource.transaction(async (manager): Promise<UserEntity> => {
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
    }
}
