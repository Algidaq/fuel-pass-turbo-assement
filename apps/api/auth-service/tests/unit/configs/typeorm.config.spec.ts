import { getTypeOrmModuleOptions } from '../../../src/configs/typeorm.config';

describe('getTypeOrmModuleOptions', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env['DB_TYPE'];
        delete process.env['SQLITE_DATABASE'];
        delete process.env['SQLITE_SYNCHRONIZE'];
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('returns Postgres options by default', () => {
        const options = getTypeOrmModuleOptions();

        expect(options).toMatchObject({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'fuel_pass_auth',
            synchronize: false,
        });
        expect(options.entities).toHaveLength(9);
    });

    it('returns SQLite options with configured database path and synchronize flag', () => {
        process.env['DB_TYPE'] = 'sqlite';
        process.env['SQLITE_DATABASE'] = './tmp/auth-test.sqlite';
        process.env['SQLITE_SYNCHRONIZE'] = 'true';

        const options = getTypeOrmModuleOptions();

        expect(options).toMatchObject({
            type: 'sqlite',
            database: './tmp/auth-test.sqlite',
            synchronize: true,
        });
        expect(options.entities).toHaveLength(9);
        expect(options.migrations).toEqual(expect.arrayContaining([expect.stringContaining('/database/migrations/*{.ts,.js}')]));
    });

    it('fails clearly for unsupported database types', () => {
        process.env['DB_TYPE'] = 'mysql';

        expect((): void => {
            getTypeOrmModuleOptions();
        }).toThrow('Unsupported DB_TYPE "mysql". Expected "postgres" or "sqlite".');
    });
});
