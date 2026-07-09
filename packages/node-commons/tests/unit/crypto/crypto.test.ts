import { decrypt, encrypt, getCipherAlgorithm } from '../../../src';

describe('crypto helpers', () => {
    it('selects supported cipher algorithms by key length', () => {
        expect(getCipherAlgorithm(Buffer.alloc(16))).toBe('aes-128-cbc');
        expect(getCipherAlgorithm(Buffer.alloc(32))).toBe('aes-256-cbc');
    });

    it('rejects unsupported key lengths', () => {
        expect(() => getCipherAlgorithm(Buffer.alloc(8))).toThrow('Invalid Key Length 8');
    });

    it('encrypts and decrypts content with base64 key material', () => {
        const key = Buffer.from('1234567890123456').toString('base64');
        const iv = Buffer.from('6543210987654321').toString('base64');

        const encrypted = encrypt('fuel-pass-secret', key, iv);

        expect(encrypted).not.toBe('fuel-pass-secret');
        expect(decrypt(encrypted, key, iv)).toBe('fuel-pass-secret');
    });
});
