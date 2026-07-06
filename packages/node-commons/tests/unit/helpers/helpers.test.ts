import { getOsEnv } from '../../../src';

describe('env-helpers', (): void => {
    describe('getOsEnv', (): void => {
        it('should return undefined when property does not exist', (): void => {
            expect(getOsEnv('NODE_COMMONS_UNKNOWN_ENV')).toBeUndefined();
        });

        it('should return the value from .env.test when property exists', (): void => {
            expect(getOsEnv('NODE_COMMONS_TEST_ENV')).toBe('loaded-from-env-test');
        });
    });
});
