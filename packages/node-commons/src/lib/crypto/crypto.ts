import crypto from 'node:crypto';

export function getCipherAlgorithm(key: Buffer): string {
    switch (key.length) {
        case 16:
            return 'aes-128-cbc';
        case 32:
            return 'aes-256-cbc';
        default:
            throw new Error('Invalid Key Length ' + key.length);
    }
}
export function encrypt(content: string, keyBase64: string, ivBase64: string): string {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const encipher = crypto.createCipheriv(getCipherAlgorithm(key), key, iv);
    let encryptedData = encipher.update(content, 'utf8', 'base64');
    encryptedData += encipher.final('base64');
    return encryptedData.replace(/\//g, '-+_');
}

export function decrypt(content: string, keyBase64: string, ivBase64: string): string {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const encipher = crypto.createDecipheriv(getCipherAlgorithm(key), key, iv);
    let decryptedData = encipher.update(content.replace(/-\+_/g, '/'), 'base64', 'utf8');
    decryptedData += encipher.final('utf8');

    return decryptedData;
}
