import { DataSource } from 'typeorm';
import { ORDER_PERMISSIONS } from '@fuel-pass/contracts/backend';
import { PermissionEntity, RoleEntity, RolePermissionEntity, UserCredentialEntity, UserEntity, UserRoleEntity } from '../../../src/auth/entities';
import { authDatabaseEntities } from '../../../src/configs/typeorm.config';
import { seedAuthData } from '../../../src/database/seed';

describe('auth seed data with SQLite', () => {
    let dataSource: DataSource;

    beforeEach(async () => {
        dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            entities: authDatabaseEntities,
            synchronize: true,
            dropSchema: true,
        }).initialize();
    });

    afterEach(async () => {
        if (dataSource?.isInitialized === true) {
            await dataSource.destroy();
        }
    });

    it('seeds auth data through TypeORM repositories idempotently', async () => {
        await seedAuthData(dataSource);
        await seedAuthData(dataSource);

        await expect(dataSource.getRepository(RoleEntity).count()).resolves.toBe(3);
        await expect(dataSource.getRepository(PermissionEntity).count()).resolves.toBe(5);
        await expect(dataSource.getRepository(UserEntity).count()).resolves.toBe(3);
        await expect(dataSource.getRepository(UserCredentialEntity).count()).resolves.toBe(3);
        await expect(dataSource.getRepository(UserRoleEntity).count()).resolves.toBe(3);
        await expect(dataSource.getRepository(RolePermissionEntity).count()).resolves.toBe(10);

        await expect(
            dataSource.getRepository(PermissionEntity).findOneByOrFail({ key: ORDER_PERMISSIONS.fuelOrderReadOwn.key })
        ).resolves.toMatchObject({
            resource: ORDER_PERMISSIONS.fuelOrderReadOwn.resource,
            action: ORDER_PERMISSIONS.fuelOrderReadOwn.action,
        });
    });
});
