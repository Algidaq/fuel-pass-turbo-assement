import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordService } from '../../../src/auth/services/password.service';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

function createService(rounds: number | undefined = 12): PasswordService {
    return new PasswordService({
        get: jest.fn((): number | undefined => rounds),
    } as unknown as ConfigService);
}

describe('PasswordService', () => {
    beforeEach(() => {
        bcryptMock.hash.mockReset();
        bcryptMock.compare.mockReset();
    });

    it('hashes passwords with configured bcrypt rounds', async () => {
        bcryptMock.hash.mockResolvedValue('hashed-password' as never);
        const service = createService(10);

        await expect(service.hashPassword('Password123!')).resolves.toBe('hashed-password');
        expect(bcryptMock.hash).toHaveBeenCalledWith('Password123!', 10);
    });

    it('verifies passwords through bcrypt compare', async () => {
        bcryptMock.compare.mockResolvedValue(true as never);
        const service = createService();

        await expect(service.verifyPassword('Password123!', 'hash')).resolves.toBe(true);
        expect(bcryptMock.compare).toHaveBeenCalledWith('Password123!', 'hash');
    });

    it('returns false for invalid password comparisons', async () => {
        bcryptMock.compare.mockResolvedValue(false as never);
        const service = createService();

        await expect(service.verifyPassword('wrong', 'hash')).resolves.toBe(false);
    });
});
