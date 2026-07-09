import { CreateInternalUserResDto, TCreateInternalUserRequestDto } from '@fuel-pass/contracts/backend';
import {
    ApiResponse,
    AppHttpError,
    constructErrorMsg,
    constructLogMsg,
    type PinoAppLogger,
    type WithAppCtx,
} from '@fuel-pass/node-commons';
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
        private readonly dataSource: DataSource,
        private log: PinoAppLogger
    ) {
        this.log = this.log.child(__filename);
    }

    public async createUser(params: WithAppCtx<{ body: TCreateInternalUserRequestDto }>): Promise<ApiResponse<CreateInternalUserResDto>> {
        const msg = constructLogMsg(InternalUserCreationService.name, 'createUser', params.headers);

        try {
            this.log.info(`${msg}::create-user::started`);
            const createdUser = await this.createUserOrThrow(params.body, msg);
            this.log.info(`${msg}::create-user::user created`);

            const user = await this.currentUserService.buildCurrentUser(createdUser.id);
            this.log.info(`${msg}::create-user::current-user built`);

            return ApiResponse.builder<CreateInternalUserResDto>()
                .withSuccess({ status: HttpStatus.CREATED, data: new CreateInternalUserResDto({ user }) })
                .build();
        } catch (e: unknown) {
            if (e instanceof AuthFailure) {
                const status = e.key === 'UserAlreadyExists' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
                this.log.info(`${msg}::create-user::auth-failure::${e.key}`);
                return ApiResponse.fromAppError(new AuthException(status, e.key)) as ApiResponse<CreateInternalUserResDto>;
            }

            if (e instanceof AppHttpError) {
                this.log.error(constructErrorMsg(InternalUserCreationService.name, 'createUser', params.headers), { error: e });
                return ApiResponse.fromAppError(e) as ApiResponse<CreateInternalUserResDto>;
            }

            this.log.error(constructErrorMsg(InternalUserCreationService.name, 'createUser', params.headers), { error: e });
            throw e;
        }
    }

    private async createUserOrThrow(request: TCreateInternalUserRequestDto, msg: string): Promise<UserEntity> {
        const email = request.email.trim().toLowerCase();
        const fullName = request.fullName.trim();
        const roleKeys = [...new Set(request.roleKeys.map((roleKey): string => roleKey.trim()).filter(Boolean))];
        const status = request.status === undefined ? UserStatus.ACTIVE : (request.status as UserStatus);

        if (roleKeys.length === 0 || !Object.values(UserStatus).includes(status)) {
            this.log.info(`${msg}::create-user::request invalid`);
            throw new AuthFailure('InvalidRequest');
        }

        const existingUser = await this.userRepository.findByEmail(email);

        if (existingUser !== null) {
            this.log.info(`${msg}::create-user::email already exists`);
            throw new AuthFailure('UserAlreadyExists');
        }

        const passwordHash = await this.passwordService.hashPassword(request.password);
        this.log.info(`${msg}::create-user::password hashed`);

        return this.dataSource.transaction(async (manager): Promise<UserEntity> => {
            this.log.info(`${msg}::create-user::transaction started`);
            const roles = await manager.find(RoleEntity, {
                where: {
                    key: In(roleKeys),
                },
            });

            if (roles.length !== roleKeys.length) {
                this.log.info(`${msg}::create-user::role validation failed`);
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

            this.log.info(`${msg}::create-user::transaction completed`);
            return user;
        });
    }
}
