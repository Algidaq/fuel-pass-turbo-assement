import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authDatabaseEntities } from '../database/typeorm.config';
import {
    AuthAuditRepository,
    CredentialRepository,
    PermissionRepository,
    RefreshTokenRepository,
    RoleRepository,
    SessionRepository,
    UserRepository,
} from './repositories';

const authRepositories = [
    UserRepository,
    CredentialRepository,
    SessionRepository,
    RefreshTokenRepository,
    RoleRepository,
    PermissionRepository,
    AuthAuditRepository,
];

@Module({
    imports: [TypeOrmModule.forFeature(authDatabaseEntities)],
    providers: authRepositories,
    exports: [TypeOrmModule, ...authRepositories],
})
export class AuthPersistenceModule {}
